import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isValidTimezone } from '@/lib/timezone'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let body: { communityEnabled?: boolean; defaultPublic?: boolean; timezone?: string; profession?: string; humourSource?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const communityEnabled = Boolean(body.communityEnabled)
  const defaultPublic = communityEnabled ? Boolean(body.defaultPublic) : false
  const timezone = body.timezone?.trim() || null

  if (timezone && !isValidTimezone(timezone)) {
    return NextResponse.json({ error: 'Invalid timezone.' }, { status: 400 })
  }

  await db
    .update(users)
    .set({
      communityEnabled,
      defaultPublic,
      onboardingComplete: true,
      timezone,
      profession:    body.profession?.trim()    || null,
      humourSource:  body.humourSource?.trim()  || null,
    })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ ok: true })
}
