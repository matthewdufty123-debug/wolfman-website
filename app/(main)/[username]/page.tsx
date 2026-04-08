import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, morningState, users, wolfbotReviews } from '@/lib/db/schema'
import { and, eq, gte, desc, sql, isNotNull } from 'drizzle-orm'
import StatsCharts, { StatRow } from '@/components/StatsCharts'
import MorningZoneScatter, { type ZonePoint } from '@/components/MorningZoneScatter'
import WordCountChart, { type WordCountRow } from '@/components/WordCountChart'
import type { ZonePoint as ZP } from '@/components/MorningZoneScatter'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params
  const [user] = await db
    .select({ displayName: users.displayName, name: users.name, bio: users.bio, avatar: users.avatar, image: users.image })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)
  if (!user) return { title: 'Profile not found — Wolfman' }
  const displayName = user.displayName ?? user.name ?? username
  const description = user.bio ?? `${displayName}'s morning intentions and habit data on Wolfman.`
  const avatarUrl = user.avatar ?? user.image ?? undefined
  const url = `https://wolfman.app/${username}`
  const fullTitle = `${displayName} — Wolfman`
  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: 'Wolfman',
      type: 'profile',
      ...(avatarUrl ? { images: [{ url: avatarUrl, width: 400, height: 400, alt: displayName }] } : {}),
    },
    twitter: {
      card: avatarUrl ? 'summary' : 'summary',
      title: fullTitle,
      description,
      ...(avatarUrl ? { images: [avatarUrl] } : {}),
    },
    alternates: { canonical: url },
  }
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
    if (diff === 1) { run++; if (run > longest) longest = run }
    else run = 1
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const yd = new Date(); yd.setDate(yd.getDate() - 1)
  const yesterdayStr = yd.toISOString().slice(0, 10)
  const dateSet = new Set(unique)
  let current = 0
  const startStr = dateSet.has(todayStr) ? todayStr : dateSet.has(yesterdayStr) ? yesterdayStr : null
  if (startStr) {
    const check = new Date(startStr + 'T00:00:00')
    while (dateSet.has(check.toISOString().slice(0, 10))) { current++; check.setDate(check.getDate() - 1) }
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

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 72 }: { src: string | null; name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: '#4A7FA5', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700,
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    }}>
      {initials}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProfilePage(
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const session = await auth()

  // Look up the profile user
  const [profileUser] = await db
    .select({
      id: users.id,
      name: users.name,
      displayName: users.displayName,
      bio: users.bio,
      avatar: users.avatar,
      image: users.image,
      username: users.username,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (!profileUser) notFound()

  const userId = profileUser.id
  const isOwner = session?.user?.id === userId
  const displayName = profileUser.displayName ?? profileUser.name ?? username
  const avatarSrc = profileUser.avatar ?? profileUser.image ?? null

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const cutoff = threeMonthsAgo.toISOString().slice(0, 10)
  const now = new Date()
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [chartRows, allPostDates, [{ total }], scatterRows, wordCountRows, [{ wolfbotContextCount }]] = await Promise.all([
    // Chart data: last 3 months with morning state
    db
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
      .where(and(eq(posts.authorId, userId), gte(posts.date, cutoff)))
      .orderBy(posts.date),

    // All post dates for streak + this-month calc
    db
      .select({ date: posts.date })
      .from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.status, 'published')))
      .orderBy(posts.date),

    // Total published posts
    db
      .select({ total: sql<number>`COUNT(*)` })
      .from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.status, 'published'))),

    // Last 30 posts for Morning Zone scatter
    db
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
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.date))
      .limit(30),

    // Word count breakdown for stacked bar chart
    db
      .select({
        date: posts.date,
        wordCountIntention: posts.wordCountIntention,
        wordCountGratitude: posts.wordCountGratitude,
        wordCountGreatAt: posts.wordCountGreatAt,
        wordCountTotal: posts.wordCountTotal,
      })
      .from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.status, 'published'), isNotNull(posts.wordCountTotal)))
      .orderBy(posts.date),

    // WOLF|BOT context count — entries with journalContext
    db
      .select({ wolfbotContextCount: sql<number>`COUNT(*)` })
      .from(wolfbotReviews)
      .innerJoin(posts, eq(wolfbotReviews.postId, posts.id))
      .where(and(eq(posts.authorId, userId), isNotNull(wolfbotReviews.journalContext))),
  ])

  const chartData: StatRow[] = chartRows.map(r => ({
    date: r.date,
    slug: r.slug,
    brainScale: r.brainScale,
    bodyScale: r.bodyScale,
    happyScale: r.happyScale ?? null,
    ritualCount: r.routineChecklist ? Object.values(r.routineChecklist as Record<string, boolean>).filter(Boolean).length : 0,
  }))

  const dateToSlug: Record<string, string> = {}
  chartRows.forEach(r => { dateToSlug[r.date] = r.slug })

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

  const wordCountData: WordCountRow[] = wordCountRows
    .filter(r => r.wordCountTotal && r.wordCountTotal > 0)
    .map(r => ({
      date: r.date,
      wordCountIntention: r.wordCountIntention ?? 0,
      wordCountGratitude: r.wordCountGratitude ?? 0,
      wordCountGreatAt: r.wordCountGreatAt ?? 0,
      wordCountTotal: r.wordCountTotal!,
    }))

  const allDates = allPostDates.map(r => r.date)
  const { current: currentStreak, longest: longestStreak } = computeStreaks(allDates)
  const thisMonth = new Set(allDates.filter(d => d >= firstOfMonth)).size
  const totalJournals = Number(total)
  const isEmpty = totalJournals === 0

  return (
    <main className="journal-page">

      {/* Profile header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        marginBottom: isOwner ? '1rem' : '2rem',
      }}>
        <Avatar src={avatarSrc} name={displayName} size={72} />
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            margin: 0,
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--heading, #193343)',
            fontFamily: "'Playfair Display', Georgia, serif",
            lineHeight: 1.2,
          }}>
            {displayName}
          </h1>
          <p style={{
            margin: '0.2rem 0 0',
            fontSize: '0.82rem',
            color: 'var(--body-text)',
            opacity: 0.5,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          }}>
            @{username}
          </p>
          {profileUser.bio && (
            <p style={{
              margin: '0.5rem 0 0',
              fontSize: '0.88rem',
              color: 'var(--body-text)',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              lineHeight: 1.5,
            }}>
              {profileUser.bio}
            </p>
          )}
        </div>
      </header>

      {/* Settings button — owner only, full-width below profile header */}
      {isOwner && (
        <a href="/account" className="profile-settings-btn">
          Settings
        </a>
      )}

      {isEmpty ? (
        <div className="journal-empty">
          <p className="journal-empty-headline">
            {isOwner ? 'Your journal is waiting.' : `${displayName} hasn't written yet.`}
          </p>
          {isOwner && (
            <>
              <p className="journal-empty-body">
                Write your first morning intention and your habits will start to show up here.
              </p>
              <a href="/write" className="journal-empty-link">Write your first journal →</a>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Headline stats */}
          <div className="journal-stats-row">
            <StatCard value={totalJournals} label="Journals" />
            <StatCard value={currentStreak} label="Day streak" />
            <StatCard value={longestStreak} label="Longest streak" />
            <StatCard value={thisMonth} label="This month" />
          </div>

          {/* WOLF|BOT context progress — owner only, hidden at full capability */}
          {isOwner && Number(wolfbotContextCount) < 14 && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 8,
              background: 'rgba(74,127,165,0.06)',
              border: '1px solid rgba(74,127,165,0.12)',
              marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '0.78rem', fontWeight: 600, color: 'var(--body-text)' }}>
                  WOLF|BOT Context
                </span>
                <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.72rem', color: 'var(--color-muted, #909090)' }}>
                  {Number(wolfbotContextCount)}/14
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(74,127,165,0.12)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (Number(wolfbotContextCount) / 14) * 100)}%`,
                  background: '#4A7FA5',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '0.72rem', color: 'var(--color-muted, #909090)', marginTop: '0.35rem' }}>
                {Number(wolfbotContextCount) < 7
                  ? 'More journal entries unlock WOLF|BOT trend analysis'
                  : 'WOLF|BOT understanding is developing — nearly at full capability'}
              </p>
            </div>
          )}

          {/* Morning Zone scatter */}
          {scatterData.length > 0 && (
            <div className="stats-chart-card">
              <p className="stats-chart-title">Morning Zone</p>
              <MorningZoneScatter data={scatterData} username={username} />
            </div>
          )}

          {/* Trend charts */}
          {chartData.length > 0
            ? <StatsCharts data={chartData} dateToSlug={dateToSlug} username={username} />
            : (
              <p className="journal-no-chart">
                No mood or ritual data yet — it will appear here once morning state is added to journals.
              </p>
            )
          }

          {/* Word count breakdown */}
          {wordCountData.length > 0 && (
            <div className="stats-chart-card">
              <p className="stats-chart-title">Journal Word Count</p>
              <WordCountChart data={wordCountData} />
            </div>
          )}
        </>
      )}
    </main>
  )
}
