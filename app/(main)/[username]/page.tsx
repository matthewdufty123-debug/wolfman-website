import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, morningState, scaleEntries, users, wolfbotReviews } from '@/lib/db/schema'
import { and, eq, gte, sql, isNotNull } from 'drizzle-orm'
import ProfileAnalyticsClient from '@/components/profile/ProfileAnalyticsClient'
import type { ScaleDataRow, WordCountDataRow } from '@/components/profile/ProfileAnalyticsClient'
import JournalCalendarGrid from '@/components/profile/JournalCalendarGrid'
import type { CalendarWeek } from '@/components/profile/JournalCalendarGrid'
import StatRow from '@/components/charts/StatRow'

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

  // Fetch data
  const now = new Date()
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const ytdCutoff = `${now.getFullYear()}-01-01`

  const [scaleRawRows, ritualRows, allPostDates, [{ total }], wordCountRows, [{ wolfbotContextCount }], [allTimeWords]] = await Promise.all([
    // Scale data from scaleEntries — all time
    db
      .select({
        postId: scaleEntries.postId,
        date: sql<string>`${posts.date}::text`,
        slug: posts.slug,
        type: scaleEntries.type,
        value: scaleEntries.value,
      })
      .from(scaleEntries)
      .innerJoin(posts, eq(scaleEntries.postId, posts.id))
      .where(and(eq(posts.authorId, userId), eq(posts.status, 'published')))
      .orderBy(posts.date),

    // Ritual data from morningState — all time
    db
      .select({
        date: sql<string>`${posts.date}::text`,
        slug: posts.slug,
        routineChecklist: morningState.routineChecklist,
      })
      .from(morningState)
      .innerJoin(posts, eq(morningState.postId, posts.id))
      .where(and(eq(posts.authorId, userId), eq(posts.status, 'published')))
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

    // Word count data YTD
    db
      .select({
        date: posts.date,
        wordCountIntention: posts.wordCountIntention,
        wordCountGratitude: posts.wordCountGratitude,
        wordCountGreatAt: posts.wordCountGreatAt,
        wordCountTotal: posts.wordCountTotal,
      })
      .from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.status, 'published'), isNotNull(posts.wordCountTotal), gte(posts.date, ytdCutoff)))
      .orderBy(posts.date),

    // WOLF|BOT context count
    db
      .select({ wolfbotContextCount: sql<number>`COUNT(*)` })
      .from(wolfbotReviews)
      .innerJoin(posts, eq(wolfbotReviews.postId, posts.id))
      .where(and(eq(posts.authorId, userId), isNotNull(wolfbotReviews.journalContext))),

    // All-time word totals + first post date
    db
      .select({
        totalWords: sql<number>`COALESCE(SUM(word_count_total), 0)`,
        firstDate: sql<string>`MIN(date)::text`,
      })
      .from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.status, 'published'))),
  ])

  // Pivot scale rows by date
  const scalePivot = new Map<string, { date: string; slug: string; brainScale: number | null; bodyScale: number | null; happyScale: number | null; stressScale: number | null }>()
  for (const row of scaleRawRows) {
    if (!scalePivot.has(row.date)) {
      scalePivot.set(row.date, { date: row.date, slug: row.slug, brainScale: null, bodyScale: null, happyScale: null, stressScale: null })
    }
    const entry = scalePivot.get(row.date)!
    if (row.type === 'brain') entry.brainScale = row.value
    else if (row.type === 'body') entry.bodyScale = row.value
    else if (row.type === 'happy') entry.happyScale = row.value
    else if (row.type === 'stress') entry.stressScale = row.value
  }

  // Build ritual map by date
  const ritualByDate = new Map(ritualRows.map(r => [r.date, r.routineChecklist as Record<string, boolean> | null]))

  // Merge scales + rituals into ScaleDataRow[]
  const allScaleDates = new Set([...scalePivot.keys(), ...ritualByDate.keys()])
  const scaleData: ScaleDataRow[] = [...allScaleDates].sort().map(date => {
    const s = scalePivot.get(date)
    const ritualRow = ritualRows.find(r => r.date === date)
    return {
      date,
      slug: s?.slug ?? ritualRow?.slug ?? '',
      brainScale: s?.brainScale ?? null,
      bodyScale: s?.bodyScale ?? null,
      happyScale: s?.happyScale ?? null,
      stressScale: s?.stressScale ?? null,
      routineChecklist: ritualByDate.get(date) ?? null,
    }
  })

  const wordCountData: WordCountDataRow[] = wordCountRows
    .filter(r => r.wordCountTotal && r.wordCountTotal > 0)
    .map(r => ({
      date: r.date,
      wordCountIntention: r.wordCountIntention ?? 0,
      wordCountGratitude: r.wordCountGratitude ?? 0,
      wordCountGreatAt: r.wordCountGreatAt ?? 0,
      wordCountTotal: r.wordCountTotal!,
    }))

  // All-time headline stats
  const allTimeTotalWords = Number(allTimeWords?.totalWords ?? 0)
  const allTimeRitualCount = scaleData.reduce((sum, r) => {
    if (!r.routineChecklist) return sum
    return sum + Object.values(r.routineChecklist as Record<string, boolean>).filter(Boolean).length
  }, 0)

  const allDates = allPostDates.map(r => r.date)
  const { current: currentStreak, longest: longestStreak } = computeStreaks(allDates)
  const thisMonth = new Set(allDates.filter(d => d >= firstOfMonth)).size
  const totalJournals = Number(total)
  const isEmpty = totalJournals === 0

  // Cumulative month-vs-last data for profile charts
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const curMonthIdx = now.getMonth()
  const curYear = now.getFullYear()
  const prevD = new Date(curYear, curMonthIdx - 1, 1)
  const prevMonthIdx = prevD.getMonth()
  const prevYear = prevD.getFullYear()
  const curPrefix = `${curYear}-${String(curMonthIdx + 1).padStart(2, '0')}`
  const prevPrefix = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}`

  const cumulativeBase = {
    currentMonthLabel: monthNames[curMonthIdx],
    previousMonthLabel: monthNames[prevMonthIdx],
    currentMonthIndex: curMonthIdx,
    previousMonthIndex: prevMonthIdx,
    currentYear: curYear,
    previousYear: prevYear,
  }

  // Journals cumulative
  const journalsCumulative = {
    ...cumulativeBase,
    currentMonth: allDates.filter(d => d.startsWith(curPrefix)).map(d => ({ date: d })),
    previousMonth: allDates.filter(d => d.startsWith(prevPrefix)).map(d => ({ date: d })),
  }

  // Rituals cumulative — count of completed rituals per post date (as daily values)
  const ritualsByDay: Record<string, number> = {}
  for (const r of scaleData) {
    if (r.routineChecklist && (r.date.startsWith(curPrefix) || r.date.startsWith(prevPrefix))) {
      const count = Object.values(r.routineChecklist as Record<string, boolean>).filter(Boolean).length
      ritualsByDay[r.date] = (ritualsByDay[r.date] ?? 0) + count
    }
  }
  const curRituals: Record<string, number> = {}
  const prevRituals: Record<string, number> = {}
  for (const [date, val] of Object.entries(ritualsByDay)) {
    if (date.startsWith(curPrefix)) curRituals[date] = val
    else prevRituals[date] = val
  }
  const ritualsCumulative = { ...cumulativeBase, currentMonth: curRituals, previousMonth: prevRituals }

  // Words cumulative — word count total per day (as daily values)
  const curWords: Record<string, number> = {}
  const prevWords: Record<string, number> = {}
  for (const r of wordCountRows) {
    if (r.wordCountTotal && r.wordCountTotal > 0) {
      if (r.date.startsWith(curPrefix)) curWords[r.date] = (curWords[r.date] ?? 0) + r.wordCountTotal
      else if (r.date.startsWith(prevPrefix)) prevWords[r.date] = (prevWords[r.date] ?? 0) + r.wordCountTotal
    }
  }
  const wordsCumulative = { ...cumulativeBase, currentMonth: curWords, previousMonth: prevWords }

  // Calendar grid — last 5 weeks (35 days), Mon–Sun, most recent week last
  const calendarWeeks: CalendarWeek[] = (() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Find the most recent Monday (start of current week)
    const dayOfWeek = (today.getDay() + 6) % 7 // 0=Mon, 6=Sun
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - dayOfWeek)

    // Go back 4 more weeks to get 5 weeks total
    const gridStart = new Date(weekStart)
    gridStart.setDate(weekStart.getDate() - 28)

    // Build lookup: date → ritual count from scaleData
    const ritualByDate: Record<string, number> = {}
    const postDateSet = new Set(allDates)
    for (const r of scaleData) {
      if (r.routineChecklist) {
        ritualByDate[r.date] = Object.values(r.routineChecklist as Record<string, boolean>).filter(Boolean).length
      }
    }

    const weeks: CalendarWeek[] = []
    for (let w = 0; w < 5; w++) {
      const days = []
      let weeklyRitualTotal = 0
      for (let d = 0; d < 7; d++) {
        const date = new Date(gridStart)
        date.setDate(gridStart.getDate() + w * 7 + d)
        const iso = date.toISOString().slice(0, 10)
        const hasJournal = postDateSet.has(iso)
        const ritualCount = hasJournal ? (ritualByDate[iso] ?? 0) : null
        if (ritualCount !== null) weeklyRitualTotal += ritualCount
        days.push({ date: iso, ritualCount })
      }
      weeks.push({ days, weeklyRitualTotal })
    }
    return weeks
  })()

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

      {/* Settings button — owner only */}
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
          {/* Headline stats — Strava-style stat rows */}
          {/* Top-section wrapper — matches journal-section side padding for consistent margins */}
          <div style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <StatRow label="Journals" value={totalJournals} />
              <StatRow label="Current Streak" value={`${currentStreak} days`} />
              <StatRow label="Longest Streak" value={`${longestStreak} days`} />
              <StatRow label="This Month" value={thisMonth} noBorder />
            </div>

            {/* All Time Journal Stats */}
            <p style={{
              fontFamily: 'var(--font-inter), sans-serif',
              fontSize: '0.62rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--body-text)',
              opacity: 0.4,
              margin: '0 0 0.5rem',
            }}>
              All Time Journal Stats
            </p>
            <div className="chart-stat-summary" style={{ marginBottom: '1.5rem' }}>
              <div className="chart-stat-summary-item">
                <div className="chart-stat-summary-value">{totalJournals}</div>
                <div className="chart-stat-summary-label">Journals Posted</div>
              </div>
              <div className="chart-stat-summary-item">
                <div className="chart-stat-summary-value">{allTimeTotalWords >= 1000 ? `${(allTimeTotalWords / 1000).toFixed(1)}k` : allTimeTotalWords}</div>
                <div className="chart-stat-summary-label">Words Written</div>
              </div>
              <div className="chart-stat-summary-item">
                <div className="chart-stat-summary-value">{allTimeRitualCount}</div>
                <div className="chart-stat-summary-label">Rituals Done</div>
              </div>
            </div>

            {/* 5-week calendar grid */}
            <JournalCalendarGrid weeks={calendarWeeks} />
          </div>

          {/* WOLF|BOT context progress — owner only, hidden at full capability */}
          {isOwner && Number(wolfbotContextCount) < 14 && (
            <div style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
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
            </div>
          )}

          {/* Analytics with time period toggle */}
          <ProfileAnalyticsClient
            scaleData={scaleData}
            wordCountData={wordCountData}
            username={username}
            journalsCumulative={journalsCumulative}
            ritualsCumulative={ritualsCumulative}
            wordsCumulative={wordsCumulative}
          />
        </>
      )}
    </main>
  )
}
