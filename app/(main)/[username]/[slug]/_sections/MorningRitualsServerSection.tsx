import { db } from '@/lib/db'
import { morningState, posts as postsTable } from '@/lib/db/schema'
import { eq, and, lte, gte, asc, sql } from 'drizzle-orm'
import { ROUTINE_ICON_MAP } from '@/components/RoutineIcons'
import MorningRitualsSection from '@/components/journal/MorningRitualsSection'

interface Props {
  postId: string
  authorId: string
  postDate: string
}

// Build ordered 14-slot date array: oldest (slot 0) → postDate (slot 13)
function buildSlotDates(postDate: string): string[] {
  const slots: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(postDate + 'T00:00:00')
    d.setDate(d.getDate() - i)
    slots.push(d.toISOString().split('T')[0])
  }
  return slots
}

export default async function MorningRitualsServerSection({ postId, authorId, postDate }: Props) {
  const slotDates = buildSlotDates(postDate)
  const windowStart = slotDates[0]

  const [ms, historyRows] = await Promise.all([
    db.select()
      .from(morningState)
      .where(eq(morningState.postId, postId))
      .then(r => r[0] ?? null),
    (async () => {
      try {
        return await db
          .select({
            routineChecklist: morningState.routineChecklist,
            date: sql<string>`${postsTable.date}::text`,
          })
          .from(morningState)
          .innerJoin(postsTable, eq(morningState.postId, postsTable.id))
          .where(and(
            eq(postsTable.authorId, authorId),
            gte(postsTable.date, sql`${windowStart}::date`),
            lte(postsTable.date, sql`${postDate}::date`),
            eq(postsTable.status, 'published'),
          ))
          .orderBy(asc(postsTable.date))
      } catch {
        return []
      }
    })(),
  ])

  if (!ms) return null

  // Map rows by date for O(1) lookup
  const byDate = new Map(historyRows.map(r => [r.date, r.routineChecklist as Record<string, boolean>]))

  // Compute per-ritual segments (boolean | null) and streaks
  const ritualStats: Record<string, { segments: (boolean | null)[]; streak: number }> = {}
  for (const key of Object.keys(ROUTINE_ICON_MAP)) {
    const segments: (boolean | null)[] = slotDates.map(date => {
      const checklist = byDate.get(date)
      if (!checklist) return null        // no post this day
      return Boolean(checklist[key])
    })

    // Streak = consecutive completed (true) days from rightmost slot
    // null or false both break the streak
    let streak = 0
    for (let i = segments.length - 1; i >= 0; i--) {
      if (segments[i] === true) streak++
      else break
    }

    ritualStats[key] = { segments, streak }
  }

  return (
    <MorningRitualsSection
      checklist={ms.routineChecklist as Record<string, boolean>}
      ritualStats={ritualStats}
      slotDates={slotDates}
    />
  )
}
