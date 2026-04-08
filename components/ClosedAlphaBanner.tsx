'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function ClosedAlphaBanner({ status }: { status: string }) {
  const { data: session } = useSession()

  if (status !== 'closed_alpha') return null
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
