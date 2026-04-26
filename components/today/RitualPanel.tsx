'use client'

import RitualIcon from '@/components/RitualIcon'
import type { RitualDef } from '@/app/(post)/today/TodayHub'

interface Props {
  rituals: RitualDef[]
  checklist: Record<string, boolean>
  onToggle: (key: string) => void
}

export default function RitualPanel({ rituals, checklist, onToggle }: Props) {
  const completedCount = Object.values(checklist).filter(Boolean).length

  // Group by category
  const categories = new Map<string, RitualDef[]>()
  for (const r of rituals) {
    if (!categories.has(r.category)) categories.set(r.category, [])
    categories.get(r.category)!.push(r)
  }

  return (
    <div className="td-ritual-panel">
      <div className="td-panel-header">
        <h2 className="td-panel-title">Rituals</h2>
        {completedCount > 0 && (
          <span className="td-ritual-count">{completedCount}</span>
        )}
      </div>
      <div className="td-ritual-grid">
        {rituals.map(r => (
          <button
            key={r.key}
            type="button"
            className={`td-ritual-item${checklist[r.key] ? ' td-ritual-item--done' : ''}`}
            onClick={() => onToggle(r.key)}
            title={r.label}
          >
            <RitualIcon svgContent={r.svgContent} color={r.color} size={28} label={r.label} />
            <span className="td-ritual-label">{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
