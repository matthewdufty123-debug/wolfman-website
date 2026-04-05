/**
 * One-time migration: remap morning_state scale values from 1–6 to 1–8.
 *
 * Old → New mapping:
 *   1 → 1  (bottom stays bottom)
 *   2 → 2
 *   3 → 4  (middle stretches out)
 *   4 → 5
 *   5 → 7  (upper stretches out)
 *   6 → 8  (top stays top)
 *
 * Run with: npx tsx lib/db/migrate-scales-1-8.ts
 */

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  // Use a CASE expression to remap all four scale columns atomically
  const result = await sql`
    UPDATE morning_state
    SET
      brain_scale  = CASE brain_scale  WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 4 WHEN 4 THEN 5 WHEN 5 THEN 7 WHEN 6 THEN 8 ELSE brain_scale  END,
      body_scale   = CASE body_scale   WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 4 WHEN 4 THEN 5 WHEN 5 THEN 7 WHEN 6 THEN 8 ELSE body_scale   END,
      happy_scale  = CASE happy_scale  WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 4 WHEN 4 THEN 5 WHEN 5 THEN 7 WHEN 6 THEN 8 ELSE happy_scale  END,
      stress_scale = CASE stress_scale WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 4 WHEN 4 THEN 5 WHEN 5 THEN 7 WHEN 6 THEN 8 ELSE stress_scale END
    WHERE brain_scale BETWEEN 1 AND 6
       OR body_scale  BETWEEN 1 AND 6
  `

  console.log(`Migration complete. Rows affected: ${result.length ?? '(neon http driver does not return count)'}`)
  console.log('All morning_state scale values have been remapped from 1–6 to 1–8.')
}

main().catch(err => { console.error(err); process.exit(1) })
