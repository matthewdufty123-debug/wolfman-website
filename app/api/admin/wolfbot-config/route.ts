import { auth } from '@/auth'
import { db } from '@/lib/db'
import { wolfbotConfig, wolfbotVersionLog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

// Keys that bump the WOLF|BOT prompt version when changed
const PROMPT_KEYS = new Set([
  'prompt_core', 'prompt_helpful', 'prompt_intellectual',
  'prompt_lovely', 'prompt_sassy', 'max_tokens',
])

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
// Body: { key: string, value: unknown, category?, label?, description? }
// Prompt keys also increment prompt_version and write an audit log row.
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

  // Upsert the config key
  const [existing] = await db
    .select()
    .from(wolfbotConfig)
    .where(eq(wolfbotConfig.key, key))
    .limit(1)

  const oldValue = existing?.value ?? null

  if (!existing) {
    const { category = 'general', label = key, description = null } = body
    await db.insert(wolfbotConfig).values({ key, category, label, value, description })
  } else {
    await db
      .update(wolfbotConfig)
      .set({ value, updatedAt: new Date() })
      .where(eq(wolfbotConfig.key, key))
  }

  // If this is a prompt/generation key, bump prompt_version and write audit log
  if (PROMPT_KEYS.has(key)) {
    // Read current version (default 0 if not set)
    const [vRow] = await db
      .select({ value: wolfbotConfig.value })
      .from(wolfbotConfig)
      .where(eq(wolfbotConfig.key, 'prompt_version'))
      .limit(1)

    const currentVersion = (vRow?.value as number) ?? 0
    const newVersion = currentVersion + 1

    // Upsert prompt_version
    if (!vRow) {
      await db.insert(wolfbotConfig).values({
        key: 'prompt_version',
        category: 'meta',
        label: 'Prompt Version',
        value: newVersion,
        description: 'Auto-increments whenever a prompt or token cap is changed.',
      })
    } else {
      await db
        .update(wolfbotConfig)
        .set({ value: newVersion, updatedAt: new Date() })
        .where(eq(wolfbotConfig.key, 'prompt_version'))
    }

    // Append to audit log
    await db.insert(wolfbotVersionLog).values({
      version:    newVersion,
      keyChanged: key,
      oldValue:   oldValue,
      newValue:   value,
      changedBy:  session.user.id,
    })

    return NextResponse.json({ ok: true, promptVersion: newVersion })
  }

  return NextResponse.json({ ok: true })
}
