import { db } from '@/lib/db'
import { posts, wolfbotConfig } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'
import { getJournalSections } from '@/lib/db/queries'

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
const DEFAULT_TITLE_PROMPT = `You are a title generator for a mindful morning journal. Read the journal entry and return a single vivid, specific title that captures the core theme or insight of the entry. Return ONLY the title — no quotes, no punctuation at the end, no explanation, nothing else. Maximum {max_words} words and {max_chars} characters.`

async function buildJournalText(postId: string, fallbackContent: string) {
  const sections = await getJournalSections(postId)
  if (sections.intention) {
    const parts = [`Journal entry:\n\nToday's Intention:\n${sections.intention}`]
    if (sections.gratitude) parts.push(`I'm Grateful For:\n${sections.gratitude}`)
    if (sections.greatAt) parts.push(`Something I'm Great At:\n${sections.greatAt}`)
    return parts.join('\n\n')
  }
  return `Journal entry:\n\n${fallbackContent}`
}

/**
 * Generate an AI title for a journal post.
 * Returns the generated title string.
 * Updates titleSuggestionsUsed and token tracking on the post.
 */
export async function generateTitle(postId: string, fallbackContent: string): Promise<string> {
  const cfgRows = await db
    .select({ key: wolfbotConfig.key, value: wolfbotConfig.value })
    .from(wolfbotConfig)
    .where(inArray(wolfbotConfig.key, [
      'model', 'title_model', 'title_max_tokens', 'title_prompt', 'title_max_words', 'title_max_chars',
    ]))
  const cfg = Object.fromEntries(cfgRows.map(r => [r.key, r.value]))

  const model = (cfg.title_model as string) || (cfg.model as string) || DEFAULT_MODEL
  const maxTokens = (cfg.title_max_tokens as number) || 25
  const maxWords = (cfg.title_max_words as number) || 6
  const maxChars = (cfg.title_max_chars as number) || 50
  const promptTemplate = (cfg.title_prompt as string) || DEFAULT_TITLE_PROMPT

  const systemPrompt = promptTemplate
    .replace(/\{max_words\}/g, String(maxWords))
    .replace(/\{max_chars\}/g, String(maxChars))

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: await buildJournalText(postId, fallbackContent) }],
  })

  const title = (response.content[0] as { type: string; text: string }).text.trim()
  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens

  const [post] = await db.select({ used: posts.titleSuggestionsUsed, inp: posts.titleTokensInput, out: posts.titleTokensOutput })
    .from(posts).where(eq(posts.id, postId))

  await db.update(posts).set({
    titleSuggestionsUsed: (post?.used ?? 0) + 1,
    titleTokensInput: (post?.inp ?? 0) + inputTokens,
    titleTokensOutput: (post?.out ?? 0) + outputTokens,
  }).where(eq(posts.id, postId))

  return title
}
