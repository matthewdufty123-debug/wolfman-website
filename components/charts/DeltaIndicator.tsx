'use client'

import { COPPER } from './chartUtils'

interface DeltaIndicatorProps {
  todayValue: number
  avg: number | null
  previousCount: number
  revealed: boolean
}

export default function DeltaIndicator({ todayValue, avg, previousCount, revealed }: DeltaIndicatorProps) {
  if (avg === null) return null

  const diff = todayValue - avg
  const isUp = diff > 0
  const isEqual = Math.abs(diff) < 0.05
  const displayDiff = Math.abs(diff).toFixed(1)

  return (
    <div
      className="hss-delta"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.5s ease 0.8s, transform 0.5s ease 0.8s',
      }}
    >
      {!isEqual && (
        <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true" className="hss-delta-arrow">
          {isUp ? (
            <polygon points="8,0 16,12 0,12" fill={COPPER} />
          ) : (
            <polygon points="0,0 16,0 8,12" fill={COPPER} />
          )}
        </svg>
      )}
      <span className="hss-delta-value" style={{ color: COPPER }}>
        {isEqual ? '=' : `${isUp ? '+' : '-'} ${displayDiff}`}
      </span>
      <span className="hss-delta-label">Points</span>
      <span className="hss-delta-sub">
        Compared to <span className="hss-delta-underline">{previousCount} journal</span> average
      </span>
    </div>
  )
}
