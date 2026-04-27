/**
 * Lightweight context engine for Telegram bot Haiku prompts.
 * Fetches ~500 tokens of context per user — yesterday's data,
 * recent entries, today's progress, and user profile.
 */

import { db } from '@/lib/db'
import { posts, wolfbotReviews } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getScalesForPost, getEntriesForPost } from '@/lib/db/queries'
import { getUserLocalDate } from '@/lib/timezone'

// ── Types ──────────────────────────────────────────────────────────────────

export interface TelegramContext {
  userName: string
  timeOfDay: 'morning' | 'afternoon' | 'evening'
  dayOfWeek: string
  yesterdayScales: Record<string, number> | null
  yesterdayReviewExcerpt: string | null
  recentEntries: { type: string; snippet: string }[]
  todayLoggedSoFar: string[]
  profession: string | null
  humourSource: string | null
}

interface ContextUser {
  id: string
  name: string | null
  timezone: string | null
  profession: string | null
  humourSource: string | null
}

// ── Main fetch ─────────────────────────────────────────────────────────────

export async function fetchTelegramContext(
  user: ContextUser,
  postId: string,
): Promise<TelegramContext> {
  const tz = user.timezone ?? 'UTC'
  const today = getUserLocalDate(tz)
  const yesterday = getYesterdayDate(today)

  // Parallel fetch: yesterday's post + today's data
  const [yesterdayPost, todayEntries, todayScales] = await Promise.all([
    db.select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.authorId, user.id), eq(posts.date, yesterday)))
      .limit(1)
      .then(r => r[0] ?? null),
    getEntriesForPost(postId),
    getScalesForPost(postId),
  ])

  // Fetch yesterday's scales + review if post exists
  let yesterdayScales: Record<string, number> | null = null
  let yesterdayReviewExcerpt: string | null = null

  if (yesterdayPost) {
    const [yScales, yReview] = await Promise.all([
      getScalesForPost(yesterdayPost.id),
      db.select({ review: wolfbotReviews.review })
        .from(wolfbotReviews)
        .where(eq(wolfbotReviews.postId, yesterdayPost.id))
        .limit(1)
        .then(r => r[0]?.review ?? null),
    ])

    const scaleMap: Record<string, number> = {}
    if (yScales.brainScale) scaleMap.brain = yScales.brainScale
    if (yScales.bodyScale) scaleMap.body = yScales.bodyScale
    if (yScales.happyScale) scaleMap.happy = yScales.happyScale
    if (yScales.stressScale) scaleMap.stress = yScales.stressScale
    if (Object.keys(scaleMap).length > 0) yesterdayScales = scaleMap

    if (yReview) {
      yesterdayReviewExcerpt = yReview.length > 120 ? yReview.slice(0, 120) + '...' : yReview
    }
  }

  // Recent entries — last entry per type from today
  const recentEntries = todayEntries
    .reduce<{ type: string; snippet: string }[]>((acc, e) => {
      if (!acc.find(a => a.type === e.type)) {
        acc.push({
          type: e.type,
          snippet: e.content.length > 60 ? e.content.slice(0, 60) + '...' : e.content,
        })
      }
      return acc
    }, [])

  // Today's progress summary
  const todayLoggedSoFar: string[] = []
  if (todayScales.brainScale) todayLoggedSoFar.push(`mood: ${todayScales.brainScale}/8`)
  if (todayScales.bodyScale) todayLoggedSoFar.push(`energy: ${todayScales.bodyScale}/8`)
  if (todayScales.happyScale) todayLoggedSoFar.push(`happy: ${todayScales.happyScale}/8`)
  if (todayScales.stressScale) todayLoggedSoFar.push(`stress: ${todayScales.stressScale}/8`)
  const entryTypes = new Set(todayEntries.map(e => e.type))
  for (const t of entryTypes) {
    todayLoggedSoFar.push(`${t}: logged`)
  }

  return {
    userName: user.name ?? 'friend',
    timeOfDay: getTimeOfDay(tz),
    dayOfWeek: getDayOfWeek(tz),
    yesterdayScales,
    yesterdayReviewExcerpt,
    recentEntries,
    todayLoggedSoFar,
    profession: user.profession ?? null,
    humourSource: user.humourSource ?? null,
  }
}

// ── Format for prompt ──────────────────────────────────────────────────────

export function formatContextForPrompt(ctx: TelegramContext): string {
  const lines: string[] = [
    `User: ${ctx.userName}`,
    `Time: ${ctx.dayOfWeek} ${ctx.timeOfDay}`,
  ]

  if (ctx.profession) lines.push(`Profession: ${ctx.profession}`)
  if (ctx.humourSource) lines.push(`Humour style: ${ctx.humourSource}`)

  if (ctx.yesterdayScales) {
    const parts = Object.entries(ctx.yesterdayScales).map(([k, v]) => `${k} ${v}`)
    lines.push(`Yesterday's scales: ${parts.join(', ')}`)
  }

  if (ctx.yesterdayReviewExcerpt) {
    lines.push(`Yesterday's WOLF|BOT: "${ctx.yesterdayReviewExcerpt}"`)
  }

  if (ctx.recentEntries.length > 0) {
    for (const e of ctx.recentEntries) {
      lines.push(`Recent ${e.type}: "${e.snippet}"`)
    }
  }

  if (ctx.todayLoggedSoFar.length > 0) {
    lines.push(`Already logged today: ${ctx.todayLoggedSoFar.join(', ')}`)
  }

  return lines.join('\n')
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getYesterdayDate(todayStr: string): string {
  const d = new Date(todayStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function getTimeOfDay(timezone: string): 'morning' | 'afternoon' | 'evening' {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', hour12: false }).format(new Date()),
    10
  )
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

function getDayOfWeek(timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: timezone, weekday: 'long' }).format(new Date())
}
