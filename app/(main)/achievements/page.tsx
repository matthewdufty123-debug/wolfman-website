import type { Metadata } from 'next'
import { siteMetadata } from '@/lib/metadata'
import SectionHeader from '@/components/SectionHeader'

export const metadata: Metadata = siteMetadata({
  title: 'Achievements',
  description: 'Achievements — consistency recognised. Ten journals. Thirty days straight. The habit built.',
  path: '/achievements',
})

export default function AchievementsPage() {
  return (
    <main className="placeholder-page">
      <SectionHeader section="discover" current="/achievements" />
      <div className="placeholder-content">
        <p className="placeholder-eyebrow">Coming Soon</p>
        <h1 className="placeholder-heading">Achievements</h1>
        <p className="placeholder-body">
          Achievements are earned, not given. Ten journals logged. Thirty days
          straight. A ritual practised one hundred times. These are the milestones
          that mark a habit becoming part of who you are.
        </p>
        <p className="placeholder-body">
          General achievements are available to all users. Premium subscribers
          unlock ritual-specific achievements — deeper recognition for the
          practices you show up for most.
        </p>
        <p className="placeholder-body">
          This page is being built as part of Release 0.6.
        </p>
      </div>
    </main>
  )
}
