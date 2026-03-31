import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, morningState } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function makeSlug(title: string, date: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  return `${date}-${base}`
}

// GET /api/posts — user's own posts, optionally filtered by status
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const conditions = [eq(posts.authorId, session.user.id)]
  if (status) conditions.push(eq(posts.status, status))

  const rows = await db
    .select({ id: posts.id, slug: posts.slug, title: posts.title, date: posts.date, status: posts.status, createdAt: posts.createdAt })
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))

  return NextResponse.json(rows)
}

// POST /api/posts — create new post for authenticated user
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { title, date, content, category, excerpt, status: reqStatus, morning, isPublic, image, videoId, eveningReflection, feelAboutToday } = body

  if (!title || !date || !content) {
    return NextResponse.json({ error: 'title, date and content are required' }, { status: 400 })
  }

  const status = reqStatus === 'published' ? 'published' : 'draft'
  const slug = makeSlug(title, date)

  // Ensure unique slug
  const existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug))
  const finalSlug = existing.length > 0 ? `${slug}-${Date.now()}` : slug

  const [post] = await db.insert(posts).values({
    slug: finalSlug,
    title,
    date,
    category: category ?? 'morning-intention',
    content,
    excerpt: excerpt || null,
    image: image || null,
    videoId: videoId || null,
    authorId: session.user.id,
    status,
    isPublic: Boolean(isPublic),
    publishedAt: status === 'published' ? new Date() : new Date(0),
    eveningReflection: eveningReflection || null,
    feelAboutToday: feelAboutToday ?? null,
  }).returning({ id: posts.id, slug: posts.slug })

  if (morning && post) {
    await db.insert(morningState).values({
      postId: post.id,
      brainScale: morning.brainScale,
      bodyScale: morning.bodyScale,
      happyScale: morning.happyScale ?? null,
      stressScale: morning.stressScale ?? null,
      routineChecklist: morning.routineChecklist,
    })
  }

  return NextResponse.json(post, { status: 201 })
}
