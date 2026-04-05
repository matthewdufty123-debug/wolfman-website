import type { Metadata } from 'next'
import Link from 'next/link'
import { siteMetadata } from '@/lib/metadata'

export const metadata: Metadata = siteMetadata({
  title: 'Subscriptions',
  description: 'What you get with Wolfman — free and premium tiers explained clearly. Start with a 2-week full trial, no card required.',
  path: '/subscriptions',
})

export default function SubscriptionsPage() {
  return (
    <main className="beta-page">
      <div className="beta-card">
        <p className="beta-eyebrow">Subscriptions</p>
        <h1 className="beta-title">Simple, honest pricing.</h1>

        <p className="beta-intro">
          Start free. Every new account gets two weeks of full premium access — no card required,
          no catch. After that, carry on free or upgrade. Here is exactly what you get either way.
        </p>

        {/* Beta disclaimer */}
        <div className="subs-disclaimer">
          <p className="subs-disclaimer-text">
            Pricing is subject to change during the Beta testing period. All prices shown are
            for guidance only.
          </p>
        </div>

        {/* Tier comparison */}
        <div className="subs-tiers">

          {/* Free tier */}
          <div className="subs-tier">
            <div className="subs-tier-header">
              <p className="subs-tier-name">Free</p>
              <p className="subs-tier-price">£0 <span className="subs-tier-period">forever</span></p>
            </div>
            <ul className="subs-features">
              <li className="subs-feature">Private journalling</li>
              <li className="subs-feature">Morning intentions and rituals</li>
              <li className="subs-feature">Mood logging</li>
              <li className="subs-feature">Basic statistics</li>
              <li className="subs-feature">Data export and deletion</li>
              <li className="subs-feature">Community sharing (optional)</li>
            </ul>
            <div className="subs-trial-note">
              <p>Includes a 2-week full premium trial on signup</p>
            </div>
            <Link href="/register" className="subs-cta subs-cta--free">Start for free</Link>
          </div>

          {/* Premium tier */}
          <div className="subs-tier subs-tier--premium">
            <div className="subs-tier-header">
              <p className="subs-tier-name">Premium</p>
              <div className="subs-tier-pricing">
                <p className="subs-tier-price">£5 <span className="subs-tier-period">/ month</span></p>
                <p className="subs-tier-annual">or £45 / year <span className="subs-saving">25% saving</span></p>
              </div>
            </div>
            <ul className="subs-features">
              <li className="subs-feature">Everything in Free</li>
              <li className="subs-feature subs-feature--highlight">Unlimited WOLF|BOT AI reviews</li>
              <li className="subs-feature subs-feature--highlight">Advanced statistics and analytics</li>
            </ul>
            <Link href="/register" className="subs-cta subs-cta--premium">Start free trial</Link>
          </div>

        </div>

        {/* Footer links */}
        <div className="beta-section" style={{ marginTop: '2rem' }}>
          <p className="beta-section-body">
            For details on how your data is handled, see the{' '}
            <Link href="/data-policy" className="beta-link">Data Policy</Link>.
            For general terms of use, see the{' '}
            <Link href="/terms" className="beta-link">Terms page</Link>.
          </p>
        </div>

      </div>
    </main>
  )
}
