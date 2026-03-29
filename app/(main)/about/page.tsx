import type { Metadata } from 'next'
import { siteMetadata } from '@/lib/metadata'
import SectionHeader from '@/components/SectionHeader'

export const metadata: Metadata = siteMetadata({
  title: 'About',
  description: 'Matthew Wolfman — data engineer, mountain biker, photographer, wood carver, and mindful human being based in the UK.',
  path: '/about',
})

export default function AboutPage() {
  return (
    <main className="placeholder-page">
      <SectionHeader section="discover" current="/about" />
      <div className="placeholder-content">
        <p className="placeholder-eyebrow">Coming Soon</p>
        <h1 className="placeholder-heading">About Wolfman</h1>
        <p className="placeholder-body">
          Wolfman is a mindful living brand built on outward truth and inner honesty.
          Through mindfulness, self-exploration, and gratitude, it shows that life&apos;s
          smallest moments can become its greatest joys. Purpose is found in the doing.
          Joy is meant to be shared.
        </p>
        <p className="placeholder-body">
          Behind the brand is Matthew Wolfman — a data engineer, mountain biker,
          photographer, wood carver, and mindful human being based in the UK.
          Everything on this site is authentic, personal, and real.
        </p>
        <p className="placeholder-body">
          A fuller About page is being written as part of the Closed Alpha. It will
          tell Matthew&apos;s story honestly — who he is, how he lives, and what
          Wolfman actually means.
        </p>
      </div>
    </main>
  )
}
