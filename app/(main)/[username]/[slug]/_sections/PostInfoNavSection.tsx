import { db } from '@/lib/db'
import { posts as postsTable, users as usersTable } from '@/lib/db/schema'
import { eq, gt, lt, and, or, desc, asc } from 'drizzle-orm'
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

  const [prevRow, nextRow] = await Promise.all([
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
  ])

  const nextPost = nextRow?.username ? { slug: nextRow.slug, username: nextRow.username } : null
  const editHref = post.id ? `/edit/${post.id}` : null

  return (
    <>
      <PostInfoSection post={post} />
      <JournalPhotoSection imageUrl={post.image} title={post.title} caption={post.imageCaption} />
      <BottomNav username={username} nextPost={nextPost} isOwner={isOwner} editHref={editHref} />
    </>
  )
}
