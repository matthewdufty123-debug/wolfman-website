import { auth } from '@/auth'
import { db } from '@/lib/db'
import { careerRoles, careerAchievements, careerSkills } from '@/lib/db/schema'
import { eq, asc, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

// ── POST — generate WOLF|BOT career commentary ──────────────────────────────

export async function POST() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Fetch full career state
  const [roles, achievements, skills] = await Promise.all([
    db.select().from(careerRoles).orderBy(asc(careerRoles.sortOrder)),
    db.select().from(careerAchievements).orderBy(asc(careerAchievements.sortOrder)),
    db.select().from(careerSkills).orderBy(asc(careerSkills.name)),
  ])

  // Build role map for context
  const roleMap = new Map(roles.map(r => [r.id, r]))

  // Build the timeline summary for the prompt
  const timelineText = roles.map(r => {
    const roleAchievements = achievements.filter(a => a.roleId === r.id)
    const achievementLines = roleAchievements.map((a, i) =>
      `  ${i + 1}. [${a.theme}] ${a.description}${a.skillTags?.length ? ` (Skills: ${a.skillTags.join(', ')})` : ''}`
    ).join('\n')
    return `## ${r.sortOrder}. ${r.title} at ${r.company}
Type: ${r.employmentType} | ${r.startDate} → ${r.endDate ?? 'present'}${r.isCurrent ? ' (CURRENT)' : ''}
Summary: ${r.summary}
Achievements:
${achievementLines || '  (none)'}`
  }).join('\n\n')

  const manualSkillsText = skills.length > 0
    ? '\n\n## Manual Skills\n' + skills.map(s => `- ${s.name} (${s.theme}, since ${s.firstUsedDate ?? 'unknown'})`).join('\n')
    : ''

  const systemPrompt = `You are WOLF|BOT, a sharp-witted AI companion on Matthew Wolfman's personal website. You review career data with personality — you praise genuine achievement, note interesting patterns, flag data issues, and add dry humour. You know Matthew well: he's a data engineer who values honesty and self-awareness.

Your task: review the career timeline below and generate a short, punchy comment for each achievement. Also generate one overall summary comment.

Rules:
- Keep each comment to 1-2 sentences maximum
- Note skill accumulation patterns ("SQL appears here for the first time in 2002 — twenty-four years and counting")
- Note duration milestones ("This brings Matthew to four years of Databricks experience")
- Flag any date overlaps or data inconsistencies with a ⚠️ prefix
- Be warm but not sycophantic. Dry wit is welcome. Never generic.
- Use Matthew's first name naturally
- For the overall summary, reflect on the full arc of the career

Respond with valid JSON only. No markdown fences. Format:

{
  "summary": "Overall career commentary (2-3 sentences)",
  "achievements": {
    "<achievement_id>": "Comment for this achievement"
  },
  "skills": {
    "<skill_id>": "Comment for this manual skill"
  }
}`

  const userMessage = `Here is Matthew's full career timeline:

${timelineText}
${manualSkillsText}

Achievement IDs for your response:
${achievements.map(a => {
    const role = roleMap.get(a.roleId)
    return `${a.id}: "${a.description.substring(0, 60)}..." (${role?.title} at ${role?.company})`
  }).join('\n')}

${skills.length > 0 ? `\nManual Skill IDs:\n${skills.map(s => `${s.id}: "${s.name}"`).join('\n')}` : ''}

Generate WOLF|BOT commentary for each achievement and an overall summary.`

  try {
    const client = new Anthropic()
    const result = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    // Extract text response
    const textBlock = result.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text in response' }, { status: 502 })
    }

    // Clean and parse JSON
    let jsonStr = textBlock.text.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(jsonStr) as {
      summary: string
      achievements: Record<string, string>
      skills: Record<string, string>
    }

    // Update achievement comments
    let updatedCount = 0
    for (const [id, comment] of Object.entries(parsed.achievements)) {
      if (comment && achievements.some(a => a.id === id)) {
        await db.update(careerAchievements)
          .set({ wolfbotComment: comment })
          .where(eq(careerAchievements.id, id))
        updatedCount++
      }
    }

    // Update manual skill comments
    for (const [id, comment] of Object.entries(parsed.skills ?? {})) {
      if (comment && skills.some(s => s.id === id)) {
        await db.update(careerSkills)
          .set({ wolfbotComment: comment })
          .where(eq(careerSkills.id, id))
        updatedCount++
      }
    }

    return NextResponse.json({
      summary: parsed.summary,
      updatedCount,
      inputTokens: result.usage?.input_tokens,
      outputTokens: result.usage?.output_tokens,
    })
  } catch (err) {
    console.error('Career review error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
