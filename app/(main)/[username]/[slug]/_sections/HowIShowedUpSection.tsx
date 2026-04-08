import { db } from '@/lib/db'
import { morningState, posts as postsTable } from '@/lib/db/schema'
import { eq, and, lte, desc } from 'drizzle-orm'
import HumanScoresSection from '@/components/journal/HumanScoresSection'

interface Props {
  postId: string
  authorId: string
  postDate: string
}

export interface ScaleHistoryEntry {
  brainScale: number | null
  bodyScale: number | null
  happyScale: number | null
  stressScale: number | null
  date: string
}

export default async function HowIShowedUpSection({ postId, authorId, postDate }: Props) {
  // Fetch the last 10 morningState entries for this author (up to and including this post's date)
  const history = await db
    .select({
      brainScale: morningState.brainScale,
      bodyScale: morningState.bodyScale,
      happyScale: morningState.happyScale,
      stressScale: morningState.stressScale,
      date: postsTable.date,
    })
    .from(morningState)
    .innerJoin(postsTable, eq(morningState.postId, postsTable.id))
    .where(
      and(
        eq(postsTable.authorId, authorId),
        lte(postsTable.date, postDate),
        eq(postsTable.status, 'published'),
      )
    )
    .orderBy(desc(postsTable.date))
    .limit(10)

  if (history.length === 0) return null

  // Most recent entry is today's scores (index 0)
  const today = history[0]

  return (
    <HumanScoresSection
      brainScale={today.brainScale}
      bodyScale={today.bodyScale}
      happyScale={today.happyScale ?? null}
      stressScale={today.stressScale ?? null}
      history={history as ScaleHistoryEntry[]}
    />
  )
}
