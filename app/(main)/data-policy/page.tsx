import type { Metadata } from 'next'
import Link from 'next/link'
import { siteMetadata } from '@/lib/metadata'

export const metadata: Metadata = siteMetadata({
  title: 'Data Policy',
  description: 'How wolfman.app handles your data. Plain English, no jargon. We do not sell it, we do not share it, and it is always yours.',
  path: '/data-policy',
})

export default function DataPolicyPage() {
  return (
    <main className="beta-page">
      <div className="beta-card">
        <p className="beta-eyebrow">Data Policy</p>
        <h1 className="beta-title">Your data. Your rules. Always.</h1>

        <p className="beta-intro">
          wolfman.app handles deeply personal information — your mood, your intentions, your
          private journal entries. You deserve to know exactly what we do with it. This page
          says it plainly, without legal jargon, because that is the only honest way to do it.
        </p>

        {/* The four commitments */}
        <div className="beta-section">
          <h2 className="beta-section-title">We do not sell your data</h2>
          <p className="beta-section-body">
            Full stop. Your journal entries, your mood scores, your morning rituals — none of
            it is sold to anyone, ever. There are no advertising partners. There is no data
            broker relationship. This is not a loophole-filled promise. It is a hard rule.
          </p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">We do not share your data</h2>
          <p className="beta-section-body">
            Your data is not shared with third parties beyond what is technically required to
            run the service — the database provider (Neon), the hosting platform (Vercel), and
            the AI that powers WOLF|BOT (Anthropic). Each of these handles data under their
            own strict privacy policies. We do not share your data for any other purpose.
          </p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">You can download or delete your data at any time</h2>
          <p className="beta-section-body">
            Your data is yours. You can request a full export of everything we hold about you,
            or ask for it to be permanently deleted. During the beta, contact Matthew directly
            via the{' '}
            <Link href="/feedback" className="beta-link">feedback form</Link>.
            A self-serve download and deletion tool is coming in Release 0.1.
          </p>
        </div>

        <div className="beta-section">
          <h2 className="beta-section-title">All your data is encrypted</h2>
          <p className="beta-section-body">
            Data is encrypted in transit (HTTPS everywhere) and at rest on our database
            provider&apos;s infrastructure. Authentication uses secure HTTP-only cookies.
            No passwords are stored in plain text — they are hashed with bcrypt before
            being saved.
          </p>
        </div>

        {/* Funding transparency */}
        <div className="beta-section">
          <h2 className="beta-section-title">How this site is funded</h2>
          <p className="beta-section-body">
            Wolfman is funded entirely by subscriptions and shop sales. No ads, no data sold,
            no outside investment. Your subscription helps cover the cost of running the service,
            the AI that powers WOLF|BOT, and the occasional coffee that keeps me going while
            I build new features.
          </p>
        </div>

        {/* Aggregated data */}
        <div className="beta-section">
          <h2 className="beta-section-title">Aggregated insights</h2>
          <p className="beta-section-body">
            We use anonymised, aggregated data to publish insights about how our community
            shows up each morning. We will never publish results from a dataset small enough
            to identify individuals. Your personal data is always yours alone.
          </p>
        </div>

        {/* Links */}
        <div className="beta-section">
          <h2 className="beta-section-title">Questions or concerns</h2>
          <p className="beta-section-body">
            If you have any questions about how your data is handled, get in touch via the{' '}
            <Link href="/feedback" className="beta-link">feedback form</Link>.
            For the full legal terms governing your use of the site, see the{' '}
            <Link href="/terms" className="beta-link">Terms page</Link>.
          </p>
        </div>

        <p className="beta-section-body" style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.6 }}>
          Last updated: April 2026. A full legal review will be completed before v1.0 — see{' '}
          <Link href="/features" className="beta-link">Release 0.9 — Legal</Link>.
        </p>
      </div>
    </main>
  )
}
