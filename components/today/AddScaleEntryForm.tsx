'use client'

import { useState } from 'react'

interface Props {
  labels: readonly string[]
  onSubmit: (value: number, note?: string) => Promise<void>
  onCancel: () => void
}

export default function AddScaleEntryForm({ labels, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (value === null) return
    setSaving(true)
    await onSubmit(value, note.trim() || undefined)
    setSaving(false)
  }

  return (
    <div className="td-add-form">
      <div className="td-scale-pills">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
          <button
            key={n}
            type="button"
            className={`td-scale-pill${value === n ? ' td-scale-pill--selected' : ''}`}
            onClick={() => setValue(n)}
          >
            <span className="td-scale-pill-num">{n}</span>
            <span className="td-scale-pill-label">{labels[n - 1]}</span>
          </button>
        ))}
      </div>
      <input
        type="text"
        className="td-scale-note-input"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        maxLength={150}
      />
      <div className="td-entry-actions">
        <button
          type="button"
          className="td-entry-save"
          onClick={handleAdd}
          disabled={saving || value === null}
        >
          {saving ? 'Saving\u2026' : 'Add'}
        </button>
        <button
          type="button"
          className="td-entry-cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
