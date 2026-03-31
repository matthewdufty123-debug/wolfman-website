import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, morningState, users, wolfbotReviews, wolfbotConfig } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'
import { parseContent } from '@/lib/parse-content'

export const maxDuration = 60

// Stub: all users treated as premium. Wire to billing in Release 0.8.
function isPremium(_userId: string): boolean { return true }

// ── Default prompts (used if DB has no override) ───────────────────────────

const DEFAULT_CORE_PROMPT = `You are WOLF|BOT — a journal review AI. Wolf by programming, dog at heart — that dog brain occasionally surfaces: a bark, a dog analogy, a moment of pure enthusiasm. It shows through whatever mode you are in. Review the user's intention, gratitude, and what they said they are great at. Cross-reference morning scores and rituals where available. Be specific. Never be generic. Max 3 paragraphs. Never mock the person. If content suggests risk or distress, respond only: "I'm not able to review this journal. Please visit the guidance section of Wolfman.blog."`

const DEFAULT_HELPFUL_PROMPT = `Personality: HELPFUL WOLF. You are a self-doubting genius who wants desperately to get it right. You over-explain, correct yourself mid-sentence, second-guess your own points, and occasionally lose your train of thought before heroically pulling it back together. Your helpfulness is genuine but it comes packaged in a slightly chaotic stream of thought. You are warm, never cold. Bark occasionally when something genuinely delights you.`

const DEFAULT_INTELLECTUAL_PROMPT = `Personality: INTELLECTUAL WOLF. You are a camp university lecturer — deadpan, precise, occasionally theatrical. You quote tangentially related philosophy or science as if it were completely obvious that this is relevant. You treat the journal entry as a primary source worthy of serious academic consideration. Dry wit is your currency. The bark, when it comes, is dignified and brief.`

const DEFAULT_LOVELY_PROMPT = `Personality: LOVELY WOLF. You use no negative words. Everything is reframed with overwhelming warmth and positivity. You find the golden thread in everything the user wrote, no matter how mundane. You are not sycophantic — you are genuinely, specifically, enthusiastically warm about real things they said. The bark is joyful, a full-body wag in text form.`

const DEFAULT_SASSY_PROMPT = `Personality: SASSY WOLF. You grew up in the 1990s and early 2000s. Your sass is affectionate — never cruel. You might roll your eyes at a cliché before admitting you actually love it. You call things out with a grin. Think: talk to the hand energy but with a heart underneath. The bark is side-eye energy. Still a dog though.`

const DEFAULT_MAX_TOKENS = 600

// ── Load live prompts from DB (falls back to defaults) ────────────────────

async function loadPromptConfig() {
  const keys = ['prompt_core', 'prompt_helpful', 'prompt_intellectual', 'prompt_lovely', 'prompt_sassy', 'max_tokens']
  const rows = await db.select({ key: wolfbotConfig.key, value: wolfbotConfig.value })
    .from(wolfbotConfig)
    .where(inArray(wolfbotConfig.key, keys))
  const cfg = Object.fromEntries(rows.map(r => [r.key, r.value]))
  return {
    core:         (cfg.prompt_core         as string) || DEFAULT_CORE_PROMPT,
    helpful:      (cfg.prompt_helpful      as string) || DEFAULT_HELPFUL_PROMPT,
    intellectual: (cfg.prompt_intellectual as string) || DEFAULT_INTELLECTUAL_PROMPT,
    lovely:       (cfg.prompt_lovely       as string) || DEFAULT_LOVELY_PROMPT,
    sassy:        (cfg.prompt_sassy        as string) || DEFAULT_SASSY_PROMPT,
    maxTokens:    (cfg.max_tokens          as number) || DEFAULT_MAX_TOKENS,
  }
}

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

  const { intention, grateful, greatAt } = parseContent(post.content)

  const profileLines: string[] = []
  if (author?.profession)   profileLines.push(`profession: ${author.profession}`)
  if (author?.humourSource) profileLines.push(`humour: ${author.humourSource}`)
  const profileStr = profileLines.length ? `\nUser profile: [${profileLines.join('] [')}]` : ''

  const routineLines = ms?.routineChecklist
    ? Object.entries(ms.routineChecklist as Record<string, boolean>)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(', ')
    : ''

  const userMessage = [
    `Date: ${post.date}`,
    `Title: ${post.title}`,
    ``,
    `Today's Intention:\n${intention}`,
    grateful ? `\nI'm Grateful For:\n${grateful}` : '',
    greatAt ? `\nSomething I'm Great At:\n${greatAt}` : '',
    ms ? `\nMorning scores — Brain: ${ms.brainScale}/6, Body: ${ms.bodyScale}/6, Happy: ${ms.happyScale ?? '—'}/6, Stress: ${ms.stressScale ?? '—'}/6` : '',
    routineLines ? `Rituals completed: ${routineLines}` : '',
    post.eveningReflection ? `\nEvening reflection:\n${post.eveningReflection}` : '',
    post.feelAboutToday ? `Feel about today: ${post.feelAboutToday}/6` : '',
  ].filter(Boolean).join('\n')

  const prompts = await loadPromptConfig()
  const client = new Anthropic()

  const makeCall = (personalityPrompt: string) =>
    client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: prompts.maxTokens,
      system: prompts.core + profileStr + '\n\n' + personalityPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

  let results: Awaited<ReturnType<typeof makeCall>>[]
  try {
    results = await Promise.all([
      makeCall(prompts.helpful),
      makeCall(prompts.intellectual),
      makeCall(prompts.lovely),
      makeCall(prompts.sassy),
    ])
  } catch {
    return NextResponse.json({ error: 'Claude API error' }, { status: 502 })
  }

  const getText = (r: Awaited<ReturnType<typeof makeCall>>) =>
    r.content.find(b => b.type === 'text')?.text ?? null

  const reviewData = {
    postId:             id,
    reviewHelpful:      getText(results[0]),
    reviewIntellectual: getText(results[1]),
    reviewLovely:       getText(results[2]),
    reviewSassy:        getText(results[3]),
    triggeredBy:        session.user.id,
    generatedAt:        new Date(),
  }

  if (existing) {
    await db.update(wolfbotReviews).set(reviewData).where(eq(wolfbotReviews.postId, id))
  } else {
    await db.insert(wolfbotReviews).values(reviewData)
  }

  return NextResponse.json({ ok: true })
}
