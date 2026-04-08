import { db } from '@/lib/db'
import { morningState, posts as postsTable } from '@/lib/db/schema'
import { eq, and, lte, desc, sql } from 'drizzle-orm'
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
  // Always fetch today's morningState first (guaranteed to work — same as old code)
  const ms = await db
    .select()
    .from(morningState)
    .where(eq(morningState.postId, postId))
    .then(r => r[0] ?? null)

  if (!ms) return null

  // Fetch history for trend charts — wrapped in try-catch to avoid breaking the page
  let history: ScaleHistoryEntry[] = []
  try {
    if (authorId) {
      const rows = await db
        .select({
          brainScale: morningState.brainScale,
          bodyScale: morningState.bodyScale,
          happyScale: morningState.happyScale,
          stressScale: morningState.stressScale,
          date: sql<string>`${postsTable.date}::text`,
        })
        .from(morningState)
        .innerJoin(postsTable, eq(morningState.postId, postsTable.id))
        .where(
          and(
            eq(postsTable.authorId, authorId),
            lte(postsTable.date, sql`${postDate}::date`),
            eq(postsTable.status, 'published'),
          )
        )
        .orderBy(desc(postsTable.date))
        .limit(10)

      history = rows as ScaleHistoryEntry[]
    }
  } catch (err) {
    console.error('[HowIShowedUp] History query failed:', err)
  }

  // If history fetch failed or is empty, build a single-entry array from today's data
  if (history.length === 0) {
    history = [{
      brainScale: ms.brainScale,
      bodyScale: ms.bodyScale,
      happyScale: ms.happyScale,
      stressScale: ms.stressScale,
      date: postDate,
    }]
  }

  const today = history[0]

  return (
    <HumanScoresSection
      brainScale={today.brainScale}
      bodyScale={today.bodyScale}
      happyScale={today.happyScale ?? null}
      stressScale={today.stressScale ?? null}
      history={history}
    />
  )
}
