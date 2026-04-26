import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { deriveExcerpt } from '@/lib/posts'
import { notifyAdminFirstPost } from '@/lib/email'

function makeSlug(title: string, date: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  return `${date}-${base}`
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { postId } = await params

  const [post] = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      title: posts.title,
      date: posts.date,
      content: posts.content,
      status: posts.status,
      slug: posts.slug,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1)

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const isPublic = body.isPublic ?? false

  // Generate excerpt from content
  const excerpt = deriveExcerpt(post.content ?? '')

  // Regenerate slug from title (might have been auto-generated)
  const newSlug = makeSlug(post.title, post.date)
  const slugExists = await db.select({ id: posts.id }).from(posts)
    .where(and(eq(posts.slug, newSlug)))
    .limit(1)
  const finalSlug = (slugExists.length > 0 && slugExists[0].id !== postId)
    ? `${newSlug}-${Date.now()}`
    : newSlug

  const isFirstPublish = post.status !== 'published'

  await db.update(posts).set({
    status: 'published',
    publishedAt: new Date(),
    excerpt: excerpt || null,
    slug: finalSlug,
    isPublic: Boolean(isPublic),
    updatedAt: new Date(),
  }).where(eq(posts.id, postId))

  // Notify admin on user's first-ever published post
  if (isFirstPublish) {
    try {
      const [publishedCount] = await db
        .select({ total: count() })
        .from(posts)
        .where(and(eq(posts.authorId, session.user.id), eq(posts.status, 'published')))

      if (publishedCount.total <= 1) {
        const [author] = await db.select({ username: users.username }).from(users).where(eq(users.id, session.user.id))
        if (author?.username) {
          await notifyAdminFirstPost({
            username: author.username,
            postTitle: post.title,
            postUrl: `https://wolfman.app/${author.username}/${finalSlug}`,
          })
        }
      }
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json({ slug: finalSlug })
}
