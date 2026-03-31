import type { Metadata } from 'next'
import { siteMetadata } from '@/lib/metadata'
import SectionHeader from '@/components/SectionHeader'

export const metadata: Metadata = siteMetadata({
  title: 'The Journalling Practice',
  description: 'How and why Matthew journals every morning — the structure, the intention, and what it builds over time.',
  path: '/journaling',
})

export default function JournalingPage() {
  return (
    <main className="placeholder-page">
      <SectionHeader section="discover" current="/journaling" />
      <div className="placeholder-content">
        <p className="placeholder-eyebrow">Coming Soon</p>
        <h1 className="placeholder-heading">The Journalling Practice</h1>
        <p className="placeholder-body">
          Every morning, Matthew sits down and writes. Not to perform, not to be clever —
          to be honest about what matters, what he's grateful for, and what he's capable of.
          The practice is simple. The effect, over time, is not.
        </p>
        <p className="placeholder-body">
          This page will explore the structure behind each journal entry, the intention behind
          the three sections, and what daily writing builds in a person who keeps at it.
          In the meantime, start with any journal entry — the practice speaks for itself.
        </p>
      </div>
    </main>
  )
}
