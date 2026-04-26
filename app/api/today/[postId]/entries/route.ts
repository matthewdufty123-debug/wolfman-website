import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts, journalEntries } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { reconstructContent } from '@/lib/db/queries'

const VALID_TYPES = ['intention', 'gratitude', 'great_at', 'reflection']

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { postId } = await params

  // Verify ownership
  const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { type, content } = body

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  if (!content || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  // Determine sort order — append after existing entries of this type
  const existing = await db
    .select({ sortOrder: journalEntries.sortOrder })
    .from(journalEntries)
    .where(eq(journalEntries.postId, postId))

  const maxSort = existing.reduce((max, r) => Math.max(max, r.sortOrder), -1)

  const [entry] = await db.insert(journalEntries).values({
    postId,
    type,
    content: content.trim(),
    source: 'web',
    sortOrder: maxSort + 1,
  }).returning()

  // Rebuild posts.content for dual-write
  await reconstructContent(postId)

  return NextResponse.json({ entry }, { status: 201 })
}
