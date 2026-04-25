import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isValidTimezone } from '@/lib/timezone'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const [user] = await db
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ timezone: user?.timezone ?? null })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { timezone } = body

  if (!timezone || typeof timezone !== 'string') {
    return NextResponse.json({ error: 'Timezone is required.' }, { status: 400 })
  }

  if (!isValidTimezone(timezone)) {
    return NextResponse.json({ error: 'Invalid timezone.' }, { status: 400 })
  }

  await db
    .update(users)
    .set({ timezone })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ ok: true })
}
