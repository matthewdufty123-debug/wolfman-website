/**
 * Shared query helpers for journalEntries and scaleEntries tables.
 * Used by API routes (dual-write) and read pages (pivot queries).
 */

import { db } from '@/lib/db'
import { journalEntries, scaleEntries, posts } from '@/lib/db/schema'
import { eq, and, sql, asc } from 'drizzle-orm'
import { parseContent } from '@/lib/parse-content'
import { calculateWordCounts } from '@/lib/word-count'

// ── Types ────────────────────────────────────────────────────────────────

type ScaleMap = {
  brainScale: number | null
  bodyScale: number | null
  happyScale: number | null
  stressScale: number | null
}

type MorningInput = {
  brainScale?: number | null
  bodyScale?: number | null
  happyScale?: number | null
  stressScale?: number | null
  [key: string]: unknown
}

// ── Write helpers ────────────────────────────────────────────────────────

/** Insert journal entry rows for a post from concatenated content + optional evening reflection. */
export async function insertJournalEntries(
  postId: string,
  content: string,
  eveningReflection?: string | null,
  createdAt?: Date,
  updatedAt?: Date,
) {
  const { intention, grateful, greatAt } = parseContent(content)
  const now = new Date()
  const ca = createdAt ?? now
  const ua = updatedAt ?? now

  const rows: (typeof journalEntries.$inferInsert)[] = []

  if (intention.trim()) {
    rows.push({ postId, type: 'intention', content: intention, source: 'web', sortOrder: 0, createdAt: ca, updatedAt: ua })
  }
  if (grateful.trim()) {
    rows.push({ postId, type: 'gratitude', content: grateful, source: 'web', sortOrder: 0, createdAt: ca, updatedAt: ua })
  }
  if (greatAt.trim()) {
    rows.push({ postId, type: 'great_at', content: greatAt, source: 'web', sortOrder: 0, createdAt: ca, updatedAt: ua })
  }
  if (eveningReflection?.trim()) {
    rows.push({ postId, type: 'reflection', content: eveningReflection.trim(), source: 'web', sortOrder: 0, createdAt: ca, updatedAt: ua })
  }

  if (rows.length > 0) {
    await db.insert(journalEntries).values(rows)
  }
}

/** Insert scale entry rows for a post from the morning object. */
export async function insertScaleEntries(
  postId: string,
  morning: MorningInput,
  createdAt?: Date,
) {
  const ca = createdAt ?? new Date()
  const SCALE_TYPES = [
    { key: 'brainScale', type: 'brain' },
    { key: 'bodyScale', type: 'body' },
    { key: 'happyScale', type: 'happy' },
    { key: 'stressScale', type: 'stress' },
  ] as const

  const rows: (typeof scaleEntries.$inferInsert)[] = []
  for (const { key, type } of SCALE_TYPES) {
    const value = morning[key]
    if (value != null && typeof value === 'number') {
      rows.push({ postId, type, value, source: 'web', createdAt: ca })
    }
  }

  if (rows.length > 0) {
    await db.insert(scaleEntries).values(rows)
  }
}

/** Delete and reinsert journal entries for a post. Used on content updates. */
export async function replaceJournalEntries(
  postId: string,
  content: string,
  eveningReflection?: string | null,
) {
  await db.delete(journalEntries).where(eq(journalEntries.postId, postId))
  await insertJournalEntries(postId, content, eveningReflection)
}

/** Delete and reinsert scale entries for a post. Used on morning data updates. */
export async function replaceScaleEntries(
  postId: string,
  morning: MorningInput,
) {
  await db.delete(scaleEntries).where(eq(scaleEntries.postId, postId))
  await insertScaleEntries(postId, morning)
}

/** Upsert a single reflection entry. For the EveningSection PUT (no content). */
export async function upsertReflectionEntry(
  postId: string,
  reflection: string | null | undefined,
) {
  // Remove existing reflection
  await db.delete(journalEntries).where(
    and(eq(journalEntries.postId, postId), eq(journalEntries.type, 'reflection'))
  )
  // Insert new one if non-empty
  if (reflection?.trim()) {
    await db.insert(journalEntries).values({
      postId, type: 'reflection', content: reflection.trim(), source: 'web', sortOrder: 0,
    })
  }
}

// ── Entry-level helpers (for /today hub) ─────────────────────────────────

/** Get all journal entry rows for a post (full row data for the hub). */
export async function getEntriesForPost(postId: string) {
  return db
    .select({
      id: journalEntries.id,
      type: journalEntries.type,
      content: journalEntries.content,
      source: journalEntries.source,
      sortOrder: journalEntries.sortOrder,
      createdAt: journalEntries.createdAt,
      updatedAt: journalEntries.updatedAt,
    })
    .from(journalEntries)
    .where(eq(journalEntries.postId, postId))
    .orderBy(asc(journalEntries.sortOrder), asc(journalEntries.createdAt))
}

/**
 * Rebuild posts.content and word counts from all journalEntries rows.
 * Called after every individual entry mutation to maintain dual-write.
 */
export async function reconstructContent(postId: string) {
  const rows = await db
    .select({ type: journalEntries.type, content: journalEntries.content })
    .from(journalEntries)
    .where(eq(journalEntries.postId, postId))
    .orderBy(asc(journalEntries.sortOrder), asc(journalEntries.createdAt))

  // Group entries by type
  const groups: Record<string, string[]> = {}
  for (const row of rows) {
    if (!groups[row.type]) groups[row.type] = []
    groups[row.type].push(row.content)
  }

  const intention = (groups.intention ?? []).join('\n\n')
  const grateful = (groups.gratitude ?? []).join('\n\n')
  const greatAt = (groups.great_at ?? []).join('\n\n')
  const reflection = (groups.reflection ?? []).join('\n\n')

  // Build markdown content (same format as PostForm.buildContent)
  const parts: string[] = []
  if (intention) parts.push(`## Today's Intention\n\n${intention}`)
  if (grateful) parts.push(`## I'm Grateful For\n\n${grateful}`)
  if (greatAt) parts.push(`## Something I'm Great At\n\n${greatAt}`)
  const content = parts.join('\n\n')

  const wordCounts = calculateWordCounts(content)

  await db.update(posts).set({
    content,
    eveningReflection: reflection || null,
    ...wordCounts,
    updatedAt: new Date(),
  }).where(eq(posts.id, postId))
}

// ── Read helpers ─────────────────────────────────────────────────────────

/** Get journal sections for a single post as { intention, gratitude, greatAt, reflection }. */
export async function getJournalSections(postId: string) {
  const rows = await db
    .select({ type: journalEntries.type, content: journalEntries.content })
    .from(journalEntries)
    .where(eq(journalEntries.postId, postId))

  const sections: Record<string, string> = {}
  for (const row of rows) {
    sections[row.type] = row.content
  }

  return {
    intention: sections.intention ?? '',
    gratitude: sections.gratitude ?? '',
    greatAt: sections.great_at ?? '',
    reflection: sections.reflection ?? '',
  }
}

/**
 * Get pivoted scales for multiple posts.
 * Returns a Map<postId, ScaleMap> with the same shape as morningState columns.
 */
export async function getScalesForPosts(postIds: string[]): Promise<Map<string, ScaleMap>> {
  if (postIds.length === 0) return new Map()

  const rows = await db
    .select({
      postId: scaleEntries.postId,
      type: scaleEntries.type,
      value: scaleEntries.value,
    })
    .from(scaleEntries)
    .where(sql`${scaleEntries.postId} IN (${sql.join(postIds.map(id => sql`${id}`), sql`, `)})`)

  const map = new Map<string, ScaleMap>()
  for (const row of rows) {
    if (!map.has(row.postId)) {
      map.set(row.postId, { brainScale: null, bodyScale: null, happyScale: null, stressScale: null })
    }
    const entry = map.get(row.postId)!
    if (row.type === 'brain') entry.brainScale = row.value
    else if (row.type === 'body') entry.bodyScale = row.value
    else if (row.type === 'happy') entry.happyScale = row.value
    else if (row.type === 'stress') entry.stressScale = row.value
  }

  return map
}

/** Get pivoted scales for a single post. */
export async function getScalesForPost(postId: string): Promise<ScaleMap> {
  const map = await getScalesForPosts([postId])
  return map.get(postId) ?? { brainScale: null, bodyScale: null, happyScale: null, stressScale: null }
}

/**
 * Get 14-day scale history for an author, pivoted by date.
 * Returns entries in the same shape as ScaleHistoryEntry.
 */
export async function getScaleHistory(
  authorId: string,
  startDate: string,
  endDate: string,
) {
  const { posts: postsTable } = await import('@/lib/db/schema')

  const rows = await db
    .select({
      postId: scaleEntries.postId,
      type: scaleEntries.type,
      value: scaleEntries.value,
      date: sql<string>`${postsTable.date}::text`,
    })
    .from(scaleEntries)
    .innerJoin(postsTable, eq(scaleEntries.postId, postsTable.id))
    .where(
      and(
        eq(postsTable.authorId, authorId),
        sql`${postsTable.date} >= ${startDate}::date`,
        sql`${postsTable.date} <= ${endDate}::date`,
        eq(postsTable.status, 'published'),
      )
    )

  // Pivot rows by date
  const byDate = new Map<string, ScaleMap>()
  for (const row of rows) {
    if (!byDate.has(row.date)) {
      byDate.set(row.date, { brainScale: null, bodyScale: null, happyScale: null, stressScale: null })
    }
    const entry = byDate.get(row.date)!
    if (row.type === 'brain') entry.brainScale = row.value
    else if (row.type === 'body') entry.bodyScale = row.value
    else if (row.type === 'happy') entry.happyScale = row.value
    else if (row.type === 'stress') entry.stressScale = row.value
  }

  return byDate
}
