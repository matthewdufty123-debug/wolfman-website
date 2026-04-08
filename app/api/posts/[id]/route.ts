import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, morningState } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { notifyAdminFirstPost } from '@/lib/email'
import { calculateWordCounts } from '@/lib/word-count'

async function requireOwner(postId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorised', status: 401, session: null, post: null }
  const [post] = await db.select().from(posts).where(eq(posts.id, postId))
  if (!post) return { error: 'Not found', status: 404, session: null, post: null }
  if (post.authorId !== session.user.id) return { error: 'Forbidden', status: 403, session: null, post: null }
  return { error: null, status: 200, session, post }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error, status, post } = await requireOwner(id)
  if (error) return NextResponse.json({ error }, { status })

  const [ms] = await db.select().from(morningState).where(eq(morningState.postId, id))
  return NextResponse.json({ ...post, morning: ms ?? null })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error, status, session, post: existingPost } = await requireOwner(id)
  if (error) return NextResponse.json({ error }, { status })

  const body = await request.json()
  const { title, date, content, excerpt, status: reqStatus, morning, isPublic, image, videoId, eveningReflection, feelAboutToday } = body

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (title) updateData.title = title
  if (date) updateData.date = date
  if (content) {
    updateData.content = content
    Object.assign(updateData, calculateWordCounts(content))
  }
  if (excerpt !== undefined) updateData.excerpt = excerpt || null
  if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic)
  if (image !== undefined) updateData.image = image || null
  if (videoId !== undefined) updateData.videoId = videoId || null
  if (eveningReflection !== undefined) updateData.eveningReflection = eveningReflection || null
  if (feelAboutToday !== undefined) updateData.feelAboutToday = feelAboutToday ?? null
  const isFirstPublish = reqStatus === 'published' && existingPost?.status !== 'published'

  if (reqStatus === 'published') {
    updateData.status = 'published'
    updateData.publishedAt = new Date()
  } else if (reqStatus === 'draft') {
    updateData.status = 'draft'
  }

  const [updated] = await db.update(posts).set(updateData).where(eq(posts.id, id)).returning({ id: posts.id, slug: posts.slug })

  // Fire first-post notification if this is a brand-new publish
  if (isFirstPublish && session?.user?.id && updated?.slug) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(posts)
      .where(and(eq(posts.authorId, session.user.id), eq(posts.status, 'published')))
    if (Number(total) === 1) {
      const username = session.user.username ?? session.user.id
      notifyAdminFirstPost({
        username,
        postTitle: String(updateData.title ?? existingPost?.title ?? ''),
        postUrl: `https://wolfman.app/${username}/${updated.slug}`,
      })
    }
  }

  if (morning) {
    const [existing] = await db.select({ id: morningState.id }).from(morningState).where(eq(morningState.postId, id))
    if (existing) {
      await db.update(morningState)
        .set({
          brainScale: morning.brainScale ?? null,
          bodyScale: morning.bodyScale ?? null,
          happyScale: morning.happyScale ?? null,
          stressScale: morning.stressScale ?? null,
          routineChecklist: morning.routineChecklist,
        })
        .where(eq(morningState.postId, id))
    } else {
      await db.insert(morningState).values({
        postId: id,
        brainScale: morning.brainScale ?? null,
        bodyScale: morning.bodyScale ?? null,
        happyScale: morning.happyScale ?? null,
        stressScale: morning.stressScale ?? null,
        routineChecklist: morning.routineChecklist,
      })
    }
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error, status } = await requireOwner(id)
  if (error) return NextResponse.json({ error }, { status })

  await db.delete(posts).where(eq(posts.id, id))
  return NextResponse.json({ ok: true })
}
