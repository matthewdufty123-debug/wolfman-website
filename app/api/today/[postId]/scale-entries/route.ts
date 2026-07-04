import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { upsertScaleEntry, clearScaleEntry } from '@/lib/db/queries'

const VALID_TYPES = ['brain', 'body', 'happy', 'stress']

async function authorisePost(postId: string): Promise<NextResponse | null> {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return null
}

/** Set a scale value for the day — one snapshot per day (#288). */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params
  const denied = await authorisePost(postId)
  if (denied) return denied

  const { type, value } = await request.json()

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'type must be brain, body, happy, or stress' }, { status: 400 })
  }
  if (typeof value !== 'number' || value < 1 || value > 8) {
    return NextResponse.json({ error: 'value must be 1-8' }, { status: 400 })
  }

  const entry = await upsertScaleEntry(postId, type, value, 'web')
  return NextResponse.json(entry)
}

/** Clear a scale value for the day. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params
  const denied = await authorisePost(postId)
  if (denied) return denied

  const { type } = await request.json()

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'type must be brain, body, happy, or stress' }, { status: 400 })
  }

  await clearScaleEntry(postId, type)
  return NextResponse.json({ ok: true })
}
