import type { Metadata } from 'next'
import { siteMetadata } from '@/lib/metadata'

export const metadata: Metadata = siteMetadata({
  title: 'About',
  description: 'Matthew Wolfman — data engineer, mountain biker, photographer, wood carver, and mindful human being based in the UK.',
  path: '/about',
})

export default function AboutPage() {
  return (
    <main className="home">
      <h1 className="greeting">Discover Wolfman</h1>
    </main>
  )
}
