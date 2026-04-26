'use client'

import { useState } from 'react'
import type { TodayEntry } from '@/lib/actions/today'
import EntryCard from './EntryCard'
import AddEntryForm from './AddEntryForm'

interface Props {
  type: string
  label: string
  placeholder: string
  entries: TodayEntry[]
  onAdd: (content: string) => Promise<void>
  onUpdate: (entryId: string, content: string) => Promise<void>
  onDelete: (entryId: string) => Promise<void>
}

export default function JournalSection({ type, label, placeholder, entries, onAdd, onUpdate, onDelete }: Props) {
  const [adding, setAdding] = useState(false)

  async function handleAdd(content: string) {
    await onAdd(content)
    setAdding(false)
  }

  return (
    <section className="td-section">
      <div className="td-section-header">
        <h2 className="td-section-title">{label}</h2>
        <button
          type="button"
          className="td-section-add"
          onClick={() => setAdding(true)}
          aria-label={`Add ${label}`}
        >
          +
        </button>
      </div>

      {entries.length > 0 ? (
        <div className="td-entry-list">
          {entries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : !adding ? (
        <p className="td-section-empty">no entries yet</p>
      ) : null}

      {adding && (
        <AddEntryForm
          placeholder={placeholder}
          onSubmit={handleAdd}
          onCancel={() => setAdding(false)}
        />
      )}
    </section>
  )
}
