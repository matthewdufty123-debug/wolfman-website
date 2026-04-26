import { db } from '@/lib/db'
import { posts as postsTable, users as usersTable } from '@/lib/db/schema'
import { eq, gt, lt, and, or, desc, asc, gte, lte, sql } from 'drizzle-orm'
import type { ProcessedPost } from '@/lib/posts'
import PostInfoSection from '@/components/journal/PostInfoSection'
import JournalPhotoSection from '@/components/journal/JournalPhotoSection'
import BottomNav from '@/components/journal/BottomNav'
import WolfLogo from '@/components/WolfLogo'

interface Props {
  post: ProcessedPost
  username: string
  isOwner: boolean
  userId: string | null
}

export default async function PostInfoNavSection({ post, username, isOwner, userId }: Props) {
  if (!post.id) {
    return (
      <>
        <PostInfoSection post={post} />
        <JournalPhotoSection imageUrl={post.image} title={post.title} caption={post.imageCaption} />
        <BottomNav username={username} nextPost={null} isOwner={false} editHref={null} />
      </>
    )
  }

  const visibilityFilter = userId
    ? or(
        and(eq(postsTable.status, 'published'), eq(postsTable.isPublic, true)),
        eq(postsTable.authorId, userId)
      )
    : and(eq(postsTable.status, 'published'), eq(postsTable.isPublic, true))

  const currentDate = post.date ?? new Date().toISOString().slice(0, 10)

  const [prevRow, nextRow, calendarRows] = await Promise.all([
    db.select({ slug: postsTable.slug, username: usersTable.username })
      .from(postsTable)
      .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .where(and(visibilityFilter, gt(postsTable.date, currentDate)))
      .orderBy(asc(postsTable.date))
      .limit(1)
      .then(r => r[0] ?? null),
    db.select({ slug: postsTable.slug, username: usersTable.username })
      .from(postsTable)
      .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .where(and(visibilityFilter, lt(postsTable.date, currentDate)))
      .orderBy(desc(postsTable.date))
      .limit(1)
      .then(r => r[0] ?? null),

    // Last 10 calendar days — which have a published post?
    post.authorId
      ? db
          .select({ date: sql<string>`${postsTable.date}::text` })
          .from(postsTable)
          .where(and(
            eq(postsTable.authorId, post.authorId),
            eq(postsTable.status, 'published'),
            gte(postsTable.date, sql`(${currentDate}::date - interval '9 days')`),
            lte(postsTable.date, sql`${currentDate}::date`),
          ))
      : Promise.resolve([]),
  ])

  const nextPost = nextRow?.username ? { slug: nextRow.slug, username: nextRow.username } : null
  const editHref = post.id ? `/edit/${post.id}` : null

  // Build 10-day calendar array
  const postDateSet = new Set(calendarRows.map(r => r.date))
  const base = new Date(currentDate + 'T12:00:00Z')
  const calendarDays = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() - (9 - i))
    const iso = d.toISOString().slice(0, 10)
    return { date: iso, hasPost: postDateSet.has(iso) }
  })

  return (
    <>
      <PostInfoSection post={post} calendarDays={calendarDays} />
      <JournalPhotoSection imageUrl={post.image} title={post.title} caption={post.imageCaption} />

      <div className="post-reading-end">
        <p className="post-reading-end-label">YOU HAVE BEEN READING</p>
        <p className="post-reading-end-title">{post.title}</p>
        <p className="post-reading-end-date">{formatReadingDate(post.date)}</p>
        <div className="post-reading-end-logo">
          <a href="/" aria-label="Home">
            <WolfLogo size={64} className="post-reading-end-wolf" />
          </a>
        </div>
      </div>

      <BottomNav username={username} nextPost={nextPost} isOwner={isOwner} editHref={editHref} />
    </>
  )
}

function formatReadingDate(date: string) {
  const d = new Date(date + 'T00:00:00')
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const day = d.getDate()
  const suffix = [, 'st', 'nd', 'rd'][day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10 ? day % 10 : 0)] || 'th'
  return `${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`
}
