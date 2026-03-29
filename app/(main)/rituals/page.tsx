import type { Metadata } from 'next'
import { siteMetadata } from '@/lib/metadata'
import SectionHeader from '@/components/SectionHeader'

export const metadata: Metadata = siteMetadata({
  title: 'Rituals',
  description: 'Morning rituals — the small acts that shape how the day begins.',
  path: '/rituals',
})

export default function RitualsPage() {
  return (
    <main className="placeholder-page">
      <SectionHeader section="discover" current="/rituals" />
      <div className="placeholder-content">
        <p className="placeholder-eyebrow">Coming Soon</p>
        <h1 className="placeholder-heading">Rituals</h1>
        <p className="placeholder-body">
          The morning rituals that shape how the day begins — sunlight, breathwork,
          movement, stillness. Browse journals by ritual, explore what others
          practice, and find the ones that belong in your morning.
        </p>
        <p className="placeholder-body">
          This page is being built. In the meantime, you can explore rituals
          from individual journal entries.
        </p>
      </div>
    </main>
  )
}
