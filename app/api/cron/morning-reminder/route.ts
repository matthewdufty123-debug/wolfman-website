import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { db } from '@/lib/db'
import { users, posts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendMorningReminder } from '@/lib/email'
import { getUserLocalDate } from '@/lib/timezone'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function makeUnsubscribeUrl(userId: string): string {
  const secret = process.env.REMINDER_UNSUBSCRIBE_SECRET ?? ''
  const token = createHmac('sha256', secret).update(userId).digest('hex')
  return `https://wolfman.app/api/user/reminders/unsubscribe?uid=${userId}&token=${token}`
}

function getUserLocalHHMM(timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

function isInCurrentWindow(localHHMM: string, reminderTime: string): boolean {
  const [lh, lm] = localHHMM.split(':').map(Number)
  const [rh, rm] = reminderTime.split(':').map(Number)
  const localMins = lh * 60 + lm
  const reminderMins = rh * 60 + rm
  const windowStart = Math.floor(localMins / 15) * 15
  return reminderMins >= windowStart && reminderMins < windowStart + 15
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const candidates = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      timezone: users.timezone,
      morningReminderTime: users.morningReminderTime,
      morningReminderTimezone: users.morningReminderTimezone,
      lastReminderSentAt: users.lastReminderSentAt,
    })
    .from(users)
    .where(eq(users.morningReminderEnabled, true))

  let sent = 0
  let skipped = 0

  for (const user of candidates) {
    const tz = user.timezone ?? user.morningReminderTimezone
    if (!user.email || !user.morningReminderTime || !tz) {
      skipped++
      continue
    }

    // Check if it's the right time (within this 15-min window)
    const localTime = getUserLocalHHMM(tz)
    if (!isInCurrentWindow(localTime, user.morningReminderTime)) {
      skipped++
      continue
    }

    // Guard: don't send twice in the same day
    const todayLocal = getUserLocalDate(tz)
    if (user.lastReminderSentAt) {
      const [d, m, y] = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(user.lastReminderSentAt).split('/')
      const lastSentDate = `${y}-${m}-${d}`
      if (lastSentDate === todayLocal) {
        skipped++
        continue
      }
    }

    // Check if user has already posted today (using user's local date, not UTC)
    const [existingPost] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(
        and(
          eq(posts.authorId, user.id),
          eq(posts.date, todayLocal)
        )
      )
      .limit(1)

    if (existingPost) {
      skipped++
      continue
    }

    try {
      await sendMorningReminder({
        to: user.email,
        name: user.name,
        unsubscribeUrl: makeUnsubscribeUrl(user.id),
      })
      await db
        .update(users)
        .set({ lastReminderSentAt: new Date() })
        .where(eq(users.id, user.id))
      sent++
    } catch {
      console.error(`[morning-reminder] Failed to send to ${user.id}`)
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped })
}
