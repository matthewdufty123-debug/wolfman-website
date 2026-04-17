import { db } from '@/lib/db'
import { morningState, posts as postsTable } from '@/lib/db/schema'
import { eq, and, lte, gte, asc, sql } from 'drizzle-orm'
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

// Build the ordered 14-slot date array: oldest (slot 0) → postDate (slot 13)
function buildSlotDates(postDate: string): string[] {
  const slots: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(postDate + 'T00:00:00')
    d.setDate(d.getDate() - i)
    slots.push(d.toISOString().split('T')[0])
  }
  return slots
}

export default async function HowIShowedUpSection({ postId, authorId, postDate }: Props) {
  const ms = await db
    .select()
    .from(morningState)
    .where(eq(morningState.postId, postId))
    .then(r => r[0] ?? null)

  if (!ms) return null

  const slotDates = buildSlotDates(postDate)
  const windowStart = slotDates[0]

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
            gte(postsTable.date, sql`${windowStart}::date`),
            lte(postsTable.date, sql`${postDate}::date`),
            eq(postsTable.status, 'published'),
          )
        )
        .orderBy(asc(postsTable.date))

      // Map fetched rows by date, then fill all 14 slots (null where no post exists)
      const byDate = new Map(rows.map(r => [r.date, r]))
      history = slotDates.map(date => {
        const row = byDate.get(date)
        return row
          ? { brainScale: row.brainScale, bodyScale: row.bodyScale, happyScale: row.happyScale, stressScale: row.stressScale, date }
          : { brainScale: null, bodyScale: null, happyScale: null, stressScale: null, date }
      })
    }
  } catch (err) {
    console.error('[HowIShowedUp] History query failed:', err)
  }

  if (history.length === 0) {
    history = slotDates.map(date => ({
      brainScale: date === postDate ? ms.brainScale : null,
      bodyScale: date === postDate ? ms.bodyScale : null,
      happyScale: date === postDate ? ms.happyScale : null,
      stressScale: date === postDate ? ms.stressScale : null,
      date,
    }))
  }

  const postEntry = history[history.length - 1]

  return (
    <HumanScoresSection
      brainScale={postEntry.brainScale}
      bodyScale={postEntry.bodyScale}
      happyScale={postEntry.happyScale ?? null}
      stressScale={postEntry.stressScale ?? null}
      history={history}
    />
  )
}
