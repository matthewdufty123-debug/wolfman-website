import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { insertSingleScaleEntry } from '@/lib/db/queries'

const VALID_TYPES = ['brain', 'body', 'happy', 'stress']

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { postId } = await params

  const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { type, value, note } = body

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'type must be brain, body, happy, or stress' }, { status: 400 })
  }
  if (typeof value !== 'number' || value < 1 || value > 8) {
    return NextResponse.json({ error: 'value must be 1-8' }, { status: 400 })
  }
  if (note != null && typeof note !== 'string') {
    return NextResponse.json({ error: 'note must be a string' }, { status: 400 })
  }

  const entry = await insertSingleScaleEntry(postId, type, value, 'web', note)
  return NextResponse.json(entry, { status: 201 })
}
