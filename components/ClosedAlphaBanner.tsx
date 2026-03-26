import Link from 'next/link'
import { auth } from '@/auth'
import { getSiteConfig } from '@/lib/site-config'

export default async function ClosedAlphaBanner() {
  const [config, session] = await Promise.all([getSiteConfig(), auth()])

  // Only render during closed alpha, and never for logged-in users
  if (config.status !== 'closed_alpha') return null
  if (session?.user?.id) return null

  return (
    <div className="closed-alpha-banner" role="note" aria-label="Site status">
      <p className="closed-alpha-banner-text">
        Closed Alpha &mdash; registrations open 1 May 2026.{' '}
        <Link href="/beta" className="closed-alpha-banner-link">
          Register your interest →
        </Link>
      </p>
    </div>
  )
}
