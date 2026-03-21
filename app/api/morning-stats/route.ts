import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { morningState, posts } from '@/lib/db/schema'
import { eq, gte } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const cutoff = threeMonthsAgo.toISOString().slice(0, 10)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: any[]
  try {
    rows = await db
      .select({
        date: posts.date,
        brainScale: morningState.brainScale,
        bodyScale: morningState.bodyScale,
        happyScale: morningState.happyScale,
        routineChecklist: morningState.routineChecklist,
      })
      .from(morningState)
      .innerJoin(posts, eq(morningState.postId, posts.id))
      .where(gte(posts.date, cutoff))
      .orderBy(posts.date)
  } catch (err) {
    console.error('[morning-stats] DB query failed:', err)
    return NextResponse.json({ error: 'Failed to load morning stats.' }, { status: 500 })
  }

  const data = rows.map(r => {
    const checklist = r.routineChecklist as Record<string, boolean>
    const ritualCount = Object.values(checklist).filter(Boolean).length
    return {
      date: r.date,
      brainScale: r.brainScale,
      bodyScale: r.bodyScale,
      happyScale: r.happyScale ?? null,
      ritualCount,
    }
  })

  return NextResponse.json(data)
}
