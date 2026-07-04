/**
 * #289 — Collapse legacy multi-snapshot scale entries to one per day.
 *
 * The multi-snapshot capture (retired in #288) left some days with several
 * readings per scale. This script keeps the FIRST reading of each day
 * (earliest createdAt — the agreed rule) and deletes the rest. Every note,
 * and a full snapshot of the scale_entries table, is written to an archive
 * file BEFORE anything is deleted.
 *
 * Dry run (default — reports and archives, writes nothing to the DB):
 *   npm run db:collapse-scales
 *
 * Execute (deletes duplicate rows):
 *   npm run db:collapse-scales -- --execute
 *
 * Afterwards run `npm run db:push` to drop the retired note column and
 * legacy morningState scale columns, and add the unique (post_id, type)
 * index. db:push will fail if duplicates remain — run this script first.
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { writeFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { asc, eq, inArray, sql as rawSql } from 'drizzle-orm'
import { posts, scaleEntries } from '../lib/db/schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const EXECUTE = process.argv.includes('--execute')

async function main() {
  const mode = EXECUTE ? 'execute' : 'dry-run'
  console.log(`Collapse scale entries — ${mode.toUpperCase()}\n`)

  const rows = await db
    .select({
      id: scaleEntries.id,
      postId: scaleEntries.postId,
      type: scaleEntries.type,
      value: scaleEntries.value,
      // The note column was removed from the Drizzle schema in #289 but still
      // exists in the database until db:push runs — read it raw for the archive.
      note: rawSql<string | null>`${scaleEntries}."note"`,
      source: scaleEntries.source,
      createdAt: scaleEntries.createdAt,
      date: posts.date,
      title: posts.title,
    })
    .from(scaleEntries)
    .innerJoin(posts, eq(scaleEntries.postId, posts.id))
    .orderBy(asc(scaleEntries.createdAt))

  // Group by (postId, type) — rows are already in createdAt order,
  // so the first row of each group is the day's kept value.
  const groups = new Map<string, typeof rows>()
  for (const row of rows) {
    const key = `${row.postId}:${row.type}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(row)
  }

  const toDelete: typeof rows = []
  const multiDays = new Set<string>()
  for (const group of groups.values()) {
    if (group.length > 1) {
      multiDays.add(group[0].date)
      toDelete.push(...group.slice(1))
    }
  }
  const notes = rows.filter(r => r.note != null && r.note.trim() !== '')

  // Archive BEFORE any deletion: full table snapshot + notes + deletion list.
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const archivePath = `scale-entries-archive-${mode}-${stamp}.json`
  writeFileSync(archivePath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    mode,
    rule: 'first entry of the day wins (earliest createdAt kept)',
    totals: {
      allEntries: rows.length,
      groups: groups.size,
      daysWithMultipleReadings: multiDays.size,
      entriesToDelete: toDelete.length,
      notesArchived: notes.length,
    },
    notes,
    entriesToDelete: toDelete,
    fullSnapshot: rows,
  }, null, 2))

  // Report
  console.log(`Entries in scale_entries:        ${rows.length}`)
  console.log(`Distinct (post, scale) groups:   ${groups.size}`)
  console.log(`Days with multiple readings:     ${multiDays.size}`)
  console.log(`Entries to delete:               ${toDelete.length}`)
  console.log(`Notes archived:                  ${notes.length}`)
  console.log(`Archive written:                 ${archivePath}\n`)

  if (toDelete.length > 0) {
    console.log('Per-day breakdown of what gets collapsed:')
    const byDate = new Map<string, typeof rows>()
    for (const row of toDelete) {
      if (!byDate.has(row.date)) byDate.set(row.date, [])
      byDate.get(row.date)!.push(row)
    }
    for (const [date, entries] of [...byDate].sort()) {
      const detail = entries.map(e => `${e.type}=${e.value}${e.note ? ' (note)' : ''}`).join(', ')
      console.log(`  ${date} — dropping ${entries.length}: ${detail}`)
    }
    console.log()
  }

  if (!EXECUTE) {
    console.log('Dry run — nothing deleted. Review the report and archive, then')
    console.log('run with --execute to collapse.')
    process.exit(0)
  }

  if (toDelete.length === 0) {
    console.log('Nothing to collapse — every (post, scale) already has one entry.')
    process.exit(0)
  }

  // Delete in chunks to stay inside Neon HTTP limits.
  const ids = toDelete.map(r => r.id)
  for (let i = 0; i < ids.length; i += 100) {
    await db.delete(scaleEntries).where(inArray(scaleEntries.id, ids.slice(i, i + 100)))
  }

  // Reconcile: no group should have more than one entry left.
  const after = await db
    .select({ postId: scaleEntries.postId, type: scaleEntries.type })
    .from(scaleEntries)
  const counts = new Map<string, number>()
  for (const row of after) {
    const key = `${row.postId}:${row.type}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const remaining = [...counts.values()].filter(c => c > 1).length

  console.log(`Deleted ${ids.length} entries. Entries now: ${after.length} (expected ${rows.length - ids.length}).`)
  if (remaining > 0 || after.length !== rows.length - ids.length) {
    console.error(`RECONCILIATION FAILED — ${remaining} groups still have duplicates. Investigate before db:push.`)
    process.exit(1)
  }
  console.log('Reconciliation clean — every (post, scale) has exactly one entry.')
  console.log('Now run `npm run db:push` to drop the note column and add the unique index.')
  process.exit(0)
}

main().catch(err => {
  console.error('Collapse failed:', err)
  process.exit(1)
})
