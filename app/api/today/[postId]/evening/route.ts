import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { upsertReflectionEntry } from '@/lib/db/queries'

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

  const body = await request.json()
  const { eveningReflection, feelAboutToday } = body

  await db.update(posts).set({
    eveningReflection: eveningReflection || null,
    feelAboutToday: feelAboutToday ?? null,
    updatedAt: new Date(),
  }).where(eq(posts.id, postId))

  // Dual-write reflection to journalEntries
  await upsertReflectionEntry(postId, eveningReflection)

  return NextResponse.json({ ok: true })
}
