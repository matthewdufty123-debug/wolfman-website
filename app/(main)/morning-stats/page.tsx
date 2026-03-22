import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { morningState, posts, users } from '@/lib/db/schema'
import { and, eq, gte } from 'drizzle-orm'
import StatsCharts, { StatRow } from '@/components/StatsCharts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Morning Stats — Wolfman',
  description: 'A look at how Matthew has been arriving at his mornings over the last 3 months.',
}

export default async function MorningStatsPage() {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const cutoff = threeMonthsAgo.toISOString().slice(0, 10)

  const rows = await db
    .select({
      date: posts.date,
      brainScale: morningState.brainScale,
      bodyScale: morningState.bodyScale,
      happyScale: morningState.happyScale,
      routineChecklist: morningState.routineChecklist,
    })
    .from(morningState)
    .innerJoin(posts, eq(morningState.postId, posts.id))
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(gte(posts.date, cutoff), eq(users.role, 'admin')))
    .orderBy(posts.date)

  const data: StatRow[] = rows.map(r => {
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

  return (
    <main className="stats-page">
      <Link href="/intentions" className="stats-back-link">← All posts</Link>
      <h1 className="stats-title">Morning Stats</h1>
      <p className="stats-subtitle">The last 3 months — how the mornings have been arriving.</p>
      <StatsCharts data={data} />
    </main>
  )
}
