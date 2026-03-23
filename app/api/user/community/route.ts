import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let body: { communityEnabled?: boolean; defaultPublic?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const communityEnabled = Boolean(body.communityEnabled)
  const defaultPublic = communityEnabled ? Boolean(body.defaultPublic) : false

  await db
    .update(users)
    .set({ communityEnabled, defaultPublic })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ ok: true })
}
