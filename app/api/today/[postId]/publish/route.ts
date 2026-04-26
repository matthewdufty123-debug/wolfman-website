import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { deriveExcerpt } from '@/lib/posts'
import { notifyAdminFirstPost } from '@/lib/email'
import { generateTitle } from '@/lib/ai/title'

export const maxDuration = 30

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
  const isFirstPublish = post.status !== 'published'

  // Auto-generate title if still the default pattern
  let title = post.title
  if (isFirstPublish && /^Today's Intentional Journal/.test(title) && (post.content ?? '').length > 20) {
    try {
      title = await generateTitle(postId, post.content ?? '')
      await db.update(posts).set({ title }).where(eq(posts.id, postId))
    } catch {
      // Non-fatal — keep default title
    }
  }

  // Generate excerpt from content
  const excerpt = deriveExcerpt(post.content ?? '')

  // Generate slug from (possibly new) title
  const newSlug = makeSlug(title, post.date)
  const slugExists = await db.select({ id: posts.id }).from(posts)
    .where(and(eq(posts.slug, newSlug)))
    .limit(1)
  const finalSlug = (slugExists.length > 0 && slugExists[0].id !== postId)
    ? `${newSlug}-${Date.now()}`
    : newSlug

  const publishedAt = new Date()

  await db.update(posts).set({
    status: 'published',
    publishedAt,
    excerpt: excerpt || null,
    slug: finalSlug,
    isPublic: Boolean(isPublic),
    updatedAt: new Date(),
  }).where(eq(posts.id, postId))

  // Trigger WOLF|BOT review on first publish (fire-and-forget)
  if (isFirstPublish) {
    triggerWolfbotReview(postId).catch(() => {})

    // Notify admin on user's first-ever published post
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
            postTitle: title,
            postUrl: `https://wolfman.app/${author.username}/${finalSlug}`,
          })
        }
      }
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json({ slug: finalSlug, title, publishedAt: publishedAt.toISOString() })
}

async function triggerWolfbotReview(postId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
  await fetch(`${baseUrl}/api/posts/${postId}/wolfbot-reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autoTriggered: true }),
  })
}
