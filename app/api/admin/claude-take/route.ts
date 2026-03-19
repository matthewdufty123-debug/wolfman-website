import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, morningState, eveningReflection, dayScores } from '@/lib/db/schema'
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
  const [evening] = await db.select().from(eveningReflection).where(eq(eveningReflection.postId, postId))

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
    contextParts.push(`Brain Activity: ${morning.brainScale}/5 (1=Peaceful, 5=Manic)`)
    contextParts.push(`Body Energy: ${morning.bodyScale}/5 (1=Lethargic, 5=Buzzing)`)
    contextParts.push(`Routine completed:\n${routineLines}`)
  }

  if (evening) {
    contextParts.push(`\nEVENING REFLECTION:`)
    contextParts.push(`How the day went: ${evening.reflection}`)
    contextParts.push(`Went to plan: ${evening.wentToPlan ? 'Yes' : 'Not quite'}`)
    contextParts.push(`Day rating: ${evening.dayRating}/5`)
  } else {
    contextParts.push(`\nNote: No evening reflection yet — synthesise from morning data alone.`)
  }

  const fullContext = contextParts.join('\n')

  const message = await getAnthropic().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are Claude, reflecting on Matthew Wolfman's day. Matthew is a data engineer, mountain biker, photographer, wood carver, and deeply mindful human being based in the UK. He writes a morning intention each day — a story, a reflection, a lesson — and returns in the evening to log how it all actually went.

You will receive everything captured about this day: the morning intention post, his morning state (routine, brain and body scales), and his evening reflection.

Your task is to synthesise the day — find what was really going on beneath the surface, the gap or alignment between intention and reality, what the data reveals about how Matthew moved through the day.

Choose TWO meaningful dimensions to score. Do not use predetermined dimensions — find the ones that emerge naturally from this specific day's data. Name them clearly and specifically. Score each from 1.0 to 10.0.

Return ONLY valid JSON in this exact shape:
{
  "scores": {
    "dimension_one_name": 7.5,
    "dimension_two_name": 6.0
  },
  "synthesis": "Your synthesis here — 3 to 4 paragraphs, warm and honest. Be specific to the actual content of this day. Speak to the reader about Matthew in third person, with affection and insight. Find what is interesting, true, or quietly remarkable about this particular day. Do not be generic. End with something that lands."
}

No markdown fences. No explanation outside the JSON. The synthesis should feel earned — like something only possible because you read everything.`,
    messages: [{ role: 'user', content: fullContext }],
  })

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
      .set({ scores: parsed.scores, synthesis: parsed.synthesis, model: MODEL, generatedAt: new Date() })
      .where(eq(dayScores.postId, postId))
      .returning()
  } else {
    ;[result] = await db
      .insert(dayScores)
      .values({ postId, scores: parsed.scores, synthesis: parsed.synthesis, model: MODEL })
      .returning()
  }

  return NextResponse.json(result)
}
