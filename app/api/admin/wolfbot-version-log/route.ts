import { auth } from '@/auth'
import { db } from '@/lib/db'
import { wolfbotVersionLog } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

// GET — return last 30 version log entries, newest first
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const rows = await db
    .select()
    .from(wolfbotVersionLog)
    .orderBy(desc(wolfbotVersionLog.id))
    .limit(30)

  return NextResponse.json(rows)
}
