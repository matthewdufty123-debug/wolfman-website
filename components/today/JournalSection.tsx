'use client'

import type { TodayEntry } from '@/lib/actions/today'
import EntryCard from './EntryCard'
import AddEntryForm from './AddEntryForm'

interface Props {
  type: string
  label: string
  placeholder: string
  entries: TodayEntry[]
  // Draft content lives in TodayHub so Publish can commit whatever is still
  // sitting in an open editor. null means the editor is closed.
  draft: string | null
  draftError: string | null
  onOpenDraft: () => void
  onDraftChange: (content: string) => void
  onCommitDraft: () => Promise<void>
  onCancelDraft: () => void
  onUpdate: (entryId: string, content: string) => Promise<boolean>
  onDelete: (entryId: string) => Promise<boolean>
}

export default function JournalSection({
  label,
  placeholder,
  entries,
  draft,
  draftError,
  onOpenDraft,
  onDraftChange,
  onCommitDraft,
  onCancelDraft,
  onUpdate,
  onDelete,
}: Props) {
  const adding = draft !== null

  return (
    <section className="td-section">
      <div className="td-section-header">
        <h2 className="td-section-title">{label}</h2>
        <button
          type="button"
          className="td-section-add"
          onClick={onOpenDraft}
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
          value={draft}
          error={draftError}
          onChange={onDraftChange}
          onSubmit={onCommitDraft}
          onCancel={onCancelDraft}
        />
      )}
    </section>
  )
}
