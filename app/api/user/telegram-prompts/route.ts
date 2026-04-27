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
      enabled: users.telegramPromptsEnabled,
      morningTime: users.telegramMorningTime,
      middayEnabled: users.telegramMiddayEnabled,
      eveningEnabled: users.telegramEveningEnabled,
    })
    .from(users)
    .where(eq(users.id, session.user.id))

  return NextResponse.json(user ?? {})
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { enabled, morningTime, middayEnabled, eveningEnabled } = body

  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be a boolean.' }, { status: 400 })
  }

  if (enabled && morningTime && !TIME_RE.test(morningTime)) {
    return NextResponse.json({ error: 'morningTime must be HH:MM.' }, { status: 400 })
  }

  await db
    .update(users)
    .set({
      telegramPromptsEnabled: enabled,
      telegramMorningTime: enabled ? (morningTime ?? '07:00') : null,
      telegramMiddayEnabled: typeof middayEnabled === 'boolean' ? middayEnabled : true,
      telegramEveningEnabled: typeof eveningEnabled === 'boolean' ? eveningEnabled : true,
    })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ ok: true })
}
