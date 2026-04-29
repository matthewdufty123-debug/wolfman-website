import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { morningState, scaleEntries, posts, users } from '@/lib/db/schema'
import { and, eq, gte, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const cutoff = threeMonthsAgo.toISOString().slice(0, 10)

  try {
    // Fetch scales from scaleEntries (pivoted) and rituals from morningState
    const [scaleRows, ritualRows] = await Promise.all([
      db
        .select({
          date: sql<string>`${posts.date}::text`,
          type: scaleEntries.type,
          value: scaleEntries.value,
        })
        .from(scaleEntries)
        .innerJoin(posts, eq(scaleEntries.postId, posts.id))
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(and(gte(posts.date, cutoff), eq(users.role, 'admin')))
        .orderBy(posts.date),
      db
        .select({
          date: sql<string>`${posts.date}::text`,
          routineChecklist: morningState.routineChecklist,
        })
        .from(morningState)
        .innerJoin(posts, eq(morningState.postId, posts.id))
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(and(gte(posts.date, cutoff), eq(users.role, 'admin')))
        .orderBy(posts.date),
    ])

    // Pivot scale rows by date, averaging when multiple entries per type
    const scaleAcc = new Map<string, Record<string, { sum: number; count: number }>>()
    for (const row of scaleRows) {
      if (!scaleAcc.has(row.date)) scaleAcc.set(row.date, {})
      const byType = scaleAcc.get(row.date)!
      if (!byType[row.type]) byType[row.type] = { sum: 0, count: 0 }
      byType[row.type].sum += row.value
      byType[row.type].count += 1
    }
    const byDate = new Map<string, { brainScale: number | null; bodyScale: number | null; happyScale: number | null; stressScale: number | null }>()
    for (const [date, byType] of scaleAcc) {
      byDate.set(date, {
        brainScale: byType.brain ? Math.round(byType.brain.sum / byType.brain.count) : null,
        bodyScale: byType.body ? Math.round(byType.body.sum / byType.body.count) : null,
        happyScale: byType.happy ? Math.round(byType.happy.sum / byType.happy.count) : null,
        stressScale: byType.stress ? Math.round(byType.stress.sum / byType.stress.count) : null,
      })
    }

    // Build ritual map by date
    const ritualMap = new Map<string, Record<string, boolean>>()
    for (const row of ritualRows) {
      ritualMap.set(row.date, row.routineChecklist as Record<string, boolean>)
    }

    // Merge all dates
    const allDates = new Set([...byDate.keys(), ...ritualMap.keys()])
    const data = [...allDates].sort().map(date => {
      const scales = byDate.get(date) ?? { brainScale: null, bodyScale: null, happyScale: null, stressScale: null }
      const checklist = ritualMap.get(date) ?? {}
      const ritualCount = Object.values(checklist).filter(Boolean).length
      return { date, ...scales, ritualCount }
    })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[morning-stats] DB query failed:', err)
    return NextResponse.json({ error: 'Failed to load morning stats.' }, { status: 500 })
  }
}
