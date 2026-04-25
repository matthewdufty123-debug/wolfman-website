/**
 * One-time backfill: copy morningReminderTimezone → timezone
 * for users who have the former but not the latter.
 *
 * Usage: npx tsx scripts/backfill-timezone.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users } from '../lib/db/schema'
import { and, isNull, isNotNull, eq } from 'drizzle-orm'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function main() {
  // Find users with morningReminderTimezone set but no timezone
  const candidates = await db
    .select({
      id: users.id,
      morningReminderTimezone: users.morningReminderTimezone,
    })
    .from(users)
    .where(and(isNotNull(users.morningReminderTimezone), isNull(users.timezone)))

  console.log(`Found ${candidates.length} users to backfill`)

  for (const user of candidates) {
    await db
      .update(users)
      .set({ timezone: user.morningReminderTimezone })
      .where(eq(users.id, user.id))
    console.log(`  ✓ ${user.id} → ${user.morningReminderTimezone}`)
  }

  console.log('Done.')
}

main().catch(err => { console.error(err); process.exit(1) })
