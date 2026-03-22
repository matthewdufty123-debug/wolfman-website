import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, morningState } from '@/lib/db/schema'
import { and, eq, gte, sql } from 'drizzle-orm'
import StatsCharts, { StatRow } from '@/components/StatsCharts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your Journal — Wolfman',
}

// ── Streak calculation ────────────────────────────────────────────────────────

function computeStreaks(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 }

  const unique = [...new Set(dates)].sort()
  let longest = 1
  let run = 1

  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1] + 'T00:00:00')
    const curr = new Date(unique[i] + 'T00:00:00')
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 1) {
      run++
      if (run > longest) longest = run
    } else {
      run = 1
    }
  }

  // Current streak: walk back from today (yesterday counts — grace for late entries)
  const todayStr = new Date().toISOString().slice(0, 10)
  const yd = new Date(); yd.setDate(yd.getDate() - 1)
  const yesterdayStr = yd.toISOString().slice(0, 10)

  const dateSet = new Set(unique)
  let current = 0
  const startStr = dateSet.has(todayStr) ? todayStr
    : dateSet.has(yesterdayStr) ? yesterdayStr
    : null

  if (startStr) {
    const check = new Date(startStr + 'T00:00:00')
    while (dateSet.has(check.toISOString().slice(0, 10))) {
      current++
      check.setDate(check.getDate() - 1)
    }
  }

  return { current, longest }
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="journal-stat-card">
      <p className="journal-stat-value">{value}</p>
      <p className="journal-stat-label">{label}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function JournalPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const cutoff = threeMonthsAgo.toISOString().slice(0, 10)

  const now = new Date()
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // Run queries in parallel
  const [chartRows, allPostDates, [{ total }]] = await Promise.all([
    // Chart data: last 3 months with morning state
    db
      .select({
        date: posts.date,
        brainScale: morningState.brainScale,
        bodyScale: morningState.bodyScale,
        happyScale: morningState.happyScale,
        routineChecklist: morningState.routineChecklist,
      })
      .from(morningState)
      .innerJoin(posts, eq(morningState.postId, posts.id))
      .where(and(eq(posts.authorId, userId), gte(posts.date, cutoff)))
      .orderBy(posts.date),

    // All post dates for streak calculation
    db
      .select({ date: posts.date })
      .from(posts)
      .where(eq(posts.authorId, userId))
      .orderBy(posts.date),

    // Total post count
    db
      .select({ total: sql<number>`COUNT(*)` })
      .from(posts)
      .where(eq(posts.authorId, userId)),
  ])

  const chartData: StatRow[] = chartRows.map(r => ({
    date: r.date,
    brainScale: r.brainScale,
    bodyScale: r.bodyScale,
    happyScale: r.happyScale ?? null,
    ritualCount: Object.values(r.routineChecklist as Record<string, boolean>).filter(Boolean).length,
  }))

  const allDates = allPostDates.map(r => r.date)
  const { current: currentStreak, longest: longestStreak } = computeStreaks(allDates)
  const thisMonth = new Set(allDates.filter(d => d >= firstOfMonth)).size
  const totalPosts = Number(total)

  const isEmpty = totalPosts === 0

  const displayName = session.user.name?.split(' ')[0] ?? 'Your'

  return (
    <main className="journal-page">
      <header className="journal-header">
        <h1 className="journal-title">{displayName}&apos;s Journal</h1>
      </header>

      {isEmpty ? (
        <div className="journal-empty">
          <p className="journal-empty-headline">Your journal is waiting.</p>
          <p className="journal-empty-body">
            Write your first morning intention and your habits will start to show up here.
          </p>
          <Link href="/write" className="journal-empty-link">Write your first post →</Link>
        </div>
      ) : (
        <>
          <div className="journal-stats-row">
            <StatCard value={totalPosts} label="Total posts" />
            <StatCard value={currentStreak} label={currentStreak === 1 ? 'Day streak' : 'Day streak'} />
            <StatCard value={longestStreak} label="Longest streak" />
            <StatCard value={thisMonth} label="This month" />
          </div>

          {chartData.length > 0
            ? <StatsCharts data={chartData} />
            : (
              <p className="journal-no-chart">
                No mood or ritual data in the last 3 months yet — it will appear here once you start adding morning state to your posts.
              </p>
            )
          }
        </>
      )}
    </main>
  )
}
