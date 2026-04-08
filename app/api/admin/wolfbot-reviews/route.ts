import { auth } from '@/auth'
import { db } from '@/lib/db'
import { wolfbotReviews, posts } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

// GET — return the 20 most recent wolfbot reviews with post context
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const rows = await db
    .select({
      id: wolfbotReviews.id,
      postId: wolfbotReviews.postId,
      review: wolfbotReviews.review,
      moodSignal: wolfbotReviews.moodSignal,
      themeWords: wolfbotReviews.themeWords,
      journalContext: wolfbotReviews.journalContext,
      modelUsed: wolfbotReviews.modelUsed,
      inputTokensTotal: wolfbotReviews.inputTokensTotal,
      outputTokensTotal: wolfbotReviews.outputTokensTotal,
      generatedAt: wolfbotReviews.generatedAt,
      postTitle: posts.title,
      postDate: posts.date,
    })
    .from(wolfbotReviews)
    .innerJoin(posts, eq(wolfbotReviews.postId, posts.id))
    .orderBy(desc(wolfbotReviews.generatedAt))
    .limit(20)

  return NextResponse.json(rows)
}
