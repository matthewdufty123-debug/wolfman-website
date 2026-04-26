import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

function makeSlug(title: string, date: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  return `${date}-${base}`
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { postId } = await params
  const body = await request.json().catch(() => ({}))
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const [post] = await db.select({ id: posts.id, authorId: posts.authorId, date: posts.date, status: posts.status })
    .from(posts).where(eq(posts.id, postId)).limit(1)

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updates: Record<string, unknown> = { title, updatedAt: new Date() }

  // Regenerate slug if published
  if (post.status === 'published') {
    const newSlug = makeSlug(title, post.date)
    const slugExists = await db.select({ id: posts.id }).from(posts)
      .where(and(eq(posts.slug, newSlug))).limit(1)
    updates.slug = (slugExists.length > 0 && slugExists[0].id !== postId)
      ? `${newSlug}-${Date.now()}`
      : newSlug
  }

  await db.update(posts).set(updates).where(eq(posts.id, postId))

  return NextResponse.json({ title, slug: updates.slug ?? null })
}
