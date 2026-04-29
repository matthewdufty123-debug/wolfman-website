import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, morningState } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { calculateWordCounts } from '@/lib/word-count'
import { insertJournalEntries, insertScaleEntries, replaceJournalEntries, replaceScaleEntries } from '@/lib/db/queries'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

// GET /api/admin/posts — list all posts for the edit dropdown
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const allPosts = await db
    .select({ id: posts.id, slug: posts.slug, title: posts.title, date: posts.date, category: posts.category })
    .from(posts)
    .orderBy(posts.date)

  return NextResponse.json(allPosts)
}

// POST /api/admin/posts — create a new post
export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { slug, title, date, category, content, excerpt, image, videoId, review, morning } = body

  if (!slug || !title || !date || !content) {
    return NextResponse.json({ error: 'slug, title, date and content are required' }, { status: 400 })
  }

  // Check for duplicate slug
  const existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug))
  if (existing.length > 0) {
    return NextResponse.json({ error: `A post with slug "${slug}" already exists.` }, { status: 409 })
  }

  const [post] = await db.insert(posts).values({
    slug,
    title,
    date,
    category: category ?? 'morning-intention',
    content,
    excerpt: excerpt || null,
    image: image || null,
    videoId: videoId || null,
    review: review || null,
    authorId: session.user.id ?? null,
    publishedAt: new Date(),
    ...calculateWordCounts(content),
  }).returning({ id: posts.id, slug: posts.slug })

  // Save morning state if provided (routineChecklist only — scales go to scaleEntries)
  if (morning && post) {
    await db.insert(morningState).values({
      postId: post.id,
      routineChecklist: morning.routineChecklist ?? {},
    })
  }

  // Dual-write to new normalised tables
  if (post) {
    await insertJournalEntries(post.id, content)
    if (morning) await insertScaleEntries(post.id, morning)
  }

  return NextResponse.json(post, { status: 201 })
}

// PUT /api/admin/posts — update an existing post by id
export async function PUT(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { id, slug, title, date, category, content, excerpt, image, videoId, review, morning } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  // If slug is changing, check no other post uses the new slug
  if (slug) {
    const conflict = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, slug))
    if (conflict.length > 0 && conflict[0].id !== id) {
      return NextResponse.json({ error: `A post with slug "${slug}" already exists.` }, { status: 409 })
    }
  }

  const [updated] = await db
    .update(posts)
    .set({
      ...(slug      && { slug }),
      ...(title     && { title }),
      ...(date      && { date }),
      ...(category  && { category }),
      ...(content   && { content, ...calculateWordCounts(content) }),
      excerpt: excerpt || null,
      image:   image   || null,
      videoId: videoId || null,
      ...(review !== undefined && { review }),
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id))
    .returning({ id: posts.id, slug: posts.slug })

  if (!updated) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  // Upsert morning state if provided (routineChecklist only — scales go to scaleEntries)
  if (morning) {
    const [existing] = await db.select({ id: morningState.id }).from(morningState).where(eq(morningState.postId, id))
    if (existing) {
      await db.update(morningState)
        .set({ routineChecklist: morning.routineChecklist })
        .where(eq(morningState.postId, id))
    } else {
      await db.insert(morningState).values({ postId: id, routineChecklist: morning.routineChecklist ?? {} })
    }
  }

  // Dual-write to new normalised tables
  if (content) {
    await replaceJournalEntries(id, content)
  }
  if (morning) {
    await replaceScaleEntries(id, morning)
  }

  return NextResponse.json(updated)
}
