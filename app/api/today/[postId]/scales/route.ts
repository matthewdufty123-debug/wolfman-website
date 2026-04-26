import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, morningState } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { replaceScaleEntries } from '@/lib/db/queries'

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
  const { brainScale, bodyScale, happyScale, stressScale } = body

  // Upsert morningState (old table — dual-write)
  const [existingMs] = await db.select({ id: morningState.id }).from(morningState).where(eq(morningState.postId, postId)).limit(1)
  const scaleData = {
    brainScale: brainScale ?? null,
    bodyScale: bodyScale ?? null,
    happyScale: happyScale ?? null,
    stressScale: stressScale ?? null,
  }

  if (existingMs) {
    await db.update(morningState).set(scaleData).where(eq(morningState.postId, postId))
  } else {
    await db.insert(morningState).values({
      postId,
      ...scaleData,
      routineChecklist: {},
    })
  }

  // Replace scaleEntries (new table)
  await replaceScaleEntries(postId, body)

  return NextResponse.json({ ok: true })
}
