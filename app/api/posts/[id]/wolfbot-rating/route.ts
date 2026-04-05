import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, wolfbotReviews } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// PATCH /api/posts/[id]/wolfbot-rating
// Body: { rating: 1 | 2 | 3 | null }
// 1 = 👎  2 = 👍  3 = 🔥

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, id))
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const rating: number | null = body.rating ?? null
  if (rating !== null && ![1, 2, 3].includes(rating)) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }

  const [existing] = await db.select({ id: wolfbotReviews.id })
    .from(wolfbotReviews).where(eq(wolfbotReviews.postId, id))
  if (!existing) return NextResponse.json({ error: 'No review found' }, { status: 404 })

  await db.update(wolfbotReviews)
    .set({ reviewRating: rating })
    .where(eq(wolfbotReviews.postId, id))

  return NextResponse.json({ ok: true, rating })
}
