import { auth } from '@/auth'
import { db } from '@/lib/db'
import { wolfbotConfig } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

// GET — return all wolfbot_config rows ordered by id
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const rows = await db
    .select()
    .from(wolfbotConfig)
    .orderBy(wolfbotConfig.id)

  return NextResponse.json(rows)
}

// PATCH — upsert a single config value by key
// Body: { key: string, value: unknown }
// Only updates value + updatedAt — structural fields (category, label) are immutable via API
export async function PATCH(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { key, value } = body

  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'key is required' }, { status: 400 })
  }
  if (value === undefined) {
    return NextResponse.json({ error: 'value is required' }, { status: 400 })
  }

  // Fetch existing row to preserve structural fields
  const [existing] = await db
    .select()
    .from(wolfbotConfig)
    .where(eq(wolfbotConfig.key, key))
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: `Unknown config key: ${key}` }, { status: 404 })
  }

  await db
    .update(wolfbotConfig)
    .set({ value, updatedAt: new Date() })
    .where(eq(wolfbotConfig.key, key))

  return NextResponse.json({ ok: true })
}
