import { db } from '@/lib/db'
import { morningState, posts as postsTable } from '@/lib/db/schema'
import { eq, and, lte, desc, sql } from 'drizzle-orm'
import { ROUTINE_ICON_MAP } from '@/components/RoutineIcons'
import MorningRitualsSection from '@/components/journal/MorningRitualsSection'

interface Props {
  postId: string
  authorId: string
  postDate: string
}

export default async function MorningRitualsServerSection({ postId, authorId, postDate }: Props) {
  // Parallelise today's checklist + history
  const [ms, historyRows] = await Promise.all([
    db.select()
      .from(morningState)
      .where(eq(morningState.postId, postId))
      .then(r => r[0] ?? null),
    (async () => {
      try {
        return await db
          .select({ routineChecklist: morningState.routineChecklist })
          .from(morningState)
          .innerJoin(postsTable, eq(morningState.postId, postsTable.id))
          .where(and(
            eq(postsTable.authorId, authorId),
            lte(postsTable.date, sql`${postDate}::date`),
            eq(postsTable.status, 'published'),
          ))
          .orderBy(desc(postsTable.date))
          .limit(10)
      } catch {
        return []
      }
    })(),
  ])

  if (!ms) return null

  // Reverse to chronological (oldest left → today rightmost)
  const chronological = [...historyRows].reverse()

  // Compute per-ritual segments + streak
  const ritualStats: Record<string, { segments: boolean[], streak: number }> = {}
  for (const key of Object.keys(ROUTINE_ICON_MAP)) {
    const segments = chronological.map(row =>
      Boolean((row.routineChecklist as Record<string, boolean>)[key])
    )
    let streak = 0
    for (let i = segments.length - 1; i >= 0; i--) {
      if (segments[i]) streak++
      else break
    }
    ritualStats[key] = { segments, streak: Math.min(streak, 10) }
  }

  return (
    <MorningRitualsSection
      checklist={ms.routineChecklist as Record<string, boolean>}
      ritualStats={ritualStats}
    />
  )
}
