/**
 * Telegram bot state machine — handles conversation flow for linked users.
 * Saves journal entries and scale readings to the same tables as the web app.
 */

import { db } from '@/lib/db'
import { users, journalEntries, scaleEntries } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { sendMessage, sendMessageWithButtons, answerCallbackQuery, type TelegramUpdate, type InlineKeyboardButton } from '@/lib/telegram'
import { BRAIN_LABELS, BODY_LABELS, HAPPY_LABELS, STRESS_LABELS } from '@/lib/scale-config'
import { findOrCreateTodayPost } from '@/lib/actions/today'
import { reconstructContent, getEntriesForPost, getScalesForPost } from '@/lib/db/queries'
import { getUserLocalDate } from '@/lib/timezone'
import { fetchTelegramContext } from '@/lib/telegram-context'
import { generatePromptText, parseScaleFromText } from '@/lib/telegram-ai'

// ── Types ──────────────────────────────────────────────────────────────────

interface TelegramSessionState {
  state: 'idle' | 'action_menu' | 'prompting_scale' | 'prompting_journal'
  type?: string
  postId?: string
  date?: string  // YYYY-MM-DD — reset if stale
}

export interface LinkedUser {
  id: string
  name: string | null
  timezone: string | null
  profession: string | null
  humourSource: string | null
  telegramState: unknown
}

// ── Scale/journal labels ───────────────────────────────────────────────────

const SCALE_LABELS: Record<string, string> = {
  brain: 'brain (focus)',
  body: 'body (energy)',
  happy: 'happiness',
  stress: 'stress',
}

const JOURNAL_LABELS: Record<string, string> = {
  intention: "today's intention",
  gratitude: 'something you\'re grateful for',
  great_at: 'something you\'re great at',
  reflection: 'your evening reflection',
}

// ── Main handler ───────────────────────────────────────────────────────────

export async function handleTelegramMessage(
  chatId: number,
  user: LinkedUser,
  update: TelegramUpdate,
): Promise<void> {
  // Answer callback query immediately to clear spinner
  if (update.callback_query) {
    await answerCallbackQuery(update.callback_query.id)
  }

  const callbackData = update.callback_query?.data
  const text = update.message?.text

  // Load or init state
  let session = parseState(user.telegramState)
  const today = getUserLocalDate(user.timezone ?? 'UTC')

  // Reset state if date is stale
  if (session.date !== today) {
    session = { state: 'idle', date: today }
  }

  // Ensure today's post exists
  if (!session.postId) {
    const todayData = await findOrCreateTodayPost(user.id, user.timezone)
    session.postId = todayData.post.id
    session.date = today
  }

  // /start or /menu always shows action menu
  if (text === '/start' || text === '/menu') {
    await showActionMenu(chatId, user.name)
    await updateState(user.id, { ...session, state: 'action_menu' })
    return
  }

  // Route by state
  switch (session.state) {
    case 'idle':
      await showActionMenu(chatId, user.name)
      await updateState(user.id, { ...session, state: 'action_menu' })
      return

    case 'action_menu':
      await handleActionMenuInput(chatId, user, session, callbackData, text)
      return

    case 'prompting_scale':
      await handleScaleInput(chatId, user, session, callbackData, text)
      return

    case 'prompting_journal':
      await handleJournalInput(chatId, user, session, callbackData, text)
      return

    default:
      await showActionMenu(chatId, user.name)
      await updateState(user.id, { ...session, state: 'action_menu' })
  }
}

// ── State handlers ─────────────────────────────────────────────────────────

async function handleActionMenuInput(
  chatId: number,
  user: LinkedUser,
  session: TelegramSessionState,
  callbackData?: string,
  text?: string,
): Promise<void> {
  if (callbackData?.startsWith('scale:')) {
    const type = callbackData.split(':')[1]
    if (type in SCALE_LABELS) {
      await sendScalePrompt(chatId, type, user, session.postId!)
      await updateState(user.id, { ...session, state: 'prompting_scale', type })
      return
    }
  }

  if (callbackData?.startsWith('journal:')) {
    const type = callbackData.split(':')[1]
    if (type in JOURNAL_LABELS) {
      await sendJournalPrompt(chatId, type, user, session.postId!)
      await updateState(user.id, { ...session, state: 'prompting_journal', type })
      return
    }
  }

  if (callbackData === 'done') {
    const summary = await buildSummary(session.postId!)
    await sendMessage(chatId, summary)
    await updateState(user.id, { ...session, state: 'idle' })
    return
  }

  // Unrecognised — re-show menu
  await showActionMenu(chatId, user.name)
  await updateState(user.id, { ...session, state: 'action_menu' })
}

async function handleScaleInput(
  chatId: number,
  user: LinkedUser,
  session: TelegramSessionState,
  callbackData?: string,
  text?: string,
): Promise<void> {
  let value: number | null = null

  // Button tap: val:N
  if (callbackData?.startsWith('val:')) {
    value = parseInt(callbackData.split(':')[1], 10)
  }

  // Free text: regex first, then Haiku parsing as fallback
  if (value === null && text) {
    const match = text.match(/\b([1-8])\b/)
    if (match) {
      value = parseInt(match[1], 10)
    } else {
      value = await parseScaleFromText(text, session.type!)
    }
  }

  if (value === null || value < 1 || value > 8) {
    await sendMessage(chatId, "I need a number between 1 and 8. Tap a button or type a number.")
    return
  }

  await saveScaleEntry(session.postId!, session.type!, value)
  const label = SCALE_LABELS[session.type!] ?? session.type
  await sendMessage(chatId, `${label} logged as ${value}/8.`)
  await showActionMenu(chatId, null)
  await updateState(user.id, { ...session, state: 'action_menu', type: undefined })
}

async function handleJournalInput(
  chatId: number,
  user: LinkedUser,
  session: TelegramSessionState,
  callbackData?: string,
  text?: string,
): Promise<void> {
  // Skip button
  if (callbackData === 'skip') {
    await showActionMenu(chatId, null)
    await updateState(user.id, { ...session, state: 'action_menu', type: undefined })
    return
  }

  // Free text — save as journal entry
  if (text && text.trim()) {
    await saveJournalEntry(session.postId!, session.type!, text.trim())
    const label = JOURNAL_LABELS[session.type!] ?? session.type
    await sendMessage(chatId, `Saved your ${label} entry.`)
    await showActionMenu(chatId, null)
    await updateState(user.id, { ...session, state: 'action_menu', type: undefined })
    return
  }

  await sendMessage(chatId, "Send me some text, or tap Skip.")
}

// ── UI builders ────────────────────────────────────────────────────────────

async function showActionMenu(chatId: number, name: string | null): Promise<void> {
  const greeting = name ? `What would you like to log, ${name}?` : 'What would you like to log?'

  const buttons: InlineKeyboardButton[][] = [
    [
      { text: 'Mood 🧠', callback_data: 'scale:brain' },
      { text: 'Energy 💪', callback_data: 'scale:body' },
      { text: 'Happy 😊', callback_data: 'scale:happy' },
      { text: 'Stress ⚡', callback_data: 'scale:stress' },
    ],
    [
      { text: 'Intention ✍️', callback_data: 'journal:intention' },
      { text: 'Gratitude 🙏', callback_data: 'journal:gratitude' },
    ],
    [
      { text: 'Great At 💪', callback_data: 'journal:great_at' },
      { text: 'Reflection 🌙', callback_data: 'journal:reflection' },
    ],
    [
      { text: '✅ Done', callback_data: 'done' },
    ],
  ]

  await sendMessageWithButtons(chatId, greeting, buttons)
}

async function sendScalePrompt(chatId: number, type: string, user: LinkedUser, postId: string): Promise<void> {
  const label = SCALE_LABELS[type] ?? type
  const fallback = `How's your ${label}? (1-8)`

  // Try Haiku for a contextual prompt
  let promptText = fallback
  try {
    const context = await fetchTelegramContext(user, postId)
    const aiText = await generatePromptText('scale', type, context)
    if (aiText) promptText = aiText
  } catch {
    // Fallback silently
  }

  const SCALE_BUTTON_LABELS: Record<string, readonly string[]> = {
    brain: BRAIN_LABELS,
    body: BODY_LABELS,
    happy: HAPPY_LABELS,
    stress: STRESS_LABELS,
  }
  const labels = SCALE_BUTTON_LABELS[type]
  const buttons: InlineKeyboardButton[][] = labels
    ? [...labels].reverse().map((label, i) => {
        const value = 8 - i
        return [{ text: `${value}  ${label}`, callback_data: `val:${value}` }]
      })
    : [[1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ text: String(n), callback_data: `val:${n}` }))]
  await sendMessageWithButtons(chatId, promptText, buttons)
}

async function sendJournalPrompt(chatId: number, type: string, user: LinkedUser, postId: string): Promise<void> {
  const label = JOURNAL_LABELS[type] ?? type
  const fallback = `Tell me ${label}:`

  // Try Haiku for a contextual prompt
  let promptText = fallback
  try {
    const context = await fetchTelegramContext(user, postId)
    const aiText = await generatePromptText('journal', type, context)
    if (aiText) promptText = aiText
  } catch {
    // Fallback silently
  }

  const buttons: InlineKeyboardButton[][] = [
    [{ text: 'Skip', callback_data: 'skip' }],
  ]
  await sendMessageWithButtons(chatId, promptText, buttons)
}

// ── Data operations ────────────────────────────────────────────────────────

async function saveScaleEntry(postId: string, type: string, value: number, note?: string): Promise<void> {
  await db.insert(scaleEntries).values({
    postId,
    type,
    value,
    note: note ?? null,
    source: 'telegram',
  })
}

async function saveJournalEntry(postId: string, type: string, content: string): Promise<void> {
  // Calculate sort order
  const existing = await db
    .select({ sortOrder: journalEntries.sortOrder })
    .from(journalEntries)
    .where(eq(journalEntries.postId, postId))

  const maxSort = existing.reduce((max, r) => Math.max(max, r.sortOrder), -1)

  await db.insert(journalEntries).values({
    postId,
    type,
    content,
    source: 'telegram',
    sortOrder: maxSort + 1,
  })

  await reconstructContent(postId)
}

async function buildSummary(postId: string): Promise<string> {
  const [entries, scales] = await Promise.all([
    getEntriesForPost(postId),
    getScalesForPost(postId),
  ])

  const lines: string[] = ["Here's what you've logged today:"]

  // Scales
  const scaleLines: string[] = []
  if (scales.brainScale) scaleLines.push(`🧠 Mood: ${scales.brainScale}/8`)
  if (scales.bodyScale) scaleLines.push(`💪 Energy: ${scales.bodyScale}/8`)
  if (scales.happyScale) scaleLines.push(`😊 Happy: ${scales.happyScale}/8`)
  if (scales.stressScale) scaleLines.push(`⚡ Stress: ${scales.stressScale}/8`)
  if (scaleLines.length > 0) {
    lines.push('', ...scaleLines)
  }

  // Journal entries
  const entryTypes = ['intention', 'gratitude', 'great_at', 'reflection'] as const
  const typeLabels: Record<string, string> = {
    intention: '✍️ Intention',
    gratitude: '🙏 Gratitude',
    great_at: '💪 Great At',
    reflection: '🌙 Reflection',
  }
  for (const t of entryTypes) {
    const typeEntries = entries.filter(e => e.type === t)
    if (typeEntries.length > 0) {
      lines.push(`\n${typeLabels[t]}:`)
      for (const e of typeEntries) {
        const preview = e.content.length > 80 ? e.content.slice(0, 80) + '...' : e.content
        lines.push(`  "${preview}"`)
      }
    }
  }

  if (lines.length === 1) {
    return "Nothing logged yet — tap /menu to get started."
  }

  lines.push('\nKeep going, or open wolfman.app/today to continue on the web.')
  return lines.join('\n')
}

// ── State persistence ──────────────────────────────────────────────────────

function parseState(raw: unknown): TelegramSessionState {
  if (raw && typeof raw === 'object' && 'state' in raw) {
    return raw as TelegramSessionState
  }
  return { state: 'idle' }
}

async function updateState(userId: string, state: TelegramSessionState): Promise<void> {
  await db.update(users).set({ telegramState: state }).where(eq(users.id, userId))
}
