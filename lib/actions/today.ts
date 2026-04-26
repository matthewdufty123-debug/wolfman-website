'use server'

import { db } from '@/lib/db'
import { posts, morningState } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getUserLocalDate } from '@/lib/timezone'
import { getEntriesForPost, getScalesForPost } from '@/lib/db/queries'

function makeSlug(title: string, date: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  return `${date}-${base}`
}

function defaultJournalTitle(date: string): string {
  const d = new Date(date + 'T00:00:00')
  const day = d.getDate()
  const suffix = [, 'st', 'nd', 'rd'][day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10 ? day % 10 : 0)] || 'th'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const yr = String(d.getFullYear()).slice(-2)
  return `Today's Intentional Journal — ${day}${suffix} ${months[d.getMonth()]} '${yr}`
}

export type TodayPost = {
  id: string
  date: string
  title: string
  slug: string
  status: string
  image: string | null
  imageCaption: string | null
  videoId: string | null
  feelAboutToday: number | null
  titleSuggestionsUsed: number | null
  isPublic: boolean
  publishedAt: Date | null
}

export type TodayEntry = {
  id: string
  type: string
  content: string
  source: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type TodayScales = {
  brainScale: number | null
  bodyScale: number | null
  happyScale: number | null
  stressScale: number | null
}

export type TodayData = {
  post: TodayPost
  entries: TodayEntry[]
  scales: TodayScales
  rituals: Record<string, boolean>
}

export async function findOrCreateTodayPost(
  userId: string,
  timezone: string | null,
): Promise<TodayData> {
  const todayDate = getUserLocalDate(timezone ?? 'UTC')

  // Try to find existing post for today
  const [existing] = await db
    .select({
      id: posts.id,
      date: posts.date,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
      image: posts.image,
      imageCaption: posts.imageCaption,
      videoId: posts.videoId,
      feelAboutToday: posts.feelAboutToday,
      titleSuggestionsUsed: posts.titleSuggestionsUsed,
      isPublic: posts.isPublic,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(and(eq(posts.authorId, userId), eq(posts.date, todayDate)))
    .limit(1)

  if (existing) {
    // Load entries, scales, rituals
    const [entries, scales, msRow] = await Promise.all([
      getEntriesForPost(existing.id),
      getScalesForPost(existing.id),
      db.select({ routineChecklist: morningState.routineChecklist })
        .from(morningState).where(eq(morningState.postId, existing.id)).limit(1),
    ])

    return {
      post: existing,
      entries,
      scales,
      rituals: (msRow[0]?.routineChecklist as Record<string, boolean>) ?? {},
    }
  }

  // Create new draft post
  const title = defaultJournalTitle(todayDate)
  const slug = makeSlug(title, todayDate)

  // Handle slug collision
  const slugExists = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1)
  const finalSlug = slugExists.length > 0 ? `${slug}-${Date.now()}` : slug

  const [newPost] = await db.insert(posts).values({
    slug: finalSlug,
    title,
    date: todayDate,
    category: 'morning-intention',
    content: '',
    authorId: userId,
    status: 'draft',
    isPublic: false,
    publishedAt: new Date(0),
  }).returning({
    id: posts.id,
    date: posts.date,
    title: posts.title,
    slug: posts.slug,
    status: posts.status,
    image: posts.image,
    imageCaption: posts.imageCaption,
    videoId: posts.videoId,
    feelAboutToday: posts.feelAboutToday,
    titleSuggestionsUsed: posts.titleSuggestionsUsed,
    isPublic: posts.isPublic,
    publishedAt: posts.publishedAt,
  })

  return {
    post: newPost,
    entries: [],
    scales: { brainScale: null, bodyScale: null, happyScale: null, stressScale: null },
    rituals: {},
  }
}
