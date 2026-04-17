import { db } from '@/lib/db'
import { posts as postsTable } from '@/lib/db/schema'
import { eq, and, lte, gte, asc, sql, isNotNull } from 'drizzle-orm'
import WritingStatsClient from '@/components/journal/WritingStatsClient'
import type { WordCountEntry } from '@/components/journal/WritingStatsClient'

interface Props {
  authorId: string
  postDate: string
  isOwner: boolean
}

function buildSlotDates(postDate: string): string[] {
  const slots: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(postDate + 'T00:00:00')
    d.setDate(d.getDate() - i)
    slots.push(d.toISOString().split('T')[0])
  }
  return slots
}

export default async function WritingStatsSection({ authorId, postDate }: Props) {
  const slotDates = buildSlotDates(postDate)
  const windowStart = slotDates[0]

  let rows: WordCountEntry[] = []
  try {
    rows = await db
      .select({
        date:               sql<string>`${postsTable.date}::text`,
        wordCountIntention: postsTable.wordCountIntention,
        wordCountGratitude: postsTable.wordCountGratitude,
        wordCountGreatAt:   postsTable.wordCountGreatAt,
        wordCountTotal:     postsTable.wordCountTotal,
      })
      .from(postsTable)
      .where(and(
        eq(postsTable.authorId, authorId),
        gte(postsTable.date, sql`${windowStart}::date`),
        lte(postsTable.date, sql`${postDate}::date`),
        eq(postsTable.status, 'published'),
        isNotNull(postsTable.wordCountTotal),
      ))
      .orderBy(asc(postsTable.date))
  } catch {
    return null
  }

  // Build 14-slot calendar array — null for days with no post
  const byDate = new Map(rows.map(r => [r.date, r]))
  const wordCountHistory: (WordCountEntry | null)[] = slotDates.map(date => {
    const row = byDate.get(date)
    return row ?? null
  })

  const hasAnyData = wordCountHistory.some(e => e !== null)
  if (!hasAnyData) return null

  return <WritingStatsClient wordCountHistory={wordCountHistory} slotDates={slotDates} />
}
