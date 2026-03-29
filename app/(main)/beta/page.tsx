import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { getSiteConfig } from '@/lib/site-config'
import { siteMetadata } from '@/lib/metadata'
import BetaInterestForm from '@/components/BetaInterestForm'
import { db } from '@/lib/db'
import { betaInterest } from '@/lib/db/schema'
import { count, notInArray } from 'drizzle-orm'
import SectionHeader from '@/components/SectionHeader'

export const metadata: Metadata = siteMetadata({
  title: 'Public Beta',
  description: 'What the wolfman.blog public beta is, when it opens, and how to register your interest.',
  path: '/beta',
})

export default async function BetaPage() {
  const [config, session, [{ total }]] = await Promise.all([
    getSiteConfig(),
    auth(),
    db.select({ total: count() }).from(betaInterest).where(
      notInArray(betaInterest.emailStatus, ['bounced', 'complained'])
    ),
  ])

  const showInterestForm = config.status === 'closed_alpha' && !session?.user?.id
  const subscriberCount = Number(total)
  const cap = config.userCap ?? 51
  const percentage = Math.round((subscriberCount / cap) * 100)

  return (
    <main className="beta-page">
      <SectionHeader section="beta" current="/beta" />
      <div className="beta-card">

        {/* ── Interest form — closed alpha, logged-out visitors only ── */}
        {showInterestForm && (
          <div className="beta-interest-block">
            <p className="beta-eyebrow">Register your interest</p>
            <h1 className="beta-interest-heading">Be first through the door.</h1>
            <p className="beta-interest-subtext">
              The public beta opens on 1 May 2026. Leave your details and
              you&apos;ll hear from us the moment registration opens.
            </p>
            <BetaInterestForm source="beta-page" />
          </div>
        )}

        {/* ── Subscriber stats ── */}
        <div className="beta-stats">
          <p className="beta-stats-number">
            <span className="beta-stats-count">{subscriberCount}</span>
            <span className="beta-stats-of"> of {cap}</span>
          </p>
          <p className="beta-stats-label">subscribed for Public Beta Testing</p>
          <p className="beta-stats-percent">{percentage}% subscribed</p>
        </div>

        {/* ── What is wolfman.blog? ── */}
        <p className="beta-eyebrow">Public Beta</p>
        <h1 className={showInterestForm ? 'beta-section-title' : 'beta-title'}>
          {showInterestForm ? 'A mindful morning journaling app.' : 'You\u2019re part of something real.'}
        </h1>
        <p className="beta-intro">
          wolfman.blog is a public beta for a mindful morning journalling app. Real people, real
          mornings, real data. You log your intentions, your mood, your rituals &mdash; and gradually,
          a picture of your inner life starts to form.
        </p>

        {/* ── Timeline ── */}
        <div className="beta-section">
          <h2 className="beta-section-title">Timeline</h2>
          <table className="beta-timeline" aria-label="Beta timeline">
            <thead>
              <tr>
                <th>Phase</th>
                <th>Dates</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Closed Alpha</td>
                <td>Now &rarr; 30 April 2026</td>
                <td><span className="beta-timeline-status beta-timeline-status--active">Active</span></td>
              </tr>
              <tr>
                <td>Public Beta opens</td>
                <td>1 May 2026</td>
                <td><span className="beta-timeline-status beta-timeline-status--upcoming">Upcoming</span></td>
              </tr>
              <tr>
                <td>Public Beta closes</td>
                <td>31 August 2026</td>
                <td><span className="beta-timeline-status beta-timeline-status--upcoming">Upcoming</span></td>
              </tr>
              <tr>
                <td>Full launch</td>
                <td>After beta</td>
                <td><span className="beta-timeline-status beta-timeline-status--tbd">TBD</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── What you get ── */}
        <div className="beta-section">
          <h2 className="beta-section-title">What you get</h2>
          <p className="beta-section-body">
            Daily intention setting, morning ritual tracking, AI-generated synthesis
            of your entries, personal statistics, and a private journal &mdash; all in one
            calm, minimal app.{' '}
            <Link href="/features" className="beta-link">See the full roadmap &rarr;</Link>
          </p>
        </div>

        {/* ── Data promise ── */}
        <div className="beta-section">
          <h2 className="beta-section-title">Your data is yours</h2>
          <p className="beta-section-body">
            Everything you write here is private. Only you can see your journal entries.
            Matthew&apos;s posts are the only ones visible to the public &mdash; your mornings are
            between you and the page.
          </p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">If the beta succeeds</h2>
          <p className="beta-section-body">
            The site continues. Your data stays exactly where it is. Nothing changes except the
            label on the door. You carry on as if nothing happened &mdash; because nothing needs to.
          </p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">If the beta ends</h2>
          <p className="beta-section-body">
            You&apos;ll hear from Matthew directly &mdash; no automated silence. You&apos;ll have
            30 days from that message to download everything you&apos;ve written. After 30 days,
            your data is deleted completely and permanently. No backups, no exceptions &mdash; your
            journal is yours to take or leave.
          </p>
        </div>

        {/* ── Questions ── */}
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
