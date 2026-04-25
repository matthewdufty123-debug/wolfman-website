/**
 * One-time migration: populate journalEntries and scaleEntries from existing
 * posts.content and morningState scale columns.
 *
 * Idempotent — clears both tables before inserting, safe to re-run.
 * Run via: npx tsx scripts/migrate-to-entries.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { posts, morningState, journalEntries, scaleEntries } from '../lib/db/schema'
import { eq, sql, countDistinct, count } from 'drizzle-orm'
import { parseContent } from '../lib/parse-content'

const sqlClient = neon(process.env.DATABASE_URL!)
const db = drizzle(sqlClient)

const SCALE_COLUMNS = [
  { column: 'brainScale' as const, type: 'brain' },
  { column: 'bodyScale' as const, type: 'body' },
  { column: 'happyScale' as const, type: 'happy' },
  { column: 'stressScale' as const, type: 'stress' },
] as const

async function main() {
  // ── Phase 0: Clear existing entries ──────────────────────────────────
  console.log('=== Phase 0: Clearing existing entries ===')
  await db.delete(journalEntries)
  await db.delete(scaleEntries)
  console.log('  Cleared journal_entries and scale_entries tables.\n')

  // ── Phase 1: Journal entries ─────────────────────────────────────────
  console.log('=== Phase 1: Migrating journal entries ===')

  const allPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      eveningReflection: posts.eveningReflection,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)

  let journalRowsCreated = 0
  const zeroEntryPosts: string[] = []
  const failures: { id: string; title: string; error: string }[] = []

  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i]
    try {
      const { intention, grateful, greatAt } = parseContent(post.content)
      const entries: (typeof journalEntries.$inferInsert)[] = []

      if (intention.trim()) {
        entries.push({
          postId: post.id,
          type: 'intention',
          content: intention,
          source: 'web',
          sortOrder: 0,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        })
      }
      if (grateful.trim()) {
        entries.push({
          postId: post.id,
          type: 'gratitude',
          content: grateful,
          source: 'web',
          sortOrder: 0,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        })
      }
      if (greatAt.trim()) {
        entries.push({
          postId: post.id,
          type: 'great_at',
          content: greatAt,
          source: 'web',
          sortOrder: 0,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        })
      }
      if (post.eveningReflection?.trim()) {
        entries.push({
          postId: post.id,
          type: 'reflection',
          content: post.eveningReflection.trim(),
          source: 'web',
          sortOrder: 0,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        })
      }

      if (entries.length > 0) {
        await db.insert(journalEntries).values(entries)
        journalRowsCreated += entries.length
      } else {
        zeroEntryPosts.push(`${post.id} (${post.title})`)
      }

      console.log(`  [${i + 1}/${allPosts.length}] ${post.title} — ${entries.length} entries`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      failures.push({ id: post.id, title: post.title, error: msg })
      console.error(`  [${i + 1}/${allPosts.length}] FAILED: ${post.title} — ${msg}`)
    }
  }

  console.log(`\n  Phase 1 complete: ${journalRowsCreated} journal entries from ${allPosts.length} posts\n`)

  // ── Phase 2: Scale entries ───────────────────────────────────────────
  console.log('=== Phase 2: Migrating scale entries ===')

  const allMorningState = await db
    .select({
      postId: morningState.postId,
      brainScale: morningState.brainScale,
      bodyScale: morningState.bodyScale,
      happyScale: morningState.happyScale,
      stressScale: morningState.stressScale,
      createdAt: morningState.createdAt,
    })
    .from(morningState)

  let scaleRowsCreated = 0

  for (let i = 0; i < allMorningState.length; i++) {
    const ms = allMorningState[i]
    try {
      const scales: (typeof scaleEntries.$inferInsert)[] = []

      for (const { column, type } of SCALE_COLUMNS) {
        const value = ms[column]
        if (value != null) {
          scales.push({
            postId: ms.postId,
            type,
            value,
            source: 'web',
            createdAt: ms.createdAt,
          })
        }
      }

      if (scales.length > 0) {
        await db.insert(scaleEntries).values(scales)
        scaleRowsCreated += scales.length
      }

      console.log(`  [${i + 1}/${allMorningState.length}] ${ms.postId} — ${scales.length} scales`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      failures.push({ id: ms.postId, title: '(morningState)', error: msg })
      console.error(`  [${i + 1}/${allMorningState.length}] FAILED: ${ms.postId} — ${msg}`)
    }
  }

  console.log(`\n  Phase 2 complete: ${scaleRowsCreated} scale entries from ${allMorningState.length} morning states\n`)

  // ── Phase 3: Verification ───────────────────────────────────────────
  console.log('=== Phase 3: Verification ===')

  const [jeCount] = await db.select({ total: count() }).from(journalEntries)
  const [seCount] = await db.select({ total: count() }).from(scaleEntries)
  const [jePostCount] = await db.select({ total: countDistinct(journalEntries.postId) }).from(journalEntries)
  const [sePostCount] = await db.select({ total: countDistinct(scaleEntries.postId) }).from(scaleEntries)

  console.log(`  Journal entries: ${jeCount.total} rows across ${jePostCount.total} posts`)
  console.log(`  Scale entries:   ${seCount.total} rows across ${sePostCount.total} posts`)

  if (zeroEntryPosts.length > 0) {
    console.log(`\n  ⚠ Zero-entry posts (${zeroEntryPosts.length}):`)
    for (const p of zeroEntryPosts) console.log(`    - ${p}`)
  }

  // Sample spot-check
  const samples = await db
    .select({ postId: journalEntries.postId, type: journalEntries.type, content: journalEntries.content })
    .from(journalEntries)
    .limit(3)

  console.log('\n  Sample entries:')
  for (const s of samples) {
    console.log(`    [${s.type}] ${s.content.slice(0, 80)}${s.content.length > 80 ? '...' : ''}`)
  }

  if (failures.length > 0) {
    console.error(`\n  ✗ ${failures.length} failures:`)
    for (const f of failures) console.error(`    - ${f.id} (${f.title}): ${f.error}`)
    process.exit(1)
  }

  console.log('\nDone. Migration successful.')
  process.exit(0)
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
