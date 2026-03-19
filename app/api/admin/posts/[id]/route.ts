import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, morningState } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id } = await params
  const [post] = await db.select().from(posts).where(eq(posts.id, id))
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const [ms] = await db.select().from(morningState).where(eq(morningState.postId, id))
  return NextResponse.json({ ...post, morning: ms ?? null })
}
