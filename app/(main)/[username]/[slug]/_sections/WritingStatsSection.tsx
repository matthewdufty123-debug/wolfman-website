import { db } from '@/lib/db'
import { posts as postsTable } from '@/lib/db/schema'
import { eq, and, lte, gte, desc, sql, isNotNull } from 'drizzle-orm'
import WritingStatsClient from '@/components/journal/WritingStatsClient'
import type { WordCountEntry } from '@/components/journal/WritingStatsClient'

interface Props {
  authorId: string
  postDate: string
  isOwner: boolean
}

export default async function WritingStatsSection({ authorId, postDate }: Props) {
  let wordCountHistory: WordCountEntry[] = []
  let calendarPostDates: string[] = []

  try {
    const [wordRows, calendarRows] = await Promise.all([
      db
        .select({
          date:                 sql<string>`${postsTable.date}::text`,
          wordCountIntention:   postsTable.wordCountIntention,
          wordCountGratitude:   postsTable.wordCountGratitude,
          wordCountGreatAt:     postsTable.wordCountGreatAt,
          wordCountTotal:       postsTable.wordCountTotal,
        })
        .from(postsTable)
        .where(and(
          eq(postsTable.authorId, authorId),
          lte(postsTable.date, sql`${postDate}::date`),
          eq(postsTable.status, 'published'),
          isNotNull(postsTable.wordCountTotal),
        ))
        .orderBy(desc(postsTable.date))
        .limit(10),

      // Last 10 calendar days — which have a published post?
      db
        .select({ date: sql<string>`${postsTable.date}::text` })
        .from(postsTable)
        .where(and(
          eq(postsTable.authorId, authorId),
          eq(postsTable.status, 'published'),
          gte(postsTable.date, sql`(${postDate}::date - interval '9 days')`),
          lte(postsTable.date, sql`${postDate}::date`),
        )),
    ])

    wordCountHistory = wordRows
    calendarPostDates = calendarRows.map(r => r.date)
  } catch {
    return null
  }

  if (wordCountHistory.length === 0) return null

  // Build 10-day calendar: array of { date, hasPost } from 9 days ago to postDate
  const calendarDays: { date: string; hasPost: boolean }[] = []
  const postDateSet = new Set(calendarPostDates)
  const base = new Date(postDate + 'T12:00:00Z')
  for (let i = 9; i >= 0; i--) {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() - i)
    const iso = d.toISOString().slice(0, 10)
    calendarDays.push({ date: iso, hasPost: postDateSet.has(iso) })
  }

  return (
    <WritingStatsClient
      wordCountHistory={wordCountHistory}
      calendarDays={calendarDays}
    />
  )
}
