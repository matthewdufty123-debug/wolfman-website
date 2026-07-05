import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePost } from '@/lib/revalidate-post'

/** Flip a post's community visibility — works on drafts and published posts,
 * so a journal published as Private is never stuck that way. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { postId } = await params

  const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  if (typeof body.isPublic !== 'boolean') {
    return NextResponse.json({ error: 'isPublic must be a boolean' }, { status: 400 })
  }

  await db.update(posts).set({ isPublic: body.isPublic, updatedAt: new Date() }).where(eq(posts.id, postId))

  // The home page and feed are ISR-cached — refresh so the change shows immediately
  await revalidatePost(postId)

  return NextResponse.json({ ok: true, isPublic: body.isPublic })
}
