import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq, and, or, gt, lt, desc, asc } from 'drizzle-orm'

type AdjacentPost = { slug: string; username: string } | null

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user?.id ?? null

  // Fetch the current post
  const [current] = await db
    .select({ createdAt: posts.createdAt, authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1)

  if (!current) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Visibility filter: public published posts OR own posts
  const visibilityFilter = userId
    ? or(
        and(eq(posts.status, 'published'), eq(posts.isPublic, true)),
        eq(posts.authorId, userId)
      )
    : and(eq(posts.status, 'published'), eq(posts.isPublic, true))

  // prev = newer post (createdAt > current, ascending to get the closest one)
  const [prevRow] = await db
    .select({ slug: posts.slug, username: users.username })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(visibilityFilter, gt(posts.createdAt, current.createdAt)))
    .orderBy(asc(posts.createdAt))
    .limit(1)

  // next = older post (createdAt < current, descending to get the closest one)
  const [nextRow] = await db
    .select({ slug: posts.slug, username: users.username })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(visibilityFilter, lt(posts.createdAt, current.createdAt)))
    .orderBy(desc(posts.createdAt))
    .limit(1)

  const prev: AdjacentPost = prevRow?.username ? { slug: prevRow.slug, username: prevRow.username } : null
  const next: AdjacentPost = nextRow?.username ? { slug: nextRow.slug, username: nextRow.username } : null

  return NextResponse.json({ prev, next })
}
