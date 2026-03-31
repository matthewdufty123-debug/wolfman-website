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

  let body: { profession?: string; humourSource?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  await db
    .update(users)
    .set({
      profession:   body.profession?.trim()   || null,
      humourSource: body.humourSource?.trim() || null,
    })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ ok: true })
}
