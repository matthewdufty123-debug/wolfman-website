'use client'

import { useState, useEffect } from 'react'

const BETA_END = new Date('2026-08-31T23:59:59Z')

function getDaysRemaining(): number {
  const now = new Date()
  const diff = BETA_END.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function BetaCountdown({ className }: { className?: string }) {
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    setDays(getDaysRemaining())
  }, [])

  if (days === null) return null

  return (
    <span className={className}>
      {days === 0 ? 'Beta closes today' : `${days} day${days === 1 ? '' : 's'} remaining in beta`}
    </span>
  )
}
