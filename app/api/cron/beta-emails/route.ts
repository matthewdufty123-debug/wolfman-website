import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { betaInterest, siteConfig } from '@/lib/db/schema'
import { notInArray, eq } from 'drizzle-orm'
import { sendBetaWeekNotice, sendBetaGoLive } from '@/lib/email'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [config] = await db.select().from(siteConfig).where(eq(siteConfig.id, 1)).limit(1)

    if (!config?.betaOpensAt) {
      return NextResponse.json({ ok: true, message: 'No betaOpensAt set — nothing to do' })
    }

    const sent = (config.betaEmailsSent ?? {}) as Record<string, boolean>
    const now = new Date()
    const betaOpensAt = new Date(config.betaOpensAt)
    const daysUntilOpen = (betaOpensAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    // Eligible recipients — exclude bounced and complained addresses
    const recipients = (await db
      .select({ email: betaInterest.email, name: betaInterest.name })
      .from(betaInterest)
      .where(notInArray(betaInterest.emailStatus, ['bounced', 'complained']))
    ) as { email: string; name: string | null }[]

    const actions: string[] = []

    // Email 2 — one week notice
    if (daysUntilOpen <= 7 && daysUntilOpen > 0 && !sent.week_notice) {
      await sendBetaWeekNotice({ recipients, betaOpensAt })
      await db
        .update(siteConfig)
        .set({ betaEmailsSent: { ...sent, week_notice: true }, updatedAt: new Date() })
        .where(eq(siteConfig.id, 1))
      actions.push(`week_notice sent to ${recipients.length} recipients`)
    }

    // Email 3 — go-live
    if (daysUntilOpen <= 0 && !sent.go_live) {
      await sendBetaGoLive({ recipients })
      await db
        .update(siteConfig)
        .set({ betaEmailsSent: { ...sent, week_notice: true, go_live: true }, updatedAt: new Date() })
        .where(eq(siteConfig.id, 1))
      actions.push(`go_live sent to ${recipients.length} recipients`)
    }

    return NextResponse.json({ ok: true, actions: actions.length ? actions : ['nothing to send'] })
  } catch (err) {
    console.error('[cron/beta-emails] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
