import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { wolfbotReviews } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

const VALID_ACTIONS = ['trigger', 'helpful', 'intellectual', 'lovely', 'sassy', 'play'] as const
type Action = typeof VALID_ACTIONS[number]

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { action } = await req.json() as { action: string }

    if (!VALID_ACTIONS.includes(action as Action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const increment = {
      trigger:      { triggerCount:      sql`${wolfbotReviews.triggerCount} + 1` },
      helpful:      { countHelpful:      sql`${wolfbotReviews.countHelpful} + 1` },
      intellectual: { countIntellectual: sql`${wolfbotReviews.countIntellectual} + 1` },
      lovely:       { countLovely:       sql`${wolfbotReviews.countLovely} + 1` },
      sassy:        { countSassy:        sql`${wolfbotReviews.countSassy} + 1` },
      play:         { countPlay:         sql`${wolfbotReviews.countPlay} + 1` },
    }[action as Action]

    await db
      .update(wolfbotReviews)
      .set(increment)
      .where(eq(wolfbotReviews.postId, id))

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
