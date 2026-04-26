import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateTitle } from '@/lib/ai/title'

export const maxDuration = 30

// Stub: all users treated as premium. Wire to billing in Release 0.8.
function isPremium(_userId: string): boolean { return true }

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const [post] = await db.select().from(posts).where(eq(posts.id, id))
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!isPremium(session.user.id)) {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 })
  }

  const used = post.titleSuggestionsUsed ?? 0
  if (used >= 2) {
    return NextResponse.json({ error: 'limit_reached' }, { status: 403 })
  }

  const title = await generateTitle(id, post.content)
  const suggestionsLeft = 2 - (used + 1)

  return NextResponse.json({ title, suggestionsLeft })
}
