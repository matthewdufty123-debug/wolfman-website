import { db } from '@/lib/db'
import { posts as postsTable } from '@/lib/db/schema'
import { eq, and, lte, desc, sql, isNotNull } from 'drizzle-orm'
import WritingStatsClient from '@/components/journal/WritingStatsClient'
import type { WordCountEntry } from '@/components/journal/WritingStatsClient'

interface Props {
  authorId: string
  postDate: string
  isOwner: boolean
}

export default async function WritingStatsSection({ authorId, postDate }: Props) {
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

  return <WritingStatsClient wordCountHistory={wordCountHistory} />
}
