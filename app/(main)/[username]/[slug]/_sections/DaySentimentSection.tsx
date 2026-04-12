import { db } from '@/lib/db'
import { posts as postsTable } from '@/lib/db/schema'
import { eq, and, lte, desc, isNotNull } from 'drizzle-orm'
import DaySentimentClient from '@/components/journal/DaySentimentClient'

interface Props {
  authorId: string
  postDate: string
}

export default async function DaySentimentSection({ authorId, postDate }: Props) {
  let rows: { feelAboutToday: number | null; date: string }[] = []

  try {
    rows = await db
      .select({
        feelAboutToday: postsTable.feelAboutToday,
        date: postsTable.date,
      })
      .from(postsTable)
      .where(
        and(
          eq(postsTable.authorId, authorId),
          lte(postsTable.date, postDate),
          eq(postsTable.status, 'published'),
          isNotNull(postsTable.feelAboutToday),
        )
      )
      .orderBy(desc(postsTable.date))
      .limit(10)
  } catch (err) {
    console.error('[DaySentiment] Query failed:', err)
  }

  // Need at least 1 entry with a feeling to show anything
  const valid = rows.filter(r => r.feelAboutToday != null)
  if (valid.length === 0) return null

  // Reverse to chronological
  const chronological = [...valid].reverse()
  const todayValue = chronological[chronological.length - 1].feelAboutToday!

  return (
    <DaySentimentClient
      todayValue={todayValue}
      history={chronological.map(r => r.feelAboutToday!)}
    />
  )
}
