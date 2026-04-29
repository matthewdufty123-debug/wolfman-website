import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, scaleEntries } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ postId: string; entryId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { postId, entryId } = await params

  const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify entry belongs to this post
  const [entry] = await db.select({ id: scaleEntries.id })
    .from(scaleEntries)
    .where(and(eq(scaleEntries.id, entryId), eq(scaleEntries.postId, postId)))
    .limit(1)
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.value != null) {
    if (typeof body.value !== 'number' || body.value < 1 || body.value > 8) {
      return NextResponse.json({ error: 'value must be 1-8' }, { status: 400 })
    }
    updates.value = body.value
  }
  if (body.note !== undefined) {
    updates.note = body.note ?? null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const [updated] = await db.update(scaleEntries)
    .set(updates)
    .where(eq(scaleEntries.id, entryId))
    .returning({
      id: scaleEntries.id,
      type: scaleEntries.type,
      value: scaleEntries.value,
      note: scaleEntries.note,
      source: scaleEntries.source,
      createdAt: scaleEntries.createdAt,
    })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string; entryId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { postId, entryId } = await params

  const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify entry belongs to this post
  const [entry] = await db.select({ id: scaleEntries.id })
    .from(scaleEntries)
    .where(and(eq(scaleEntries.id, entryId), eq(scaleEntries.postId, postId)))
    .limit(1)
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  await db.delete(scaleEntries).where(eq(scaleEntries.id, entryId))

  return NextResponse.json({ ok: true })
}
