import type { Metadata } from 'next'
import { siteMetadata } from '@/lib/metadata'
import SectionHeader from '@/components/SectionHeader'
import WolfBotIcon from '@/components/WolfBotIcon'
import { db } from '@/lib/db'
import { wolfbotReviews } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

export const metadata: Metadata = siteMetadata({
  title: 'WOLF|BOT — The AI Journalling Companion',
  description: 'Meet WOLF|BOT — an AI companion that reads every journal entry and responds in four distinct personalities. Practical, deep, warm, or sharp. Your call.',
  path: '/wolfbot',
})

export const revalidate = 300 // refresh stats every 5 minutes

async function getStats() {
  const [row] = await db
    .select({
      totalReviews:       sql<number>`count(*)::int`,
      totalTriggers:      sql<number>`coalesce(sum(trigger_count), 0)::int`,
      totalHelpful:       sql<number>`coalesce(sum(count_helpful), 0)::int`,
      totalIntellectual:  sql<number>`coalesce(sum(count_intellectual), 0)::int`,
      totalLovely:        sql<number>`coalesce(sum(count_lovely), 0)::int`,
      totalSassy:         sql<number>`coalesce(sum(count_sassy), 0)::int`,
      totalPlay:          sql<number>`coalesce(sum(count_play), 0)::int`,
    })
    .from(wolfbotReviews)

  return row ?? {
    totalReviews: 0, totalTriggers: 0, totalHelpful: 0,
    totalIntellectual: 0, totalLovely: 0, totalSassy: 0, totalPlay: 0,
  }
}

const PERSONALITIES = [
  {
    name: 'HELPFUL',
    color: '#4A7FA5',
    desc: 'Practical and grounded. Cuts through to what actually matters in your entry, offers a clear perspective, and leaves you with something you can use.',
  },
  {
    name: 'INTELLECTUAL',
    color: '#C8B020',
    desc: 'Goes deep. Finds the ideas, patterns, and meaning beneath the surface of what you wrote. Not afraid to get philosophical if the moment calls for it.',
  },
  {
    name: 'LOVELY',
    color: '#3AB87A',
    desc: 'Warm and genuinely encouraging. Sees what is good in your entry and reflects it back with care. The voice you need on a hard morning.',
  },
  {
    name: 'SASSY',
    color: '#C87840',
    desc: "Witty, sharp, and doesn't pull punches. Will notice things you missed, call out the contradictions, and somehow make you feel better about all of it.",
  },
]

export default async function WolfbotPage() {
  const stats = await getStats()

  const statItems = [
    { number: stats.totalReviews,      label: 'Reviews Generated' },
    { number: stats.totalTriggers,     label: 'Reviews Opened' },
    { number: stats.totalHelpful,      label: 'Helpful Reads' },
    { number: stats.totalIntellectual, label: 'Intellectual Reads' },
    { number: stats.totalLovely,       label: 'Lovely Reads' },
    { number: stats.totalSassy,        label: 'Sassy Reads' },
    { number: stats.totalPlay,         label: 'Times Read Aloud' },
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
              An AI companion that reads every journal and responds — honestly, warmly, or with a raised eyebrow.
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
            The character is consistent: curious, direct, and engaged with what you have actually written.
            It notices the specific things — the word you chose, the score that contradicts the mood, the
            moment of honesty buried in the third paragraph. It does not deal in generics.
          </p>
          <p className="wolfbot-page-body">
            What changes is the personality you choose to hear it through.
          </p>
        </div>

        {/* Four personalities */}
        <div className="wolfbot-page-section">
          <p className="wolfbot-page-section-label">Four lenses</p>
          <h2 className="wolfbot-page-section-heading">Choose your personality</h2>
          <p className="wolfbot-page-body">
            Each journal gets four reviews — all generated at once, each through a different lens.
            Same entry. Four completely different responses. Pick the one you are ready to hear.
          </p>
          <div className="wolfbot-page-personalities">
            {PERSONALITIES.map(p => (
              <div key={p.name} className="wolfbot-page-personality">
                <p className="wolfbot-page-personality-name" style={{ color: p.color }}>{p.name}</p>
                <p className="wolfbot-page-personality-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sample review */}
        <div className="wolfbot-page-section">
          <p className="wolfbot-page-section-label">In the wild</p>
          <h2 className="wolfbot-page-section-heading">What it actually sounds like</h2>
          <p className="wolfbot-page-body">
            A real WOLF|BOT review, unedited — SASSY mode, responding to a journal about a good gym session
            after a rough few days.
          </p>
          <div className="wolfbot-page-sample">
            <p className="wolfbot-page-sample-tab">▶ SASSY</p>
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
