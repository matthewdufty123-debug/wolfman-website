'use client'

interface Zone {
  label: string
  count: number
  percentage: number
}

interface ZoneDistributionProps {
  zones: Zone[]
  color: string
  showPercentage?: boolean
  /** Sort zones by percentage descending instead of keeping original order */
  sortByValue?: boolean
}

export default function ZoneDistribution({
  zones,
  color,
  showPercentage = true,
  sortByValue = false,
}: ZoneDistributionProps) {
  const sorted = sortByValue
    ? [...zones].sort((a, b) => b.percentage - a.percentage)
    : zones

  return (
    <div className="chart-zone-dist">
      {sorted.map((zone, i) => (
        <div key={i} className="chart-zone-row">
          <span className="chart-zone-label">{zone.label}</span>
          <div className="chart-zone-track">
            <div
              className="chart-zone-fill"
              style={{
                width: `${Math.max(zone.percentage, 0)}%`,
                backgroundColor: color,
              }}
            />
          </div>
          {showPercentage && (
            <span className="chart-zone-pct">{Math.round(zone.percentage)}%</span>
          )}
        </div>
      ))}
    </div>
  )
}
