'use client'

interface SegmentedRingProps {
  value: number
  color: string
  size?: number
  revealed: boolean
}

export default function SegmentedRing({ value, color, size = 64, revealed }: SegmentedRingProps) {
  const cx = size / 2
  const cy = size / 2
  const r  = size / 2 - 5
  const SEGMENTS    = 8
  const GAP_DEG     = 4
  const ARC_DEG     = 360 / SEGMENTS - GAP_DEG
  const STAGGER_S   = 0.13

  const arcLength = (ARC_DEG / 360) * 2 * Math.PI * r

  function toXY(deg: number) {
    const rad = (deg - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function arcPath(i: number) {
    const startAngle = -(i * 45 + GAP_DEG / 2)
    const endAngle   = startAngle - ARC_DEG
    const s = toXY(startAngle)
    const e = toXY(endAngle)
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 0 0 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0 }}>
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const isFilled = i < value
          return (
            <path
              key={i}
              d={arcPath(i)}
              fill="none"
              stroke={color}
              strokeWidth={3.5}
              strokeOpacity={isFilled ? 1 : 0.15}
              strokeLinecap="round"
              strokeDasharray={isFilled ? arcLength : undefined}
              strokeDashoffset={isFilled ? (revealed ? 0 : arcLength) : undefined}
              style={isFilled ? {
                transition: revealed
                  ? `stroke-dashoffset 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${i * STAGGER_S}s`
                  : 'none',
              } : undefined}
            />
          )
        })}
      </svg>
      <span style={{
        fontFamily: 'var(--font-lora), Georgia, serif',
        fontSize: '1.5rem',
        fontWeight: 700,
        color,
        lineHeight: 1,
        position: 'relative',
      }}>
        {value}
      </span>
    </div>
  )
}
