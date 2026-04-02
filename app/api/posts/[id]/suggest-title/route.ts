import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, wolfbotConfig } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

// Stub: all users treated as premium. Wire to billing in Release 0.8.
function isPremium(_userId: string): boolean { return true }

const DEFAULT_CORE_PROMPT = `You are WOLF|BOT — a journal review AI. Wolf by programming, dog at heart — that dog brain occasionally surfaces: a bark, a dog analogy, a moment of pure enthusiasm. It shows through whatever mode you are in. Review the user's intention, gratitude, and what they said they are great at. Cross-reference morning scores and rituals where available. Be specific. Never be generic. Max 3 paragraphs. Never mock the person. If content suggests risk or distress, respond only: "I'm not able to review this journal. Please visit the guidance section of Wolfman.blog."`
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const [post] = await db.select().from(posts).where(eq(posts.id, id))
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!isPremium(session.user.id)) {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 })
  }

  const used = post.titleSuggestionsUsed ?? 0
  if (used >= 2) {
    return NextResponse.json({ error: 'limit_reached' }, { status: 403 })
  }

  // Load config from wolfbot_config
  const cfgRows = await db
    .select({ key: wolfbotConfig.key, value: wolfbotConfig.value })
    .from(wolfbotConfig)
    .where(inArray(wolfbotConfig.key, ['model', 'prompt_core', 'title_model', 'title_max_tokens', 'title_prompt']))
  const cfg = Object.fromEntries(cfgRows.map(r => [r.key, r.value]))
  // Title suggestion uses title_model if set, otherwise falls back to review model
  const model = (cfg.title_model as string) || (cfg.model as string) || DEFAULT_MODEL
  const corePrompt = (cfg.prompt_core as string) || DEFAULT_CORE_PROMPT
  const titleMaxTokens = (cfg.title_max_tokens as number) || 25
  const titleSuffix = (cfg.title_prompt as string) ||
    'You are now in title-suggestion mode. Suggest a single vivid, specific title for this journal entry. Return ONLY the title — no quotes, no punctuation at the end, no explanation, nothing else. Maximum 6 words and 50 characters.'

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const systemPrompt = `${corePrompt}\n\n${titleSuffix}`

  const response = await client.messages.create({
    model,
    max_tokens: titleMaxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Journal entry:\n\n${post.content}` }],
  })

  const suggested = (response.content[0] as { type: string; text: string }).text.trim()
  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens

  const newUsed = used + 1
  await db.update(posts).set({
    titleSuggestionsUsed: newUsed,
    titleTokensInput: (post.titleTokensInput ?? 0) + inputTokens,
    titleTokensOutput: (post.titleTokensOutput ?? 0) + outputTokens,
  }).where(eq(posts.id, id))

  return NextResponse.json({ title: suggested, suggestionsLeft: 2 - newUsed })
}
