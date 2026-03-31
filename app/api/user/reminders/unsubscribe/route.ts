import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('uid')
  const token = searchParams.get('token')

  if (!userId || !token) {
    return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 })
  }

  const secret = process.env.REMINDER_UNSUBSCRIBE_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 })
  }

  const expected = createHmac('sha256', secret).update(userId).digest('hex')
  if (token !== expected) {
    return NextResponse.json({ error: 'Invalid token.' }, { status: 403 })
  }

  await db
    .update(users)
    .set({ morningReminderEnabled: false, morningReminderTime: null, morningReminderTimezone: null })
    .where(eq(users.id, userId))

  // Redirect to settings page with a query param to show confirmation
  return NextResponse.redirect(new URL('/settings?unsubscribed=1', request.url))
}
