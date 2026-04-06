import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { db } from '@/lib/db'
import { users, posts } from '@/lib/db/schema'
import { eq, and, gte } from 'drizzle-orm'
import { sendMorningReminder } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function makeUnsubscribeUrl(userId: string): string {
  const secret = process.env.REMINDER_UNSUBSCRIBE_SECRET ?? ''
  const token = createHmac('sha256', secret).update(userId).digest('hex')
  return `https://wolfman.app/api/user/reminders/unsubscribe?uid=${userId}&token=${token}`
}

function getUserLocalHHMM(timezone: string): string {
  // Returns the user's current local time as 'HH:MM'
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

function getUserLocalDateString(timezone: string): string {
  // Returns 'YYYY-MM-DD' in the user's timezone
  const [day, month, year] = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).split('/')
  return `${year}-${month}-${day}`
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Fetch all users with reminders enabled
  const candidates = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      morningReminderTime: users.morningReminderTime,
      morningReminderTimezone: users.morningReminderTimezone,
      lastReminderSentAt: users.lastReminderSentAt,
    })
    .from(users)
    .where(eq(users.morningReminderEnabled, true))

  let sent = 0
  let skipped = 0

  for (const user of candidates) {
    if (!user.email || !user.morningReminderTime || !user.morningReminderTimezone) {
      skipped++
      continue
    }

    // Check if it's the right time (within this 15-min window)
    const localTime = getUserLocalHHMM(user.morningReminderTimezone)
    if (localTime !== user.morningReminderTime) {
      skipped++
      continue
    }

    // Guard: don't send twice in the same day
    const todayLocal = getUserLocalDateString(user.morningReminderTimezone)
    if (user.lastReminderSentAt) {
      const lastSentLocal = new Intl.DateTimeFormat('en-GB', {
        timeZone: user.morningReminderTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(user.lastReminderSentAt).split('/').reverse().join('-')
      // lastSentLocal is YYYY-MM-DD
      const [d, m, y] = new Intl.DateTimeFormat('en-GB', {
        timeZone: user.morningReminderTimezone,
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

    // Check if user has already posted today (use UTC midnight as boundary)
    const todayUTCStart = new Date()
    todayUTCStart.setUTCHours(0, 0, 0, 0)
    const [existingPost] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(
        and(
          eq(posts.authorId, user.id),
          gte(posts.createdAt, todayUTCStart)
        )
      )
      .limit(1)

    if (existingPost) {
      skipped++
      continue
    }

    // Send the reminder
    try {
      await sendMorningReminder({
        to: user.email,
        name: user.name,
        unsubscribeUrl: makeUnsubscribeUrl(user.id),
      })
      // Update lastReminderSentAt
      await db
        .update(users)
        .set({ lastReminderSentAt: new Date() })
        .where(eq(users.id, user.id))
      sent++
    } catch {
      // Non-fatal — log and continue to next user
      console.error(`[morning-reminder] Failed to send to ${user.id}`)
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped })
}
