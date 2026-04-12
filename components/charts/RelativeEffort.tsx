'use client'

interface RelativeEffortProps {
  value: number
  min: number
  max: number
  average: number | null
  color: string
  label?: string
}

export default function RelativeEffort({
  value,
  min,
  max,
  average,
  color,
  label,
}: RelativeEffortProps) {
  const range = max - min
  const valuePos = ((value - min) / range) * 100
  const avgPos = average !== null ? ((average - min) / range) * 100 : null

  return (
    <div className="chart-relative-effort">
      {label && (
        <div className="chart-re-header">
          <span className="chart-re-label">{label}</span>
          <span className="chart-re-value" style={{ color }}>{value}</span>
        </div>
      )}
      <div className="chart-re-track">
        <div
          className="chart-re-fill"
          style={{
            width: `${Math.min(valuePos, 100)}%`,
            backgroundColor: color,
          }}
        />
        {avgPos !== null && (
          <div
            className="chart-re-avg-marker"
            style={{ left: `${Math.min(avgPos, 100)}%` }}
            title={`Average: ${average!.toFixed(1)}`}
          />
        )}
      </div>
      <div className="chart-re-range">
        <span>{min}</span>
        {avgPos !== null && (
          <span style={{ position: 'absolute', left: `${avgPos}%`, transform: 'translateX(-50%)' }}>
            avg {average!.toFixed(1)}
          </span>
        )}
        <span>{max}</span>
      </div>
    </div>
  )
}
