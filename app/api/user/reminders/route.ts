import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const VALID_TZ_RE = /^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const [user] = await db
    .select({
      morningReminderEnabled: users.morningReminderEnabled,
      morningReminderTime: users.morningReminderTime,
      morningReminderTimezone: users.morningReminderTimezone,
    })
    .from(users)
    .where(eq(users.id, session.user.id))

  return NextResponse.json(user ?? {})
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { enabled, time, timezone } = body

  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be a boolean.' }, { status: 400 })
  }

  if (enabled) {
    if (!TIME_RE.test(time ?? '')) {
      return NextResponse.json({ error: 'time must be HH:MM.' }, { status: 400 })
    }
    if (!VALID_TZ_RE.test(timezone ?? '')) {
      return NextResponse.json({ error: 'Invalid timezone.' }, { status: 400 })
    }
    // Validate timezone is real
    try { new Intl.DateTimeFormat('en', { timeZone: timezone }) } catch {
      return NextResponse.json({ error: 'Unknown timezone.' }, { status: 400 })
    }
  }

  await db
    .update(users)
    .set({
      morningReminderEnabled: enabled,
      morningReminderTime: enabled ? time : null,
      morningReminderTimezone: enabled ? timezone : null,
    })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ ok: true })
}
