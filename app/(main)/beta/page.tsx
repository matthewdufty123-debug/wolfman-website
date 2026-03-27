import type { Metadata } from 'next'
import Link from 'next/link'
import BetaCountdown from '@/components/BetaCountdown'
import { siteMetadata } from '@/lib/metadata'
import { getSiteConfig } from '@/lib/site-config'
import { db } from '@/lib/db'
import { betaInterest } from '@/lib/db/schema'
import { count, notInArray } from 'drizzle-orm'

export const metadata: Metadata = siteMetadata({
  title: 'Public Beta',
  description: 'What the Wolfman public beta is, how long it runs, and what happens to your data.',
  path: '/beta',
})

export default async function BetaPage() {
  const [config, [{ total }]] = await Promise.all([
    getSiteConfig(),
    db.select({ total: count() }).from(betaInterest).where(
      notInArray(betaInterest.emailStatus, ['bounced', 'complained'])
    ),
  ])

  const subscriberCount = Number(total)
  const cap = config.userCap ?? 51
  const percentage = Math.round((subscriberCount / cap) * 100)

  return (
    <main className="beta-page">
      <div className="beta-card">
        <p className="beta-eyebrow">Public Beta</p>
        <h1 className="beta-title">You&apos;re part of something real.</h1>

        <div className="beta-stats">
          <p className="beta-stats-number">
            <span className="beta-stats-count">{subscriberCount}</span>
            <span className="beta-stats-of"> of {cap}</span>
          </p>
          <p className="beta-stats-label">subscribed for Public Beta Testing</p>
          <p className="beta-stats-percent">{percentage}% subscribed</p>
        </div>

        <p className="beta-intro">
          wolfman.blog is a public beta for a mindful morning journalling app. Real people, real
          mornings, real data. You log your intentions, your mood, your rituals — and gradually,
          a picture of your inner life starts to form.
        </p>

        <div className="beta-countdown-block">
          <BetaCountdown className="beta-countdown" />
          <p className="beta-end-date">Beta closes 31 August 2026</p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">Your data is yours</h2>
          <p className="beta-section-body">
            Everything you write here is private. Only you can see your journal entries.
            Matthew&apos;s posts are the only ones visible to the public — your mornings are
            between you and the page.
          </p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">If the beta succeeds</h2>
          <p className="beta-section-body">
            The site continues. Your data stays exactly where it is. Nothing changes except the
            label on the door. You carry on as if nothing happened — because nothing needs to.
          </p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">If the beta ends</h2>
          <p className="beta-section-body">
            You&apos;ll hear from Matthew directly — no automated silence. You&apos;ll have
            30 days from that message to download everything you&apos;ve written. After 30 days,
            your data is deleted completely and permanently. No backups, no exceptions — your
            journal is yours to take or leave.
          </p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">Questions?</h2>
          <p className="beta-section-body">
            Matthew is a real person and reads everything.{' '}
            <Link href="/feedback" className="beta-link">Leave a note via the feedback form</Link>
            {', '}read the{' '}
            <Link href="/terms" className="beta-link">terms and conditions</Link>
            {', '}or find him on{' '}
            <a
              href="https://www.linkedin.com/in/matthewwolfman"
              className="beta-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
