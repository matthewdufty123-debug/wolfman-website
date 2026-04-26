'use client'

import { useState } from 'react'

interface Props {
  placeholder: string
  onSubmit: (content: string) => Promise<void>
  onCancel: () => void
}

export default function AddEntryForm({ placeholder, onSubmit, onCancel }: Props) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!content.trim()) return
    setSaving(true)
    await onSubmit(content)
    setSaving(false)
  }

  return (
    <div className="td-add-form">
      <textarea
        className="td-editor"
        placeholder={placeholder}
        value={content}
        onChange={e => setContent(e.target.value)}
        autoFocus
      />
      <div className="td-entry-actions">
        <button
          type="button"
          className="td-entry-save"
          onClick={handleSubmit}
          disabled={saving || !content.trim()}
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
