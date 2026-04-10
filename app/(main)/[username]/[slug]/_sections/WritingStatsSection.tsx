import { db } from '@/lib/db'
import { posts as postsTable } from '@/lib/db/schema'
import { eq, and, lte, gte, desc, sql, isNotNull } from 'drizzle-orm'
import WritingStatsClient from '@/components/journal/WritingStatsClient'
import type { WordCountEntry, PostingFrequencyData, MonthlyData } from '@/components/journal/WritingStatsClient'

interface Props {
  authorId: string
  postDate: string
  isOwner: boolean
}

export default async function WritingStatsSection({ authorId, postDate, isOwner }: Props) {
  // ── Query 1: Word count history (last 10 journals, everyone) ────────────────
  let wordCountHistory: WordCountEntry[] = []

  try {
    wordCountHistory = await db
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
      .limit(10)
  } catch {
    return null
  }

  if (wordCountHistory.length === 0) return null

  // ── Owner-only queries ───────────────────────────────────────────────────────
  let frequencyData: PostingFrequencyData | null = null
  let monthlyData: MonthlyData | null = null

  if (isOwner) {
    // Query 2: Rolling 30-day counts (parallelised)
    try {
      const [current30Rows, previous30Rows] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(postsTable)
          .where(and(
            eq(postsTable.authorId, authorId),
            eq(postsTable.status, 'published'),
            gte(postsTable.date, sql`(${postDate}::date - interval '29 days')`),
            lte(postsTable.date, sql`${postDate}::date`),
          )),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(postsTable)
          .where(and(
            eq(postsTable.authorId, authorId),
            eq(postsTable.status, 'published'),
            gte(postsTable.date, sql`(${postDate}::date - interval '59 days')`),
            lte(postsTable.date, sql`(${postDate}::date - interval '30 days')`),
          )),
      ])
      frequencyData = {
        current30Count:  current30Rows[0]?.count  ?? 0,
        previous30Count: previous30Rows[0]?.count ?? 0,
      }
    } catch {
      // frequencyData stays null — Chart 2 suppressed
    }

    // Query 3: Monthly post dates for cumulative line chart (parallelised)
    try {
      const [currentMonthRows, previousMonthRows] = await Promise.all([
        db
          .select({ date: sql<string>`${postsTable.date}::text` })
          .from(postsTable)
          .where(and(
            eq(postsTable.authorId, authorId),
            eq(postsTable.status, 'published'),
            gte(postsTable.date, sql`date_trunc('month', ${postDate}::date)`),
            lte(postsTable.date, sql`(date_trunc('month', ${postDate}::date) + interval '1 month' - interval '1 day')`),
          )),
        db
          .select({ date: sql<string>`${postsTable.date}::text` })
          .from(postsTable)
          .where(and(
            eq(postsTable.authorId, authorId),
            eq(postsTable.status, 'published'),
            gte(postsTable.date, sql`date_trunc('month', ${postDate}::date - interval '1 month')`),
            lte(postsTable.date, sql`(date_trunc('month', ${postDate}::date) - interval '1 day')`),
          )),
      ])

      // Compute month labels on the server (UTC noon parse avoids off-by-one)
      const postD   = new Date(postDate + 'T12:00:00Z')
      const prevD   = new Date(Date.UTC(postD.getUTCFullYear(), postD.getUTCMonth() - 1, 1))
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December']

      monthlyData = {
        currentMonth:       currentMonthRows,
        previousMonth:      previousMonthRows,
        currentMonthLabel:  monthNames[postD.getUTCMonth()],
        previousMonthLabel: monthNames[prevD.getUTCMonth()],
        currentMonthIndex:  postD.getUTCMonth(),
        previousMonthIndex: prevD.getUTCMonth(),
        currentYear:        postD.getUTCFullYear(),
        previousYear:       prevD.getUTCFullYear(),
      }
    } catch {
      // monthlyData stays null — Chart 3 suppressed
    }
  }

  return (
    <WritingStatsClient
      wordCountHistory={wordCountHistory}
      frequencyData={frequencyData}
      monthlyData={monthlyData}
      postDate={postDate}
      isOwner={isOwner}
    />
  )
}
