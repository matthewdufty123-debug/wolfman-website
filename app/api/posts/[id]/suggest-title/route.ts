import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, wolfbotConfig } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

// Stub: all users treated as premium. Wire to billing in Release 0.8.
function isPremium(_userId: string): boolean { return true }

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
const DEFAULT_TITLE_PROMPT = `You are a title generator for a mindful morning journal. Read the journal entry and return a single vivid, specific title that captures the core theme or insight of the entry. Return ONLY the title — no quotes, no punctuation at the end, no explanation, nothing else. Maximum {max_words} words and {max_chars} characters.`

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

  // Load title config from wolfbot_config
  const cfgRows = await db
    .select({ key: wolfbotConfig.key, value: wolfbotConfig.value })
    .from(wolfbotConfig)
    .where(inArray(wolfbotConfig.key, [
      'model', 'title_model', 'title_max_tokens', 'title_prompt', 'title_max_words', 'title_max_chars',
    ]))
  const cfg = Object.fromEntries(cfgRows.map(r => [r.key, r.value]))

  const model        = (cfg.title_model     as string) || (cfg.model as string) || DEFAULT_MODEL
  const maxTokens    = (cfg.title_max_tokens as number) || 25
  const maxWords     = (cfg.title_max_words  as number) || 6
  const maxChars     = (cfg.title_max_chars  as number) || 50
  const promptTemplate = (cfg.title_prompt   as string) || DEFAULT_TITLE_PROMPT

  // Substitute {max_words} and {max_chars} placeholders
  const systemPrompt = promptTemplate
    .replace(/\{max_words\}/g, String(maxWords))
    .replace(/\{max_chars\}/g,  String(maxChars))

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Journal entry:\n\n${post.content}` }],
  })

  const suggested = (response.content[0] as { type: string; text: string }).text.trim()
  const inputTokens  = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens

  const newUsed = used + 1
  await db.update(posts).set({
    titleSuggestionsUsed: newUsed,
    titleTokensInput:  (post.titleTokensInput  ?? 0) + inputTokens,
    titleTokensOutput: (post.titleTokensOutput ?? 0) + outputTokens,
  }).where(eq(posts.id, id))

  return NextResponse.json({ title: suggested, suggestionsLeft: 2 - newUsed })
}
