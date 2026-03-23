import type { Metadata } from 'next'
import { siteMetadata } from '@/lib/metadata'
import FeedbackPageClient from '@/components/FeedbackPageClient'

export const metadata: Metadata = siteMetadata({
  title: 'Beta Feedback',
  description: 'Share ideas, report bugs, or ask questions about the Wolfman beta.',
  path: '/feedback',
})

export default function FeedbackPage() {
  return <FeedbackPageClient />
}
