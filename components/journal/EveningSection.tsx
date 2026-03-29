'use client'

import { useState } from 'react'

// ── Sentiment scale ───────────────────────────────────────────────────────────

const FEEL_LABELS: Record<number, string> = {
  1: 'Want to Forget',
  2: 'Regret my Actions',
  3: 'It Was Okay',
  4: 'Went as Expected',
  5: 'Happy with my Achievements',
  6: 'Best Day Ever',
}

const FEEL_COLORS: Record<number, string> = {
  1: '#A82020',
  2: '#C87840',
  3: '#909090',
  4: '#4A7FA5',
  5: '#3AB87A',
  6: '#C8B020',
}

// ── Evening edit form (owner only) ───────────────────────────────────────────

interface EditFormProps {
  postId: string
  initialReflection: string | null
  initialFeel: number | null
  onSaved: (reflection: string, feel: number) => void
  onClose: () => void
}

function EveningEditForm({ postId, initialReflection, initialFeel, onSaved, onClose }: EditFormProps) {
  const [reflection, setReflection] = useState(initialReflection ?? '')
  const [feel, setFeel] = useState<number>(initialFeel ?? 4)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!reflection.trim()) { setError('Write something about your day first.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eveningReflection: reflection.trim(), feelAboutToday: feel }),
      })
      if (!res.ok) throw new Error('Save failed')
      onSaved(reflection.trim(), feel)
    } catch {
      setError('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="evening-edit-overlay" role="dialog" aria-modal="true" aria-label="Evening reflection">
      <div className="evening-edit-backdrop" onClick={onClose} />
      <div className="evening-edit-panel">
        <button className="evening-edit-close" onClick={onClose} aria-label="Close">✕</button>
        <h3 className="evening-edit-heading">Evening Reflection</h3>

        <label className="evening-edit-label">How did the day go?</label>
        <textarea
          className="evening-edit-textarea"
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder="Write freely about how it went..."
          rows={5}
          autoFocus
        />

        <label className="evening-edit-label" style={{ marginTop: '1.25rem' }}>
          How do you feel about today?
        </label>
        <div className="evening-feel-options">
          {([1, 2, 3, 4, 5, 6] as const).map(n => (
            <button
              key={n}
              type="button"
              className={`evening-feel-btn${feel === n ? ' is-selected' : ''}`}
              style={feel === n ? { borderColor: FEEL_COLORS[n], background: `${FEEL_COLORS[n]}18`, color: FEEL_COLORS[n] } : {}}
              onClick={() => setFeel(n)}
            >
              {FEEL_LABELS[n]}
            </button>
          ))}
        </div>

        {error && <p className="evening-edit-error">{error}</p>}

        <button
          className="evening-edit-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Reflection'}
        </button>
      </div>
    </div>
  )
}

// ── Main section ─────────────────────────────────────────────────────────────

interface Props {
  postId: string
  isOwner: boolean
  reflection: string | null
  feelAboutToday: number | null
}

export default function EveningSection({ postId, isOwner, reflection, feelAboutToday }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [localReflection, setLocalReflection] = useState(reflection)
  const [localFeel, setLocalFeel] = useState(feelAboutToday)

  const hasData = localReflection || localFeel != null

  return (
    <section id="evening-reflection" className="journal-section">
      <h2 className="journal-section-title">Evening Reflections</h2>

      {hasData ? (
        <div className="evening-content">
          {localFeel != null && (
            <div className="evening-feel-display">
              <span className="evening-feel-label">How I felt about today</span>
              <span
                className="evening-feel-value"
                style={{ color: FEEL_COLORS[localFeel] }}
              >
                {FEEL_LABELS[localFeel]}
              </span>
            </div>
          )}

          {localReflection && (
            <div className="evening-reflection-text">
              {localReflection.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {isOwner && (
            <button className="evening-edit-btn" onClick={() => setEditOpen(true)}>
              Edit reflection
            </button>
          )}
        </div>
      ) : isOwner ? (
        <div className="evening-empty-cta">
          <button className="evening-add-btn" onClick={() => setEditOpen(true)}>
            Add your evening reflection
          </button>
        </div>
      ) : (
        <p className="journal-section-empty">No evening reflection added yet.</p>
      )}

      {editOpen && isOwner && (
        <EveningEditForm
          postId={postId}
          initialReflection={localReflection}
          initialFeel={localFeel}
          onSaved={(r, f) => { setLocalReflection(r); setLocalFeel(f); setEditOpen(false) }}
          onClose={() => setEditOpen(false)}
        />
      )}
    </section>
  )
}
