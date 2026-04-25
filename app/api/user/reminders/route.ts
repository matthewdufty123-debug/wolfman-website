import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const [user] = await db
    .select({
      morningReminderEnabled: users.morningReminderEnabled,
      morningReminderTime: users.morningReminderTime,
    })
    .from(users)
    .where(eq(users.id, session.user.id))

  return NextResponse.json(user ?? {})
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { enabled, time } = body

  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be a boolean.' }, { status: 400 })
  }

  if (enabled) {
    if (!TIME_RE.test(time ?? '')) {
      return NextResponse.json({ error: 'time must be HH:MM.' }, { status: 400 })
    }
  }

  // Read the user's canonical timezone to sync into morningReminderTimezone
  const [user] = await db
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, session.user.id))

  await db
    .update(users)
    .set({
      morningReminderEnabled: enabled,
      morningReminderTime: enabled ? time : null,
      morningReminderTimezone: enabled ? (user?.timezone ?? null) : null,
    })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ ok: true })
}
