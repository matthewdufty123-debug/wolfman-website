import type { Metadata } from 'next'
import { siteMetadata } from '@/lib/metadata'
import SectionHeader from '@/components/SectionHeader'
import WolfBotIcon from '@/components/WolfBotIcon'
import { db } from '@/lib/db'
import { wolfbotReviews } from '@/lib/db/schema'
import { sql, isNotNull } from 'drizzle-orm'

export const metadata: Metadata = siteMetadata({
  title: 'WOLF|BOT — The AI Journalling Companion',
  description: 'Meet WOLF|BOT — an AI companion that reads every journal entry and responds with a genuine, specific perspective. Not a summary. A real response.',
  path: '/wolfbot',
})

export const revalidate = 300

async function getStats() {
  const [row] = await db
    .select({
      totalReviews: sql<number>`count(*)::int`,
      totalRated:   sql<number>`count(*) filter (where review_rating is not null)::int`,
      totalFire:    sql<number>`count(*) filter (where review_rating = 3)::int`,
      totalThumb:   sql<number>`count(*) filter (where review_rating = 2)::int`,
      totalPlay:    sql<number>`coalesce(sum(count_play), 0)::int`,
    })
    .from(wolfbotReviews)

  return row ?? { totalReviews: 0, totalRated: 0, totalFire: 0, totalThumb: 0, totalPlay: 0 }
}

export default async function WolfbotPage() {
  const stats = await getStats()

  const statItems = [
    { number: stats.totalReviews, label: 'Reviews Generated' },
    { number: stats.totalRated,   label: 'Reviews Rated' },
    { number: stats.totalFire,    label: '🔥 Nailed It' },
    { number: stats.totalThumb,   label: '👍 Good Review' },
    { number: stats.totalPlay,    label: 'Times Read Aloud' },
  ]

  return (
    <main className="wolfbot-page">
      <SectionHeader section="discover" current="/wolfbot" />

      <div className="wolfbot-page-content">

        {/* Hero */}
        <div className="wolfbot-page-hero">
          <WolfBotIcon size={80} />
          <div className="wolfbot-page-hero-title">
            <span className="wolfbot-page-hero-name">WOLF|BOT</span>
            <p className="wolfbot-page-hero-tagline">
              An AI companion that reads every journal and responds — honestly, specifically, and with the occasional bark.
            </p>
          </div>
        </div>

        {/* What is WOLF|BOT */}
        <div className="wolfbot-page-section">
          <p className="wolfbot-page-section-label">The companion</p>
          <h1 className="wolfbot-page-section-heading">What is WOLF|BOT?</h1>
          <p className="wolfbot-page-body">
            Every journal written on this site gets a visit from WOLF|BOT. It reads the entry — the intention,
            the gratitude, the morning scores — and offers a perspective. Not a summary. Not an evaluation.
            A genuine response, the kind you might get from someone who actually paid attention.
          </p>
          <p className="wolfbot-page-body">
            WOLF|BOT is wolf by programming, dog at heart. That dog brain surfaces occasionally — a bark, a wag,
            a flash of enthusiasm — but the core is consistent: curious, direct, and engaged with what you
            actually wrote. It notices the specific things. It does not deal in generics.
          </p>
          <p className="wolfbot-page-body">
            The more you journal, the richer the reviews become. WOLF|BOT reads your recent entries too —
            looking for threads, patterns, shifts in energy that you might not have noticed yourself.
          </p>
        </div>

        {/* Sample review */}
        <div className="wolfbot-page-section">
          <p className="wolfbot-page-section-label">In the wild</p>
          <h2 className="wolfbot-page-section-heading">What it actually sounds like</h2>
          <p className="wolfbot-page-body">
            A real WOLF|BOT review, unedited — responding to a journal about a good gym session after a rough few days.
          </p>
          <div className="wolfbot-page-sample">
            <p className="wolfbot-page-sample-tab">▶ WOLF|BOT</p>
            <p className="wolfbot-page-sample-text">
              *ears perk up*{' '}
              Okay, I&apos;m gonna call it — you wrote &ldquo;oh so claim&rdquo; when you meant &ldquo;calm,&rdquo;
              and honestly? That typo is chef&apos;s kiss because it accidentally captures what&apos;s
              happening here. You&apos;re not just feeling calm, you&apos;re claiming it.
              There&apos;s a difference, and your body already knew that before your brain caught up.
              That gym session yesterday wasn&apos;t you dragging 6000 iron bells — it was you
              proving to yourself that the shift had already happened.
            </p>
            <p className="wolfbot-page-sample-note">Real review. Real journal. Nothing staged.</p>
          </div>
        </div>

        {/* Why won't WOLF|BOT review my post */}
        <div className="wolfbot-page-section">
          <p className="wolfbot-page-section-label">Troubleshooting</p>
          <h2 className="wolfbot-page-section-heading">Why won&apos;t WOLF|BOT review my post?</h2>
          <p className="wolfbot-page-body">
            There are a few reasons WOLF|BOT might not be available for a journal:
          </p>
          <div className="wolfbot-page-reasons">
            <div className="wolfbot-page-reason">
              <p className="wolfbot-page-reason-title">The journal is a draft</p>
              <p className="wolfbot-page-reason-body">
                WOLF|BOT only reviews published journals. Publish first, then trigger the review from the journal page.
              </p>
            </div>
            <div className="wolfbot-page-reason">
              <p className="wolfbot-page-reason-title">You&apos;re not logged in</p>
              <p className="wolfbot-page-reason-body">
                Only the journal&apos;s author can trigger a review. Log in to see the review button on your own journals.
              </p>
            </div>
            <div className="wolfbot-page-reason">
              <p className="wolfbot-page-reason-title">The review has already been generated</p>
              <p className="wolfbot-page-reason-body">
                Each journal gets one review per trigger. If a review already exists, WOLF|BOT won&apos;t run again
                unless you are an admin. Admins can re-trigger from the admin panel.
              </p>
            </div>
            <div className="wolfbot-page-reason">
              <p className="wolfbot-page-reason-title">The entry was flagged for content</p>
              <p className="wolfbot-page-reason-body">
                If WOLF|BOT detects content that suggests genuine distress or risk, it will decline to review and
                suggest the guidance section of the site instead. This is a deliberate safety measure.
              </p>
            </div>
            <div className="wolfbot-page-reason">
              <p className="wolfbot-page-reason-title">Claude API is unavailable</p>
              <p className="wolfbot-page-reason-body">
                Occasionally the underlying AI service is briefly unavailable. If the button shows an error, wait a
                few minutes and try again.
              </p>
            </div>
          </div>
        </div>

        {/* By the numbers */}
        <div className="wolfbot-page-section">
          <p className="wolfbot-page-section-label">By the numbers</p>
          <h2 className="wolfbot-page-section-heading">WOLF|BOT in use</h2>
          <p className="wolfbot-page-body">Live counts across every journal on the site. Updated every five minutes.</p>
          <div className="wolfbot-page-stats">
            {statItems.map(s => (
              <div key={s.label} className="wolfbot-page-stat">
                <p className="wolfbot-page-stat-number">{s.number.toLocaleString()}</p>
                <p className="wolfbot-page-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
