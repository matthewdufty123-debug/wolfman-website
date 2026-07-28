'use client'

import { useState } from 'react'

interface Props {
  placeholder: string
  value: string
  error?: string | null
  onChange: (content: string) => void
  onSubmit: () => Promise<void>
  onCancel: () => void
}

export default function AddEntryForm({ placeholder, value, error, onChange, onSubmit, onCancel }: Props) {
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!value.trim()) return
    setSaving(true)
    try {
      await onSubmit()
    } finally {
      // Always clears, so a failed save leaves the form usable rather than
      // stuck on "Saving…" with the writing trapped inside it.
      setSaving(false)
    }
  }

  return (
    <div className="td-add-form">
      <textarea
        className="td-editor"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoFocus
      />
      {error && <p className="td-entry-error">{error}</p>}
      <div className="td-entry-actions">
        <button
          type="button"
          className="td-entry-save"
          onClick={handleSubmit}
          disabled={saving || !value.trim()}
        >
          {saving ? 'Saving…' : 'Add'}
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
