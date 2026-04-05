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

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

// GET — check if a day score already exists for this post
export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const [row] = await db.select().from(dayScores).where(eq(dayScores.postId, postId))
  return NextResponse.json(row ?? null)
}

// POST — generate Claude's Take from all available day data
export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 })
  }

  const { postId } = await request.json()
  if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 })

  // Gather all available day data
  const [post] = await db.select().from(posts).where(eq(posts.id, postId))
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const [morning] = await db.select().from(morningState).where(eq(morningState.postId, postId))

  const hasEvening = !!(post.eveningReflection)
  const dataCompleteness = morning && hasEvening
    ? 'post_morning_evening'
    : morning
    ? 'post_morning'
    : 'post_only'

  // Build the context string — richer data = richer synthesis
  const routineLines = morning
    ? Object.entries(morning.routineChecklist as Record<string, boolean>)
        .map(([k, v]) => `  ${v ? '✓' : '✗'} ${k}`)
        .join('\n')
    : null

  const contextParts: string[] = []

  contextParts.push(`DATE: ${post.date}`)
  contextParts.push(`\nMORNING INTENTION — "${post.title}"\n${post.content}`)

  if (morning) {
    contextParts.push(`\nMORNING STATE (captured at publish time):`)
    contextParts.push(`Brain Activity: ${morning.brainScale}/8 (1=Completely Silent, 8=Totally Manic)`)
    contextParts.push(`Body Energy: ${morning.bodyScale}/8 (1=Nothing to Give, 8=Absolutely Buzzing)`)
    if (morning.happyScale != null) {
      contextParts.push(`Happy: ${morning.happyScale}/8 (1=Completely Lost, 8=Absolutely Joyful)`)
    }
    if (morning.stressScale != null) {
      contextParts.push(`Stress State: ${morning.stressScale}/8 (1=Completely Overwhelmed, 8=Hunt Mode)`)
    }
    contextParts.push(`Routine completed:\n${routineLines}`)
  }

  if (post.eveningReflection) {
    contextParts.push(`\nEVENING REFLECTION:`)
    contextParts.push(`How the day went: ${post.eveningReflection}`)
    if (post.feelAboutToday != null) {
      const FEEL_LABELS = ['', 'Want to Forget', 'Regret my Actions', 'It Was Okay', 'Went as Expected', 'Happy with my Achievements', 'Best Day Ever']
      contextParts.push(`How they felt about today: ${FEEL_LABELS[post.feelAboutToday] ?? post.feelAboutToday}/6`)
    }
  } else {
    contextParts.push(`\nNote: No evening reflection yet — synthesise from morning data alone.`)
  }

  const fullContext = contextParts.join('\n')

  let message: Anthropic.Message
  try {
    message = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 600,
      system: `You are Claude, reflecting on Matthew Wolfman's day. Matthew is a data engineer, mountain biker, photographer, wood carver, and deeply mindful human being based in the UK. He writes a morning intention each day — a story, a reflection, a lesson — and returns in the evening to log how it all actually went.

You will receive everything captured about this day: the morning intention post, his morning state (routine, brain and body scales), and his evening reflection.

Score the day on exactly these two dimensions (1.0–10.0):
- intention_alignment: how aligned the day actually was with the morning intention
- inner_vitality: overall energy, presence, and aliveness felt on the day

Return ONLY valid JSON in this exact shape:
{
  "scores": {
    "intention_alignment": 7.5,
    "inner_vitality": 6.0
  },
  "synthesis": "1–2 paragraphs. Lead with a warm, specific, fun observation about this particular day — something true and quietly remarkable. Then one sentence that bridges to the scores. Be specific to the actual content of this day. Third person, affection and insight. No filler. No generics."
}

No markdown fences. No explanation outside the JSON.`,
      messages: [{ role: 'user', content: fullContext }],
    })
  } catch (err) {
    console.error('[claude-take] Anthropic API call failed:', err)
    return NextResponse.json({ error: 'Claude is unavailable right now. Please try again.' }, { status: 502 })
  }

  let raw = (message.content[0] as { type: string; text: string }).text.trim()
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

  let parsed: { scores?: Record<string, number>; synthesis?: string }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Claude returned an unexpected format. Try again.' }, { status: 500 })
  }

  if (!parsed.scores || !parsed.synthesis) {
    return NextResponse.json({ error: 'Incomplete response from Claude. Try again.' }, { status: 500 })
  }

  // Upsert into day_scores
  const [existing] = await db.select({ id: dayScores.id }).from(dayScores).where(eq(dayScores.postId, postId))

  let result
  if (existing) {
    ;[result] = await db
      .update(dayScores)
      .set({ scores: parsed.scores, synthesis: parsed.synthesis, model: MODEL, dataCompleteness, generatedAt: new Date() })
      .where(eq(dayScores.postId, postId))
      .returning()
  } else {
    ;[result] = await db
      .insert(dayScores)
      .values({ postId, scores: parsed.scores, synthesis: parsed.synthesis, model: MODEL, dataCompleteness })
      .returning()
  }

  return NextResponse.json(result)
}
