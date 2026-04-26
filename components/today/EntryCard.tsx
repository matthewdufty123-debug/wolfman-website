'use client'

import { useState } from 'react'
import type { TodayEntry } from '@/lib/actions/today'

interface Props {
  entry: TodayEntry
  onUpdate: (entryId: string, content: string) => Promise<void>
  onDelete: (entryId: string) => Promise<void>
}

function formatTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function EntryCard({ entry, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(entry.content)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const wasEdited = entry.updatedAt && entry.createdAt &&
    new Date(entry.updatedAt).getTime() - new Date(entry.createdAt).getTime() > 1000

  async function handleSave() {
    if (!editContent.trim()) return
    setSaving(true)
    await onUpdate(entry.id, editContent)
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    await onDelete(entry.id)
  }

  if (editing) {
    return (
      <div className="td-entry td-entry--editing">
        <textarea
          className="td-editor"
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          autoFocus
        />
        <div className="td-entry-actions">
          <button
            type="button"
            className="td-entry-save"
            onClick={handleSave}
            disabled={saving || !editContent.trim()}
          >
            {saving ? 'Saving\u2026' : 'Save'}
          </button>
          <button
            type="button"
            className="td-entry-cancel"
            onClick={() => { setEditing(false); setEditContent(entry.content) }}
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
        {entry.content}
      </div>
      <div className="td-entry-footer">
        <span className="td-entry-meta">
          {formatTime(entry.createdAt)}
          {entry.source === 'telegram' && (
            <span className="td-entry-source">via Telegram</span>
          )}
          {wasEdited && <span className="td-entry-edited">edited</span>}
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
