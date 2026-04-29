'use client'

import { useState } from 'react'
import type { ScaleEntry } from '@/lib/db/queries'
import ScaleEntryCard from './ScaleEntryCard'
import AddScaleEntryForm from './AddScaleEntryForm'

interface Props {
  type: string
  label: string
  icon: string
  labels: readonly string[]
  entries: ScaleEntry[]
  onAdd: (value: number, note?: string) => Promise<void>
  onUpdate: (entryId: string, value: number, note?: string) => Promise<void>
  onDelete: (entryId: string) => Promise<void>
}

export default function ScaleSection({ label, icon, labels, entries, onAdd, onUpdate, onDelete }: Props) {
  const [adding, setAdding] = useState(false)

  async function handleAdd(value: number, note?: string) {
    await onAdd(value, note)
    setAdding(false)
  }

  return (
    <section className="td-section">
      <div className="td-section-header">
        <h2 className="td-section-title">{icon} {label}</h2>
        <button
          type="button"
          className="td-section-add"
          onClick={() => setAdding(true)}
          aria-label={`Add ${label} reading`}
        >
          +
        </button>
      </div>

      {entries.length > 0 ? (
        <div className="td-entry-list">
          {entries.map(entry => (
            <ScaleEntryCard
              key={entry.id}
              entry={entry}
              labels={labels}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : !adding ? (
        <p className="td-section-empty">no readings yet</p>
      ) : null}

      {adding && (
        <AddScaleEntryForm
          labels={labels}
          onSubmit={handleAdd}
          onCancel={() => setAdding(false)}
        />
      )}
    </section>
  )
}
