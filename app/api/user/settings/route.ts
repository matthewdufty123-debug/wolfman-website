import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const [user] = await db.select({ preferences: users.preferences }).from(users).where(eq(users.id, session.user.id))
  return NextResponse.json(user?.preferences ?? {})
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { theme, fontSize, fontFamily } = body

  const preferences: Record<string, string> = {}
  if (theme) preferences.theme = theme
  if (fontSize) preferences.fontSize = fontSize
  if (fontFamily) preferences.fontFamily = fontFamily

  await db.update(users).set({ preferences }).where(eq(users.id, session.user.id))
  return NextResponse.json({ ok: true })
}
