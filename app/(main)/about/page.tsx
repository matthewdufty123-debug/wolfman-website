import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { siteMetadata } from '@/lib/metadata'
import SectionHeader from '@/components/SectionHeader'

export const metadata: Metadata = siteMetadata({
  title: 'About Wolfman',
  description: 'Matthew Wolfman — data engineer, mountain biker, photographer, wood carver, and mindful human being. The story behind wolfman.blog and the morning journalling practice.',
  path: '/about',
})

export default async function AboutPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user?.id

  return (
    <main className="wolfbot-page">
      <SectionHeader section="discover" current="/about" />

      <div className="wolfbot-page-content">

        {/* Section 1 — What Wolfman is */}
        <div className="wolfbot-page-section">
          <p className="wolfbot-page-section-label">The practice</p>
          <h1 className="wolfbot-page-section-heading">What is Wolfman?</h1>
          <p className="wolfbot-page-body">
            wolfman.blog is a mindful morning journalling app. Every morning, you write your
            intention for the day, note something you are grateful for, and name one thing you
            are genuinely great at. You log how your brain, body, happiness, and stress felt
            when you woke up. You record which morning rituals you completed.
          </p>
          <p className="wolfbot-page-body">
            Over time, a picture forms. Not a performance of wellness — an honest record of
            how you actually show up each morning, and how that shapes the day that follows.
          </p>
          <p className="wolfbot-page-body">
            The site was built by Matthew Wolfman — a data engineer, mountain biker, photographer,
            and wood carver based in the UK. Everything here is authentic, personal, and real.
          </p>
          <div className="about-links-row">
            <Link href="/feed" className="beta-link">Read the journals →</Link>
            <Link href="/subscriptions" className="beta-link">What&apos;s included →</Link>
            <Link href="/data-policy" className="beta-link">How your data is handled →</Link>
          </div>
        </div>

        {/* Section 2 — Matthew's personal story (placeholder pending Matthew's content) */}
        <div className="wolfbot-page-section">
          <p className="wolfbot-page-section-label">The story</p>
          <h2 className="wolfbot-page-section-heading">Matthew&apos;s story</h2>
          <div className="about-story-placeholder">
            <p className="about-placeholder-note">
              Matthew is writing this section. It will be here soon — honestly, in his own words,
              from the beginning. No polish. No corporate bio. Just the story of how he got here.
            </p>
          </div>
          <div className="about-photo-placeholder">
            <p className="about-placeholder-note">Photography coming soon.</p>
          </div>
        </div>

        {/* Section 3 — Why the practice matters */}
        <div className="wolfbot-page-section">
          <p className="wolfbot-page-section-label">Why it matters</p>
          <h2 className="wolfbot-page-section-heading">A few honest minutes each morning.</h2>
          <p className="wolfbot-page-body">
            The morning sets the day. Not in a motivational poster way — in a real, practical,
            biological way. How you start shapes how you think, how you react, and what you
            notice. Most people let the morning happen to them. A journal makes it intentional.
          </p>
          <p className="wolfbot-page-body">
            You do not need to be a writer. You do not need to have anything profound to say.
            You just need three minutes, an honest answer to three questions, and the willingness
            to look at how you actually feel before the day drowns it out.
          </p>
          <p className="wolfbot-page-body">
            That is it. The practice is simple. What it builds over time is not.
          </p>
        </div>

        {/* Section 4 — Call to action */}
        <div className="wolfbot-page-section">
          <p className="wolfbot-page-section-label">Start here</p>
          <h2 className="wolfbot-page-section-heading">Ready to begin?</h2>
          <p className="wolfbot-page-body">
            Your first journal takes three minutes. There is no right way to do it.
            Just open the page and start writing.
          </p>
          {isLoggedIn ? (
            <Link href="/write" className="about-cta-button">Write this morning&apos;s journal</Link>
          ) : (
            <Link href="/register" className="about-cta-button">Create your account — it&apos;s free</Link>
          )}
        </div>

      </div>
    </main>
  )
}
