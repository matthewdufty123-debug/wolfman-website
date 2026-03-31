import type { Metadata } from 'next'
import { siteMetadata } from '@/lib/metadata'
import SectionHeader from '@/components/SectionHeader'

export const metadata: Metadata = siteMetadata({
  title: 'Morning Scores',
  description: 'How Matthew tracks his inner state each morning — brain, body, happiness, and stress on a simple 1–6 scale.',
  path: '/scores',
})

export default function ScoresPage() {
  return (
    <main className="placeholder-page">
      <SectionHeader section="discover" current="/scores" />
      <div className="placeholder-content">
        <p className="placeholder-eyebrow">Coming Soon</p>
        <h1 className="placeholder-heading">Morning Scores</h1>
        <p className="placeholder-body">
          Before writing, Matthew scores himself on four dimensions: Brain Activity,
          Body Energy, Happiness, and Stress — each rated 1 to 6. No filtering,
          no vanity. Just an honest snapshot of how he arrived at the day.
        </p>
        <p className="placeholder-body">
          Over time these numbers become a data layer beneath the words — revealing
          patterns, honest correlations, and the kind of self-knowledge that only
          accumulates through repetition. This page will explore what the scores
          mean, how they're used, and what they reveal.
        </p>
      </div>
    </main>
  )
}
