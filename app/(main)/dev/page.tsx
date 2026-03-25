import type { Metadata } from 'next'
import { siteMetadata } from '@/lib/metadata'
import DevPageClient from '@/components/DevPageClient'

export const metadata: Metadata = siteMetadata({
  title: 'Development log',
  description: 'Live technical development log — GitHub issues, milestones, open branches, and how wolfman.blog is built.',
  path: '/dev',
})

export default function DevPage() {
  return <DevPageClient />
}
