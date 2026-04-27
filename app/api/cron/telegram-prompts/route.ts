import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, isNotNull } from 'drizzle-orm'
import { getUserLocalDate } from '@/lib/timezone'
import { sendMessageWithButtons, type InlineKeyboardButton } from '@/lib/telegram'
import { findOrCreateTodayPost } from '@/lib/actions/today'
import { fetchTelegramContext } from '@/lib/telegram-context'
import { generatePromptText } from '@/lib/telegram-ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ── Prompt schedule ────────────────────────────────────────────────────────

interface PromptSlot {
  name: 'morning' | 'midday' | 'evening'
  promptType: 'scale' | 'journal'
  subType: string
  fallbackText: string
  buttons: InlineKeyboardButton[][]
  stateAfter: { state: string; type: string }
}

const MORNING_SLOT: PromptSlot = {
  name: 'morning',
  promptType: 'scale',
  subType: 'brain',
  fallbackText: "Good morning! How's your mood? (1-8)",
  buttons: [[1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ text: String(n), callback_data: `val:${n}` }))],
  stateAfter: { state: 'prompting_scale', type: 'brain' },
}

const MIDDAY_SLOT: PromptSlot = {
  name: 'midday',
  promptType: 'scale',
  subType: 'body',
  fallbackText: "Midday check-in! How's your energy? (1-8)",
  buttons: [[1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ text: String(n), callback_data: `val:${n}` }))],
  stateAfter: { state: 'prompting_scale', type: 'body' },
}

const EVENING_SLOT: PromptSlot = {
  name: 'evening',
  promptType: 'journal',
  subType: 'reflection',
  fallbackText: "Evening wind-down. How did your day go?",
  buttons: [[{ text: 'Skip', callback_data: 'skip' }]],
  stateAfter: { state: 'prompting_journal', type: 'reflection' },
}

// ── Time helpers ───────────────────────────────────────────────────────────

function getUserLocalHHMM(timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

function isInWindow(localHHMM: string, targetTime: string): boolean {
  const [lh, lm] = localHHMM.split(':').map(Number)
  const [th, tm] = targetTime.split(':').map(Number)
  const localMins = lh * 60 + lm
  const targetMins = th * 60 + tm
  const windowStart = Math.floor(localMins / 15) * 15
  return targetMins >= windowStart && targetMins < windowStart + 15
}

function formatDateInTz(date: Date, timezone: string): string {
  const [d, m, y] = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date).split('/')
  return `${y}-${m}-${d}`
}

function getHourInTz(timezone: string): number {
  return parseInt(
    new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', hour12: false }).format(new Date()),
    10
  )
}

// ── Cron handler ───────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const candidates = await db
    .select({
      id: users.id,
      name: users.name,
      timezone: users.timezone,
      profession: users.profession,
      humourSource: users.humourSource,
      telegramChatId: users.telegramChatId,
      telegramMorningTime: users.telegramMorningTime,
      telegramMiddayEnabled: users.telegramMiddayEnabled,
      telegramEveningEnabled: users.telegramEveningEnabled,
      lastTelegramPromptSentAt: users.lastTelegramPromptSentAt,
      telegramState: users.telegramState,
    })
    .from(users)
    .where(
      eq(users.telegramPromptsEnabled, true),
    )

  let sent = 0
  let skipped = 0

  for (const user of candidates) {
    const tz = user.timezone
    if (!user.telegramChatId || !tz) {
      skipped++
      continue
    }

    const localTime = getUserLocalHHMM(tz)
    const todayLocal = getUserLocalDate(tz)

    // Determine which slot we're in
    const slot = matchSlot(localTime, user)
    if (!slot) {
      skipped++
      continue
    }

    // Duplicate prevention: check if already sent a prompt today in this slot's hour range
    if (user.lastTelegramPromptSentAt) {
      const lastSentDate = formatDateInTz(user.lastTelegramPromptSentAt, tz)
      if (lastSentDate === todayLocal) {
        // Check if it was in the same slot (within 2 hours)
        const lastSentHour = parseInt(
          new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(user.lastTelegramPromptSentAt),
          10
        )
        const currentHour = getHourInTz(tz)
        if (Math.abs(currentHour - lastSentHour) < 2) {
          skipped++
          continue
        }
      }
    }

    try {
      // Ensure today's post exists
      const todayData = await findOrCreateTodayPost(user.id, tz)
      const postId = todayData.post.id

      // Generate contextual prompt
      let promptText = slot.fallbackText
      try {
        const context = await fetchTelegramContext(user, postId)
        const aiText = await generatePromptText(slot.promptType, slot.subType, context)
        if (aiText) promptText = aiText
      } catch {
        // Fallback silently
      }

      // Send the prompt
      const chatId = user.telegramChatId
      await sendMessageWithButtons(chatId, promptText, slot.buttons)

      // Set conversation state so the reply routes correctly
      await db.update(users).set({
        telegramState: {
          state: slot.stateAfter.state,
          type: slot.stateAfter.type,
          postId,
          date: todayLocal,
        },
        lastTelegramPromptSentAt: new Date(),
      }).where(eq(users.id, user.id))

      sent++
    } catch (err) {
      console.error(`[telegram-prompts] Failed for user ${user.id}:`, err)
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped })
}

// ── Slot matching ──────────────────────────────────────────────────────────

function matchSlot(
  localTime: string,
  user: {
    telegramMorningTime: string | null
    telegramMiddayEnabled: boolean
    telegramEveningEnabled: boolean
  },
): PromptSlot | null {
  // Morning — user-configured time, default 07:00
  const morningTime = user.telegramMorningTime ?? '07:00'
  if (isInWindow(localTime, morningTime)) return MORNING_SLOT

  // Midday — 13:00
  if (user.telegramMiddayEnabled && isInWindow(localTime, '13:00')) return MIDDAY_SLOT

  // Evening — 20:00
  if (user.telegramEveningEnabled && isInWindow(localTime, '20:00')) return EVENING_SLOT

  return null
}
