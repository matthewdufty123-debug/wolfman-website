'use client'

import { useState } from 'react'
import type { ScaleEntry } from '@/lib/db/queries'

interface Props {
  entry: ScaleEntry
  labels: readonly string[]
  onUpdate: (entryId: string, value: number, note?: string) => Promise<void>
  onDelete: (entryId: string) => Promise<void>
}

function formatTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function ScaleEntryCard({ entry, labels, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(entry.value)
  const [editNote, setEditNote] = useState(entry.note ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onUpdate(entry.id, editValue, editNote.trim() || undefined)
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    await onDelete(entry.id)
  }

  if (editing) {
    return (
      <div className="td-entry td-entry--editing">
        <div className="td-scale-pills">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <button
              key={n}
              type="button"
              className={`td-scale-pill${editValue === n ? ' td-scale-pill--selected' : ''}`}
              onClick={() => setEditValue(n)}
            >
              <span className="td-scale-pill-num">{n}</span>
              <span className="td-scale-pill-label">{labels[n - 1]}</span>
            </button>
          ))}
        </div>
        <input
          type="text"
          className="td-scale-note-input"
          value={editNote}
          onChange={e => setEditNote(e.target.value)}
          placeholder="Add a note (optional)"
          maxLength={150}
        />
        <div className="td-entry-actions">
          <button
            type="button"
            className="td-entry-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving\u2026' : 'Save'}
          </button>
          <button
            type="button"
            className="td-entry-cancel"
            onClick={() => { setEditing(false); setEditValue(entry.value); setEditNote(entry.note ?? '') }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="td-entry">
      <div className="td-entry-text" onClick={() => setEditing(true)}>
        <span className="td-scale-entry-value">
          <span className="td-scale-entry-num">{entry.value}</span>
          {labels[entry.value - 1]}
        </span>
        {entry.note && (
          <span className="td-scale-entry-note">{entry.note}</span>
        )}
      </div>
      <div className="td-entry-footer">
        <span className="td-entry-meta">
          {formatTime(entry.createdAt)}
          {entry.source === 'telegram' && (
            <span className="td-entry-source">via Telegram</span>
          )}
        </span>
        {!confirmDelete ? (
          <button
            type="button"
            className="td-entry-delete-btn"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete entry"
          >
            ×
          </button>
        ) : (
          <span className="td-entry-confirm">
            <button type="button" className="td-entry-confirm-yes" onClick={handleDelete}>Delete</button>
            <button type="button" className="td-entry-confirm-no" onClick={() => setConfirmDelete(false)}>Keep</button>
          </span>
        )}
      </div>
    </div>
  )
}
