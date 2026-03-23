import type { Metadata } from 'next'
import { siteMetadata } from '@/lib/metadata'
import DevPageClient from '@/components/DevPageClient'

export const metadata: Metadata = siteMetadata({
  title: 'Development log',
  description: "An open log of how wolfman.blog is built and where it's going.",
  path: '/dev',
})

export default function DevPage() {
  return <DevPageClient />
}
