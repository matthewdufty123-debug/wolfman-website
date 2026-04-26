import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, journalEntries } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { reconstructContent } from '@/lib/db/queries'

type Params = { params: Promise<{ postId: string; entryId: string }> }

async function verifyOwnership(postId: string, userId: string) {
  const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1)
  if (!post) return 'not_found'
  if (post.authorId !== userId) return 'forbidden'
  return 'ok'
}

export async function PUT(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { postId, entryId } = await params
  const check = await verifyOwnership(postId, session.user.id)
  if (check === 'not_found') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (check === 'forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { content } = body

  if (!content || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const [entry] = await db.update(journalEntries)
    .set({ content: content.trim(), updatedAt: new Date() })
    .where(eq(journalEntries.id, entryId))
    .returning()

  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  await reconstructContent(postId)

  return NextResponse.json({ entry })
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { postId, entryId } = await params
  const check = await verifyOwnership(postId, session.user.id)
  if (check === 'not_found') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (check === 'forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.delete(journalEntries).where(eq(journalEntries.id, entryId))
  await reconstructContent(postId)

  return NextResponse.json({ ok: true })
}
