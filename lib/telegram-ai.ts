/**
 * Haiku integration for Telegram bot — contextual prompt generation
 * and freeform input parsing. Every call returns null on failure
 * so the state machine can fall back to fixed text.
 */

import Anthropic from '@anthropic-ai/sdk'
import { type TelegramContext, formatContextForPrompt } from '@/lib/telegram-context'

const MODEL = 'claude-haiku-4-5-20251001'

// ── Scale labels for prompts ───────────────────────────────────────────────

const SCALE_NAMES: Record<string, string> = {
  brain: 'mood/focus',
  body: 'physical energy',
  happy: 'happiness',
  stress: 'stress level',
}

const JOURNAL_NAMES: Record<string, string> = {
  intention: "today's intention — a thought, observation, or lesson for the day",
  gratitude: 'something specific they\'re grateful for — vivid and personal, never generic',
  great_at: 'something they\'re great at — a strength, owned with confidence',
  reflection: 'how their day went — an honest evening reflection',
}

// ── Prompt generation ──────────────────────────────────────────────────────

export async function generatePromptText(
  promptType: 'scale' | 'journal',
  subType: string,
  context: TelegramContext,
): Promise<string | null> {
  const contextBlock = formatContextForPrompt(context)

  const systemPrompt = promptType === 'scale'
    ? buildScaleSystem(subType)
    : buildJournalSystem(subType)

  try {
    const client = new Anthropic()
    const result = await client.messages.create({
      model: MODEL,
      max_tokens: 100,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Context:\n${contextBlock}\n\nGenerate the check-in message.` }],
    })

    const text = (result.content.find(b => b.type === 'text') as { text: string } | undefined)?.text?.trim()

    console.log(`[Telegram/Haiku] prompt gen — model=${MODEL} in=${result.usage?.input_tokens ?? 0} out=${result.usage?.output_tokens ?? 0}`)

    return text || null
  } catch (err) {
    console.error('[Telegram/Haiku] prompt generation failed:', err)
    return null
  }
}

function buildScaleSystem(scaleType: string): string {
  const name = SCALE_NAMES[scaleType] ?? scaleType
  return `You are the Wolfman Telegram bot. Generate a short, warm check-in message asking about the user's ${name}. Keep it 1-2 sentences. Match the Wolfman tone: honest, warm, self-aware, never preachy. Reference context only if it adds something genuine — don't force it. Do NOT include the scale numbers or rating instructions — the system appends 1-8 buttons automatically.`
}

function buildJournalSystem(journalType: string): string {
  const desc = JOURNAL_NAMES[journalType] ?? journalType
  return `You are the Wolfman Telegram bot. Generate a short, warm prompt asking the user to write about ${desc}. Keep it 1-2 sentences. Match the Wolfman tone: honest, warm, self-aware, never preachy. If their recent context suggests continuity, you can gently reference it — but only if natural. Do NOT include skip instructions — the system adds a Skip button automatically.`
}

// ── Freeform scale parsing ─────────────────────────────────────────────────

export async function parseScaleFromText(
  text: string,
  scaleType: string,
): Promise<number | null> {
  try {
    const client = new Anthropic()
    const result = await client.messages.create({
      model: MODEL,
      max_tokens: 20,
      system: `The user is responding to a ${SCALE_NAMES[scaleType] ?? scaleType} scale prompt (1-8). Extract the numeric value if present. Return ONLY valid JSON: { "value": N } where N is 1-8, or { "value": null } if no clear number.`,
      messages: [{ role: 'user', content: text }],
    })

    const raw = (result.content.find(b => b.type === 'text') as { text: string } | undefined)?.text?.trim()

    console.log(`[Telegram/Haiku] scale parse — model=${MODEL} in=${result.usage?.input_tokens ?? 0} out=${result.usage?.output_tokens ?? 0}`)

    if (!raw) return null

    const parsed = JSON.parse(raw) as { value: number | null }
    if (typeof parsed.value === 'number' && parsed.value >= 1 && parsed.value <= 8) {
      return parsed.value
    }
    return null
  } catch (err) {
    console.error('[Telegram/Haiku] scale parsing failed:', err)
    return null
  }
}
