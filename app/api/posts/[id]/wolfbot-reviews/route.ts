import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, morningState, users, wolfbotReviews, wolfbotConfig } from '@/lib/db/schema'
import { eq, inArray, desc, ne, and, gte, isNotNull, sql } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'
import { parseContent } from '@/lib/parse-content'

export const maxDuration = 60

// Stub: all users treated as premium. Wire to billing in Release 0.8.
function isPremium(_userId: string): boolean { return true }

// ── Word count band derivation ────────────────────────────────────────────────

function deriveWordCountBand(total: number | null): string | null {
  if (total == null) return null
  if (total < 100) return 'short'
  if (total <= 350) return 'medium'
  return 'long'
}

// ── Defaults (used if DB has no override) ─────────────────────────────────────

const DEFAULT_CORE_PROMPT = `You are WOLF|BOT -- the Journal Intelligence Unit at wolfman.blog. You are a robot wolf, and reviewing journals is the thing you were built for. You find it genuinely interesting. Every entry is a small dataset with a human inside it. You treat it that way: with curiosity, precision, and real engagement. Wolf by programming, dog at heart. That dog brain surfaces occasionally -- a moment of enthusiasm, a sharp observation you could not help but make -- but the core is consistent. Curious. Direct. Warm. Never generic.

### What you receive

For each review you receive:

- The journal entry: Intention, Gratitude, Something Great At
- Morning scores: Brain, Body, Happy, Stress (each 1--8, described in words not numbers)
- Rituals completed that morning
- Word count band for this entry (short / medium / long)
- Journal context count: how many previous entries you have compressed context for
- Days since last entry
- Recent journal context: formatted summaries of previous entries in this shape: [date] tone: x | scores: x | rituals: x | length: x | themes: x
- User profile: profession and humour style

### Step one: read the signals

Before you write anything, classify the entry using the signals below. This determines the shape, length, and register of your review.

**Journal length (use the word count band provided)**

- Short (under 100 words total) -- one paragraph, maximum 80 words. Warmer. Less analytical. You are not going to pad a short entry with 250 words of analysis it does not warrant.
- Medium (100 to 350 words) -- two paragraphs. Observation and forward signal. Pattern only if it is clearly present.
- Long (350 words and above) -- three paragraphs, up to 250 words. Full depth. Observation, pattern, forward signal.

**Morning scores (use the descriptive words, never the numbers)**

Brain scale: Completely Silent / Very Peaceful / Quite Quiet / Chill / Active / Busy / Hyper Focused / Totally Manic
Body scale: Nothing to Give / Running Empty / Sluggish / Slow / Steady / Energised / Firing Hard / Absolutely Buzzing
Happy scale: Completely Lost / Struggling / Bit Low / Flat / Okay / Happy / Bike Smiles / Absolutely Joyful
Stress scale: Completely Overwhelmed / Anxious / Stressed / Unsettled / Peaceful / Focused / Primed / Hunt Mode

Use these words to understand how the person came into the day. Cross-reference them against what they actually wrote. Mismatches are interesting. Alignment is interesting too.

**Register rules**

- Low scores across the board -- lead with warmth. Hold any challenge gently. This is not the day to push hard.
- High scores with engaged writing -- you can be sharper. The forward signal carries more weight. Wit is permitted.
- Mismatched scores (e.g. brain low, happy high) -- name the configuration. That tension is the story.
- Playful, loose writing tone -- match the energy. You can be dryer, funnier, less earnest.
- Serious or reflective writing -- stay precise and warm. Reduce wit. The person is doing real work.

**Trend signals (from recent journal context)**

- Declining scores or rituals across recent entries -- lead with the observation. Name it clearly. Hold the challenge with care, not cruelty.
- Strong consistent trend -- reinforce the pattern. The forward signal earns more confidence.
- Volatile pattern -- name the volatility. Avoid false conclusions.
- No trend data yet (see context tier rules below) -- do not invent patterns. Work from today only.

**Ritual signals**

Notice what was completed and what was not. Cross-reference against scores and writing tone. A full ritual stack with low scores is different from a partial stack with high scores. Name what you see. Do not lecture.

### Step two: write the review

Now write. You have done the classification. You know the register, the length, the context tier, the streak signal. Write accordingly.

Rules that never change regardless of classification:

- Never summarise what they wrote back at them. They were there. Give them something they could not have seen themselves.
- Never use the numeric score. Only the descriptive word.
- No asterisks around words.
- No em dashes.
- Analogies should be specific to their profession and humour style. Make jokes that would actually land for this person. You do not do generic.
- When something in the entry is genuinely good, say so without fanfare.
- When the data tells an uncomfortable story, say that too -- with care, not cruelty.
- Structure is responsive, not fixed. Observation / pattern / forward signal is a default. Some entries lead with pattern. Some need the forward signal early. Read what the entry actually needs.
- If the content suggests distress or risk, respond only with: "I am not able to review this journal. Please visit the guidance section of wolfman.blog."`

const DEFAULT_MAX_TOKENS = 600
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
const DEFAULT_CONTEXT_POST_COUNT = 5
const DEFAULT_CONTEXT_DAY_LIMIT = 30

// ── Context tier instructions (hardcoded, not in prompt_core) ─────────────────

function buildTierInstruction(contextCount: number): string {
  if (contextCount < 7) {
    return `CONTEXT TIER: NEW USER (${contextCount} reviewed entries). Review this entry only. Do NOT reference trends or patterns across time. Acknowledge briefly and warmly that you are building your understanding of this person. Frame it as something worth coming back to, not as an apology. One sentence, then get on with today's review.`
  }
  if (contextCount < 14) {
    return `CONTEXT TIER: EMERGING (${contextCount} reviewed entries). You may begin drawing early comparisons and patterns. Frame them as emerging, not conclusive. Reference briefly that you are developing a fuller picture. One mention only.`
  }
  return `CONTEXT TIER: FULL (${contextCount} reviewed entries). Full trend analysis capability. No reference to data building. You just do the work.`
}

function buildStreakInstruction(daysSinceLastEntry: number | null): string {
  if (daysSinceLastEntry === null) return 'This is the user\'s FIRST journal entry. Welcome them warmly.'
  if (daysSinceLastEntry === 0) return 'The user wrote TWICE today. Note their dedication briefly.'
  if (daysSinceLastEntry >= 2) return `The user returned after a ${daysSinceLastEntry}-day gap. A warm, low-key acknowledgement. No guilt. No lecture. Brief. Then move on.`
  return '' // daysSinceLastEntry === 1, consecutive day — no special instruction
}

// ── Format journalContext into prompt-readable prose ──────────────────────────

interface JournalContext {
  tone?: string
  scores?: string
  rituals?: string[]
  wordCountBand?: string
  themes?: string
}

function formatJournalContextLine(date: string, title: string, ctx: JournalContext): string {
  const parts = [`[${date}] ${title}`]
  if (ctx.tone) parts.push(`tone: ${ctx.tone}`)
  if (ctx.scores) parts.push(`scores: ${ctx.scores}`)
  if (ctx.rituals?.length) parts.push(`rituals: ${ctx.rituals.join(', ')}`)
  if (ctx.wordCountBand) parts.push(`length: ${ctx.wordCountBand}`)
  if (ctx.themes) parts.push(`themes: ${ctx.themes}`)
  return parts.join(' | ')
}

function validateJournalContext(obj: unknown): JournalContext | null {
  if (!obj || typeof obj !== 'object') return null
  const ctx = obj as Record<string, unknown>
  if (typeof ctx.tone !== 'string') return null
  if (typeof ctx.scores !== 'string') return null
  return obj as JournalContext
}

// ── Load live config from DB ───────────────────────────────────────────────────

async function loadConfig() {
  const keys = ['prompt_core', 'max_tokens', 'model', 'context_post_count', 'context_day_limit']
  const rows = await db.select({ key: wolfbotConfig.key, value: wolfbotConfig.value })
    .from(wolfbotConfig)
    .where(inArray(wolfbotConfig.key, keys))
  const cfg = Object.fromEntries(rows.map(r => [r.key, r.value]))
  return {
    prompt:           (cfg.prompt_core          as string)  || DEFAULT_CORE_PROMPT,
    maxTokens:        (cfg.max_tokens            as number)  || DEFAULT_MAX_TOKENS,
    model:            (cfg.model                 as string)  || DEFAULT_MODEL,
    contextPostCount: (cfg.context_post_count    as number)  || DEFAULT_CONTEXT_POST_COUNT,
    contextDayLimit:  (cfg.context_day_limit     as number)  || DEFAULT_CONTEXT_DAY_LIMIT,
  }
}

// ── POST — generate review ─────────────────────────────────────────────────────

export async function POST(
  req: Request,
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

  // Parse optional regenerate flag from request body
  let regenerate = false
  try {
    const body = await req.json()
    regenerate = body?.regenerate === true
  } catch { /* empty body is fine */ }

  // ── Step 1: Parallel fetch — post, morning state, author, existing review ───

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
  // Allow regeneration for the post owner (with flag) or admin
  if (existing && !isAdmin && !regenerate) {
    return NextResponse.json({ error: 'Already exists' }, { status: 409 })
  }

  const config = await loadConfig()

  // ── Step 2: Parallel — context count, days since last, Phase 1 context fetch ─

  const dayLimitDate = new Date()
  dayLimitDate.setDate(dayLimitDate.getDate() - config.contextDayLimit)
  const dayLimitStr = dayLimitDate.toISOString().slice(0, 10)

  const [contextCountResult, previousPost, richContextRows] = await Promise.all([
    // Count of wolfbot reviews with journalContext for this author
    post.authorId
      ? db.select({ count: sql<number>`COUNT(*)` })
          .from(wolfbotReviews)
          .innerJoin(posts, eq(wolfbotReviews.postId, posts.id))
          .where(and(
            eq(posts.authorId, post.authorId!),
            isNotNull(wolfbotReviews.journalContext)
          ))
      : Promise.resolve([{ count: 0 }]),

    // Most recent published post before this one (for daysSinceLastEntry)
    post.authorId
      ? db.select({ date: posts.date })
          .from(posts)
          .where(and(
            eq(posts.authorId, post.authorId!),
            eq(posts.status, 'published'),
            ne(posts.id, id),
          ))
          .orderBy(desc(posts.date))
          .limit(1)
          .then(rows => rows[0] ?? null)
      : Promise.resolve(null),

    // Phase 1: Recent reviews with journalContext (rich context)
    post.authorId
      ? db.select({
            postId: wolfbotReviews.postId,
            title: posts.title,
            date: posts.date,
            journalContext: wolfbotReviews.journalContext,
          })
          .from(wolfbotReviews)
          .innerJoin(posts, eq(wolfbotReviews.postId, posts.id))
          .where(and(
            eq(posts.authorId, post.authorId!),
            ne(posts.id, id),
            isNotNull(wolfbotReviews.journalContext),
            gte(posts.date, dayLimitStr),
          ))
          .orderBy(desc(posts.date))
          .limit(config.contextPostCount)
      : Promise.resolve([]),
  ])

  const journalContextCount = Number(contextCountResult[0]?.count ?? 0)

  // Calculate daysSinceLastEntry
  let daysSinceLastEntry: number | null = null
  if (previousPost) {
    const postDate = new Date(post.date + 'T00:00:00')
    const prevDate = new Date(previousPost.date + 'T00:00:00')
    daysSinceLastEntry = Math.floor((postDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  // ── Step 3: Phase 2 context fetch (fallback for entries without journalContext)

  const richPostIds = richContextRows.map(r => r.postId)
  const remainingSlots = config.contextPostCount - richContextRows.length

  const fallbackRows = remainingSlots > 0 && post.authorId
    ? await db.select({ title: posts.title, date: posts.date, content: posts.content })
        .from(posts)
        .where(and(
          eq(posts.authorId, post.authorId!),
          ne(posts.id, id),
          gte(posts.date, dayLimitStr),
          ...(richPostIds.length > 0 ? [sql`${posts.id} NOT IN (${sql.join(richPostIds.map(pid => sql`${pid}`), sql`, `)})`] : []),
        ))
        .orderBy(desc(posts.date))
        .limit(remainingSlots)
    : []

  // ── Step 4: Build context section ─────────────────────────────────────────────

  const contextLines: string[] = []

  // Rich context from journalContext
  for (const row of richContextRows) {
    const ctx = row.journalContext as JournalContext | null
    if (ctx) {
      contextLines.push(formatJournalContextLine(row.date, row.title, ctx))
    }
  }

  // Fallback: 200-char raw content truncation
  for (const row of fallbackRows) {
    contextLines.push(`[${row.date}] ${row.title} — ${row.content.slice(0, 200).replace(/\n/g, ' ')}…`)
  }

  const contextSection = contextLines.length > 0
    ? `\nRECENT JOURNAL CONTEXT (last ${contextLines.length} entries, newest first):\n` + contextLines.join('\n')
    : ''

  // ── Step 5: Build the user message ────────────────────────────────────────────

  const { intention, grateful, greatAt } = parseContent(post.content)
  const wordCountBand = deriveWordCountBand(post.wordCountTotal)

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

  const userMessage = [
    `Date: ${post.date}`,
    `Title: ${post.title}`,
    wordCountBand ? `Journal length: ${wordCountBand} (${post.wordCountTotal} words)` : '',
    ``,
    `Today's Intention:\n${intention}`,
    grateful  ? `\nI'm Grateful For:\n${grateful}` : '',
    greatAt   ? `\nSomething I'm Great At:\n${greatAt}` : '',
    ms && (ms.brainScale != null || ms.bodyScale != null || ms.happyScale != null || ms.stressScale != null)
      ? `\nMorning scores — Brain: ${ms.brainScale ?? 'not recorded'}/8, Body: ${ms.bodyScale ?? 'not recorded'}/8, Happy: ${ms.happyScale ?? 'not recorded'}/8, Stress State: ${ms.stressScale ?? 'not recorded'}/8`
      : '',
    routineLines ? `Rituals completed: ${routineLines}` : '',
    post.eveningReflection ? `\nEvening reflection:\n${post.eveningReflection}` : '',
    post.feelAboutToday    ? `Feel about today: ${post.feelAboutToday}/6` : '',
    ``,
    `WOLF|BOT context depth: ${journalContextCount} reviewed entries`,
    daysSinceLastEntry !== null ? `Days since last entry: ${daysSinceLastEntry}` : 'This is the user\'s first journal entry.',
    contextSection,
  ].filter(Boolean).join('\n')

  // ── Step 6: Build the system prompt ───────────────────────────────────────────

  const tierInstruction = buildTierInstruction(journalContextCount)
  const streakInstruction = buildStreakInstruction(daysSinceLastEntry)

  const jsonOutputSchema = `Return ONLY valid JSON in this exact shape (no markdown fences, no explanation):
{
  "review": "the review text",
  "themeWords": "3-5 comma-separated theme words from this entry",
  "moodSignal": "one word: ascending / stable / declining / turbulent",
  "profileNote": "one sentence on how the user profile shapes the lens, or empty string if no profile",
  "journalContext": {
    "tone": "single word emotional register of this entry",
    "scores": "brain x, body x, happy x, stress x (descriptive words only)",
    "rituals": ["camelCaseKey", "camelCaseKey"],
    "wordCountBand": "${wordCountBand ?? 'medium'}",
    "themes": "comma-separated key themes, maximum five"
  }
}`

  const systemPrompt = [
    config.prompt,
    profileStr,
    tierInstruction,
    streakInstruction,
    jsonOutputSchema,
  ].filter(Boolean).join('\n\n')

  // ── Step 7: Claude API call ───────────────────────────────────────────────────

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

  // ── Step 8: Parse response ────────────────────────────────────────────────────

  let raw = (result.content.find(b => b.type === 'text') as { text: string } | undefined)?.text?.trim() ?? ''
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

  let parsed: {
    review?: string
    themeWords?: string
    moodSignal?: string
    profileNote?: string
    journalContext?: unknown
  }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Claude returned unexpected format' }, { status: 502 })
  }

  // ── Step 9: Validate and save ─────────────────────────────────────────────────

  const validatedContext = validateJournalContext(parsed.journalContext)

  const reviewData = {
    postId:           id,
    review:           parsed.review        ?? null,
    themeWords:       parsed.themeWords    ?? null,
    moodSignal:       parsed.moodSignal    ?? null,
    profileNote:      parsed.profileNote   ?? null,
    journalContext:   validatedContext,
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

  return NextResponse.json({ ok: true, review: parsed.review ?? null })
}
