import { db } from '@/lib/db'
import { posts as postsTable, users as usersTable } from '@/lib/db/schema'
import { eq, gt, lt, and, or, desc, asc, gte, lte, sql } from 'drizzle-orm'
import type { ProcessedPost } from '@/lib/posts'
import PostInfoSection from '@/components/journal/PostInfoSection'
import JournalPhotoSection from '@/components/journal/JournalPhotoSection'
import BottomNav from '@/components/journal/BottomNav'

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
        <div style={{ height: 3, background: '#A0622A', marginTop: '2.5rem', marginBottom: '1.5rem' }} />
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
      <div style={{ height: 3, background: '#A0622A', marginTop: '2.5rem', marginBottom: '1.5rem' }} />
      <PostInfoSection post={post} calendarDays={calendarDays} />
      <JournalPhotoSection imageUrl={post.image} title={post.title} caption={post.imageCaption} />
      <BottomNav username={username} nextPost={nextPost} isOwner={isOwner} editHref={editHref} />
    </>
  )
}
