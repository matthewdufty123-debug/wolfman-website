import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, morningState, dayScores } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const maxDuration = 60

const MODEL = 'claude-sonnet-4-6'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 })
  }

  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const [post] = await db.select().from(posts).where(eq(posts.id, id))
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, content } = await request.json()
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 })
  }

  // Fetch morning state for richer context
  const [morning] = await db.select().from(morningState).where(eq(morningState.postId, id))

  const routineLines = morning
    ? Object.entries(morning.routineChecklist as Record<string, boolean>)
        .map(([k, v]) => `  ${v ? '✓' : '✗'} ${k}`)
        .join('\n')
    : null

  const contextParts: string[] = []
  contextParts.push(`DATE: ${post.date}`)
  contextParts.push(`TITLE: ${title.trim()}`)
  contextParts.push(`\nPOST CONTENT:\n${content.slice(0, 8000)}`)

  if (morning) {
    contextParts.push(`\nMORNING STATE:`)
    contextParts.push(`Brain Activity: ${morning.brainScale}/6 (1=Peaceful, 6=Manic)`)
    contextParts.push(`Body Energy: ${morning.bodyScale}/6 (1=Lethargic, 6=Buzzing)`)
    if (morning.happyScale != null) {
      contextParts.push(`Happy Scale: ${morning.happyScale}/6 (1=Far from happy, 6=Joyful)`)
    }
    contextParts.push(`Routine completed:\n${routineLines}`)
  }

  const fullContext = contextParts.join('\n')

  let message: Anthropic.Message
  try {
    message = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 800,
      system: `You are Claude, helping a Wolfman user prepare their morning intention post for publishing.

You will receive their post title, content, and morning state. Return a JSON object with exactly four fields:

1. "excerpt" — An SEO meta description:
   - 150–160 characters including spaces
   - Captures the emotional core or key lesson of this specific post
   - Personal and compelling — something that would stop a reader mid-scroll
   - Never use: "journey", "explore", "dive in", "discover", "delve"
   - No hashtags, no trailing ellipsis

2. "suggestedTitle" — An improved version of the post title:
   - Max 60 characters
   - Warm and human — not clickbait, not corporate
   - Can be the same as the original if it's already strong

3. "synthesis" — Claude's Take: a reflection on this day's intention:
   - 1–2 paragraphs, warm and specific to the actual content
   - Third person perspective, affectionate and insightful
   - No filler. No generic observations.

4. "scores" — Score the intention on two dimensions (1.0–10.0):
   - intention_alignment: how clear and actionable the intention is
   - inner_vitality: the energy and aliveness in the writing

Return ONLY valid JSON. No markdown fences. No explanation outside the JSON.`,
      messages: [{ role: 'user', content: fullContext }],
    })
  } catch (err) {
    console.error('[review] Anthropic API call failed:', err)
    return NextResponse.json({ error: 'Claude is unavailable right now. Please try again.' }, { status: 502 })
  }

  let raw = (message.content[0] as { type: string; text: string }).text.trim()
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

  let parsed: { excerpt?: string; suggestedTitle?: string; synthesis?: string; scores?: Record<string, number> }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Claude returned an unexpected format. Try again.' }, { status: 500 })
  }

  if (!parsed.excerpt || !parsed.suggestedTitle || !parsed.synthesis || !parsed.scores) {
    return NextResponse.json({ error: 'Incomplete response from Claude. Try again.' }, { status: 500 })
  }

  let excerpt = parsed.excerpt.trim()
  if (excerpt.length > 160) {
    excerpt = excerpt.slice(0, 157).replace(/\s\S+$/, '') + '...'
  }

  // Save excerpt to post
  await db.update(posts).set({ excerpt }).where(eq(posts.id, id))

  // Upsert Claude's Take into day_scores
  const [existing] = await db.select({ id: dayScores.id }).from(dayScores).where(eq(dayScores.postId, id))
  if (existing) {
    await db
      .update(dayScores)
      .set({ scores: parsed.scores, synthesis: parsed.synthesis, model: MODEL, dataCompleteness: 'post_only', generatedAt: new Date() })
      .where(eq(dayScores.postId, id))
  } else {
    await db
      .insert(dayScores)
      .values({ postId: id, scores: parsed.scores, synthesis: parsed.synthesis, model: MODEL, dataCompleteness: 'post_only' })
  }

  return NextResponse.json({
    suggestedTitle: parsed.suggestedTitle.trim(),
    synthesis: parsed.synthesis.trim(),
    scores: parsed.scores,
  })
}
