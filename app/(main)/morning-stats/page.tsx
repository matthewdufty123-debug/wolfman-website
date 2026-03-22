import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { morningState, posts, users } from '@/lib/db/schema'
import { and, eq, gte, desc } from 'drizzle-orm'
import StatsCharts, { StatRow } from '@/components/StatsCharts'
import type { ZonePoint } from '@/components/MorningZoneScatter'

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
      slug: posts.slug,
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
      slug: r.slug,
      brainScale: r.brainScale,
      bodyScale: r.bodyScale,
      happyScale: r.happyScale ?? null,
      ritualCount,
    }
  })

  const dateToSlug: Record<string, string> = {}
  rows.forEach(r => { dateToSlug[r.date] = r.slug })

  // Last 30 posts with all three scales — for the Morning Zone scatter
  const scatterRows = await db
    .select({
      postId: morningState.postId,
      date: posts.date,
      slug: posts.slug,
      brainScale: morningState.brainScale,
      bodyScale: morningState.bodyScale,
      happyScale: morningState.happyScale,
    })
    .from(morningState)
    .innerJoin(posts, eq(morningState.postId, posts.id))
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(users.role, 'admin'))
    .orderBy(desc(posts.date))
    .limit(30)

  // Reverse to oldest-first so opacity fades correctly (newest = most vivid)
  const scatterData: ZonePoint[] = scatterRows
    .filter(r => r.happyScale != null)
    .reverse()
    .map(r => ({
      postId: r.postId,
      date: r.date,
      slug: r.slug,
      brainScale: r.brainScale,
      bodyScale: r.bodyScale,
      happyScale: r.happyScale!,
    }))

  return (
    <main className="stats-page">
      <Link href="/intentions" className="stats-back-link">← All posts</Link>
      <h1 className="stats-title">Morning Stats</h1>
      <p className="stats-subtitle">The last 3 months — how the mornings have been arriving.</p>
      <StatsCharts data={data} scatterData={scatterData} dateToSlug={dateToSlug} />
    </main>
  )
}
