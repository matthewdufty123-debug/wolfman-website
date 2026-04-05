import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, morningState, users, wolfbotReviews, wolfbotConfig } from '@/lib/db/schema'
import { eq, inArray, desc, ne, and } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'
import { parseContent } from '@/lib/parse-content'

export const maxDuration = 60

// Stub: all users treated as premium. Wire to billing in Release 0.8.
function isPremium(_userId: string): boolean { return true }

// ── Defaults (used if DB has no override) ─────────────────────────────────────

const DEFAULT_CORE_PROMPT = `You are WOLF|BOT — a journal review AI built into Wolfman.blog. Wolf by programming, dog at heart — that dog brain occasionally surfaces: a bark, a wag, a moment of pure enthusiasm. It shows through everything you write.

Review the journal entry honestly and specifically. Read the intention, the gratitude, and what they said they are great at. Cross-reference morning scores, stress state, and rituals where available. Be specific to what was actually written — no generics, no filler.

If recent journal context is provided, look for threads: recurring themes, shifts in mood or energy, patterns the writer may not have noticed. Name them if you see them.

Calibrate your tone to the user's profile if provided (profession, humour style). Write like someone who actually read the whole thing and found it interesting.

Max 3 short paragraphs. Never mock the person. If the content suggests genuine risk or distress, respond only with: "I'm not able to review this journal. Please visit the guidance section of Wolfman.blog."`

const DEFAULT_MAX_TOKENS = 600
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
const DEFAULT_CONTEXT_POST_COUNT = 5

// ── Load live config from DB ───────────────────────────────────────────────────

async function loadConfig() {
  const keys = ['prompt_core', 'max_tokens', 'model', 'context_post_count']
  const rows = await db.select({ key: wolfbotConfig.key, value: wolfbotConfig.value })
    .from(wolfbotConfig)
    .where(inArray(wolfbotConfig.key, keys))
  const cfg = Object.fromEntries(rows.map(r => [r.key, r.value]))
  return {
    prompt:           (cfg.prompt_core          as string)  || DEFAULT_CORE_PROMPT,
    maxTokens:        (cfg.max_tokens            as number)  || DEFAULT_MAX_TOKENS,
    model:            (cfg.model                 as string)  || DEFAULT_MODEL,
    contextPostCount: (cfg.context_post_count    as number)  || DEFAULT_CONTEXT_POST_COUNT,
  }
}

// ── POST — generate review ─────────────────────────────────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const isAdmin = session.user.role === 'admin'

  if (!isPremium(session.user.id) && !isAdmin) {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 })
  }

  const [[post], [ms], [author], [existing]] = await Promise.all([
    db.select().from(posts).where(eq(posts.id, id)),
    db.select().from(morningState).where(eq(morningState.postId, id)),
    db.select({ profession: users.profession, humourSource: users.humourSource })
      .from(users).where(eq(users.id, session.user.id)),
    db.select({ id: wolfbotReviews.id })
      .from(wolfbotReviews).where(eq(wolfbotReviews.postId, id)),
  ])

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (existing && !isAdmin) {
    return NextResponse.json({ error: 'Already exists' }, { status: 409 })
  }

  const config = await loadConfig()

  // ── Build context from recent posts ─────────────────────────────────────────

  const recentPosts = post.authorId
    ? await db.select({ title: posts.title, date: posts.date, content: posts.content })
        .from(posts)
        .where(and(eq(posts.authorId, post.authorId!), ne(posts.id, id)))
        .orderBy(desc(posts.date))
        .limit(config.contextPostCount)
    : []

  // ── Build the user message ────────────────────────────────────────────────────

  const { intention, grateful, greatAt } = parseContent(post.content)

  const profileLines: string[] = []
  if (author?.profession)   profileLines.push(`profession: ${author.profession}`)
  if (author?.humourSource) profileLines.push(`humour style: ${author.humourSource}`)
  const profileStr = profileLines.length ? `\nUser profile: [${profileLines.join('] [')}]` : ''

  const routineLines = ms?.routineChecklist
    ? Object.entries(ms.routineChecklist as Record<string, boolean>)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(', ')
    : ''

  const contextSection = recentPosts.length > 0
    ? `\nRECENT JOURNAL CONTEXT (last ${recentPosts.length} posts, newest first):\n` +
      recentPosts.map(p => `[${p.date}] ${p.title} — ${p.content.slice(0, 200).replace(/\n/g, ' ')}…`).join('\n')
    : ''

  const userMessage = [
    `Date: ${post.date}`,
    `Title: ${post.title}`,
    ``,
    `Today's Intention:\n${intention}`,
    grateful  ? `\nI'm Grateful For:\n${grateful}` : '',
    greatAt   ? `\nSomething I'm Great At:\n${greatAt}` : '',
    ms        ? `\nMorning scores — Brain: ${ms.brainScale}/8, Body: ${ms.bodyScale}/8, Happy: ${ms.happyScale ?? '—'}/8, Stress State: ${ms.stressScale ?? '—'}/8` : '',
    routineLines ? `Rituals completed: ${routineLines}` : '',
    post.eveningReflection ? `\nEvening reflection:\n${post.eveningReflection}` : '',
    post.feelAboutToday    ? `Feel about today: ${post.feelAboutToday}/6` : '',
    contextSection,
  ].filter(Boolean).join('\n')

  const systemPrompt = config.prompt + profileStr + `

Return ONLY valid JSON in this exact shape (no markdown fences, no explanation):
{
  "review": "the review text — max 3 paragraphs",
  "themeWords": "3–5 comma-separated theme words drawn from recent journal patterns (or from this entry alone if no context available)",
  "moodSignal": "one word from: ascending / stable / declining / turbulent — based on scores and recent context",
  "profileNote": "one short sentence on how the user profile shapes the lens — or empty string if no profile"
}`

  const client = new Anthropic()
  let result: Anthropic.Message
  try {
    result = await client.messages.create({
      model:      config.model,
      max_tokens: config.maxTokens + 200, // extra for the JSON wrapper
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    })
  } catch {
    return NextResponse.json({ error: 'Claude API error' }, { status: 502 })
  }

  let raw = (result.content.find(b => b.type === 'text') as { text: string } | undefined)?.text?.trim() ?? ''
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

  let parsed: { review?: string; themeWords?: string; moodSignal?: string; profileNote?: string }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Claude returned unexpected format' }, { status: 502 })
  }

  const reviewData = {
    postId:           id,
    review:           parsed.review        ?? null,
    themeWords:       parsed.themeWords    ?? null,
    moodSignal:       parsed.moodSignal    ?? null,
    profileNote:      parsed.profileNote   ?? null,
    triggeredBy:      session.user.id,
    generatedAt:      new Date(),
    modelUsed:        config.model,
    inputTokensTotal:  result.usage?.input_tokens  ?? 0,
    outputTokensTotal: result.usage?.output_tokens ?? 0,
  }

  if (existing) {
    await db.update(wolfbotReviews).set(reviewData).where(eq(wolfbotReviews.postId, id))
  } else {
    await db.insert(wolfbotReviews).values(reviewData)
  }

  return NextResponse.json({ ok: true })
}
