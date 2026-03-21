import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { eveningReflection, posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function requirePostOwner(postId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorised', status: 401 }
  const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId))
  if (!post) return { error: 'Not found', status: 404 }
  if (post.authorId !== session.user.id) return { error: 'Forbidden', status: 403 }
  return { error: null, status: 200 }
}

// GET /api/evening-reflection?postId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const { error, status } = await requirePostOwner(postId)
  if (error) return NextResponse.json({ error }, { status })

  const [row] = await db.select().from(eveningReflection).where(eq(eveningReflection.postId, postId))
  return NextResponse.json(row ?? null)
}

// POST /api/evening-reflection
export async function POST(request: Request) {
  const { postId, reflection, wentToPlan, dayRating } = await request.json()

  if (!postId || !reflection || wentToPlan === undefined || !dayRating) {
    return NextResponse.json({ error: 'postId, reflection, wentToPlan and dayRating are required' }, { status: 400 })
  }

  const { error, status } = await requirePostOwner(postId)
  if (error) return NextResponse.json({ error }, { status })

  const [existing] = await db.select({ id: eveningReflection.id }).from(eveningReflection).where(eq(eveningReflection.postId, postId))

  if (existing) {
    const [updated] = await db
      .update(eveningReflection)
      .set({ reflection, wentToPlan, dayRating, updatedAt: new Date() })
      .where(eq(eveningReflection.postId, postId))
      .returning()
    return NextResponse.json(updated)
  }

  const [created] = await db.insert(eveningReflection).values({ postId, reflection, wentToPlan, dayRating }).returning()
  return NextResponse.json(created, { status: 201 })
}
