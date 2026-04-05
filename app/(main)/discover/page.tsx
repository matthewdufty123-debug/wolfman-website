import SectionHeader from '@/components/SectionHeader'
import Link from 'next/link'

const CARDS = [
  {
    href: '/about',
    title: 'About Wolfman',
    body: "Matthew's story — data engineer, mountain biker, photographer, wood carver, and the human behind this site. Who he is, how he lives, and why the morning journalling practice matters.",
  },
  {
    href: '/journaling',
    title: 'The Journalling Practice',
    body: 'How and why Matthew journals every morning — the three-part structure and the intention behind each section. Every journal on this site follows the same format.',
  },
  {
    href: '/scores',
    title: 'Morning Scores',
    body: 'Four scales recorded each morning — Brain, Body, Happiness, and Stress State, rated 1 to 8. Over time they reveal honest patterns about how inner state shapes intention.',
  },
  {
    href: '/wolfbot',
    title: 'WOLF|BOT',
    body: 'The AI journalling companion built into every journal on this site. It reads your entry — the intention, the scores, the rituals — and gives you something you could not have seen yourself.',
  },
  {
    href: '/rituals',
    title: 'Morning Rituals',
    body: 'The daily practices Matthew completes before sitting down to write — sunlight, breathwork, movement, and stillness. Browse journals by ritual and see which ones appear in the moments that matter.',
  },
  {
    href: '/achievements',
    title: 'Achievements',
    body: 'Earned milestones that mark progress in the journalling practice — streaks held, rituals built, consistency rewarded. Achievements are earned, not given.',
  },
  {
    href: '/features',
    title: 'Features & Roadmap',
    body: 'A plain-English overview of everything built, in development, and planned across each release. A clear picture of where the product is heading.',
  },
  {
    href: '/investment',
    title: 'Investment Case',
    body: 'The business model and financial thinking behind Wolfman — for those interested in the commercial side of what is being built here.',
  },
]

export default function DiscoverPage() {
  return (
    <>
      <SectionHeader section="discover" current="/discover" />
      <div className="discover-hub">
        <p className="discover-hub-intro">
          Everything you need to understand what Wolfman is, how it works, and where it is going.
        </p>
        <div className="discover-cards">
          {CARDS.map(card => (
            <div key={card.href} className="discover-card">
              <p className="discover-card-title">{card.title}</p>
              <p className="discover-card-body">{card.body}</p>
              <Link href={card.href} className="discover-card-link">→ Read more</Link>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
