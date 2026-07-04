'use client'

interface Props {
  label: string
  icon: string
  labels: readonly string[]
  value: number | null
  onSelect: (value: number) => Promise<void>
  onClear: () => Promise<void>
}

/** One snapshot per day (#288): a single 1–8 selector per scale. Tapping the
 * selected value again clears it. */
export default function ScaleSection({ label, icon, labels, value, onSelect, onClear }: Props) {
  return (
    <section className="td-section">
      <div className="td-section-header">
        <h2 className="td-section-title">{icon} {label}</h2>
        {value !== null && (
          <span className="td-scale-current">{value}/8 — {labels[value - 1]}</span>
        )}
      </div>

      <div className="td-scale-pills td-scale-select">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
          <button
            key={n}
            type="button"
            className={`td-scale-pill${value === n ? ' td-scale-pill--selected' : ''}`}
            onClick={() => (value === n ? onClear() : onSelect(n))}
            aria-pressed={value === n}
          >
            <span className="td-scale-pill-num">{n}</span>
            <span className="td-scale-pill-label">{labels[n - 1]}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
