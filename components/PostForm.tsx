'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTINE_ICON_MAP } from './RoutineIcons'

const RITUAL_KEYS = Object.keys(ROUTINE_ICON_MAP)

const BRAIN_LABELS = ['Peaceful', 'Quiet', 'Active', 'Busy', 'Racing', 'Manic']
const BODY_LABELS  = ['Lethargic', 'Slow', 'Steady', 'Energised', 'Strong', 'Buzzing']
const HAPPY_LABELS = ['Far from happy', 'Low', 'Okay', 'Good', 'Happy', 'Joyful']

type MorningState = {
  brainScale: number
  bodyScale: number
  happyScale: number
  routineChecklist: Record<string, boolean>
}

type PostFormData = {
  title: string
  date: string
  intention: string
  grateful: string
  greatAt: string
  morning: MorningState
}

interface PostFormProps {
  mode: 'create' | 'edit'
  postId?: string
  initialData?: Partial<PostFormData>
  onDelete?: () => void
  communityEnabled?: boolean
  defaultPublic?: boolean
  initialIsPublic?: boolean
  username?: string | null
}

function defaultChecklist(): Record<string, boolean> {
  return Object.fromEntries(RITUAL_KEYS.map(k => [k, false]))
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function buildContent(intention: string, grateful: string, greatAt: string): string {
  return `## Today's Intention\n\n${intention}\n\n## I'm Grateful For\n\n${grateful}\n\n## Something I'm Great At\n\n${greatAt}`
}

function ScaleSelector({ label, value, onChange, color, labels }: {
  label: string; value: number; onChange: (n: number) => void; color: string; labels: string[]
}) {
  return (
    <div className="pf-scale">
      <span className="pf-scale-label">{label}</span>
      <div className="pf-scale-pills">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <button
            key={n}
            type="button"
            className={`pf-scale-pill${value === n ? ' pf-scale-pill--active' : ''}`}
            style={value === n ? { background: color, borderColor: color } : {}}
            onClick={() => onChange(n)}
          >{n}</button>
        ))}
      </div>
      <p className="pf-scale-value" style={{ color }}>{labels[value - 1]}</p>
    </div>
  )
}

export default function PostForm({ mode, postId: initialPostId, initialData, onDelete, communityEnabled = false, defaultPublic = false, initialIsPublic, username }: PostFormProps) {
  const router = useRouter()
  const [postId, setPostId] = useState<string | null>(initialPostId ?? null)
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [date, setDate] = useState(initialData?.date ?? today())
  const [intention, setIntention] = useState(initialData?.intention ?? '')
  const [grateful, setGrateful] = useState(initialData?.grateful ?? '')
  const [greatAt, setGreatAt] = useState(initialData?.greatAt ?? '')
  const [morning, setMorning] = useState<MorningState>({
    brainScale: initialData?.morning?.brainScale ?? 3,
    bodyScale: initialData?.morning?.bodyScale ?? 3,
    happyScale: initialData?.morning?.happyScale ?? 3,
    routineChecklist: initialData?.morning?.routineChecklist ?? defaultChecklist(),
  })

  const [isPublic, setIsPublic] = useState<boolean>(initialIsPublic ?? defaultPublic)

  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [reviewed, setReviewed] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [error, setError] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [fullscreenKey, setFullscreenKey] = useState<'intention' | 'grateful' | 'greatAt' | null>(null)

  const lastSavedRef = useRef<PostFormData | null>(null)

  function markDirty() { setIsDirty(true); setSaveMsg('') }
  function markDirtyAndUnreview() { markDirty(); setReviewed(false) }

  const currentData = useCallback((): PostFormData => ({
    title, date, intention, grateful, greatAt, morning,
  }), [title, date, intention, grateful, greatAt, morning])

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = currentData()
      if (!isDirty || (!data.title && !data.intention)) return
      await saveDraft(data, false)
    }, 30_000)
    return () => clearInterval(interval)
  }, [isDirty, currentData])

  async function saveDraft(data: PostFormData, showFeedback = true) {
    const content = buildContent(data.intention, data.grateful, data.greatAt)
    try {
      let id = postId
      if (!id) {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: data.title || 'Untitled', date: data.date, content, status: 'draft', morning: data.morning }),
        })
        if (!res.ok) throw new Error('Save failed')
        const result = await res.json()
        id = result.id
        setPostId(id)
      } else {
        const res = await fetch(`/api/posts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: data.title || 'Untitled', date: data.date, content, status: 'draft', morning: data.morning }),
        })
        if (!res.ok) throw new Error('Save failed')
      }
      lastSavedRef.current = data
      setIsDirty(false)
      if (showFeedback) setSaveMsg('Saved.')
      return id
    } catch {
      if (showFeedback) setError('Could not save. Try again.')
      return null
    }
  }

  async function handleSaveDraft() {
    setSaving(true)
    setError('')
    await saveDraft(currentData(), true)
    setSaving(false)
  }

  async function handleReview() {
    const data = currentData()
    if (!data.title.trim()) { setError('Add a title first.'); return }
    if (!data.intention.trim()) { setError('Write your intention first.'); return }

    setReviewing(true)
    setError('')

    // Ensure post is saved first
    const id = await saveDraft(data, false)
    if (!id) { setError('Could not save before review. Try again.'); setReviewing(false); return }

    const content = buildContent(data.intention, data.grateful, data.greatAt)
    try {
      const res = await fetch(`/api/posts/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.title, content }),
      })
      if (!res.ok) throw new Error('Review failed')
      const result = await res.json()
      if (result.suggestedTitle) setTitle(result.suggestedTitle)
      setReviewed(true)
      setSaveMsg("Claude's reviewed your journal. Ready to publish.")
    } catch {
      setError('Review failed. Try again.')
    } finally {
      setReviewing(false)
    }
  }

  async function handlePublish() {
    const data = currentData()
    if (!data.title.trim()) { setError('Add a title first.'); return }
    if (!data.intention.trim()) { setError('Write your intention first.'); return }

    setPublishing(true)
    setError('')
    const content = buildContent(data.intention, data.grateful, data.greatAt)
    try {
      let slug: string
      if (!postId) {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: data.title, date: data.date, content, status: 'published', morning: data.morning, isPublic }),
        })
        if (!res.ok) throw new Error('Publish failed')
        const result = await res.json()
        slug = result.slug
      } else {
        const res = await fetch(`/api/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: data.title, date: data.date, content, status: 'published', morning: data.morning, isPublic }),
        })
        if (!res.ok) throw new Error('Publish failed')
        const result = await res.json()
        slug = result.slug
      }
      router.push(username ? `/${username}/${slug}` : `/posts/${slug}`)
    } catch {
      setError('Could not publish. Try again.')
    } finally {
      setPublishing(false)
    }
  }

  async function handleDelete() {
    if (!postId) return
    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (onDelete) onDelete()
      else router.push('/write')
    } catch {
      setError('Could not delete. Try again.')
    }
  }

  function toggleRitual(key: string) {
    markDirty()
    setMorning(m => ({ ...m, routineChecklist: { ...m.routineChecklist, [key]: !m.routineChecklist[key] } }))
  }

  const sections = [
    { key: 'intention' as const, label: "Today's Intention", placeholder: 'A story, observation or reflection that leads to a lesson or intention for the day…', value: intention, set: setIntention },
    { key: 'grateful'  as const, label: "I'm Grateful For",  placeholder: 'Something specific, vivid and personal. Never generic.',                          value: grateful,  set: setGrateful  },
    { key: 'greatAt'   as const, label: "Something I'm Great At", placeholder: 'A strength, owned with confidence and without apology.',                      value: greatAt,   set: setGreatAt   },
  ]

  return (
    <div className="pf-wrap">
      {/* Header */}
      <div className="pf-header">
        <button className="pf-back" onClick={() => router.back()} aria-label="Go back">←</button>
        <p className="pf-prompt">What&apos;s on your mind today?</p>
      </div>

      {/* Date */}
      <div className="pf-field">
        <label className="pf-label">Date</label>
        <input
          type="date"
          className="pf-input"
          value={date}
          onChange={e => { setDate(e.target.value); markDirty() }}
        />
      </div>

      {/* Title */}
      <div className="pf-field">
        <label className="pf-label">Title</label>
        <input
          type="text"
          className="pf-input pf-input--title"
          placeholder="Give this day a title…"
          value={title}
          onChange={e => { setTitle(e.target.value); markDirtyAndUnreview() }}
        />
      </div>

      {/* Content sections */}
      {sections.map(({ key, label, placeholder, value, set }) => (
        <div key={key} className="pf-field">
          <label className="pf-label">{label}</label>
          <div className="pf-textarea-wrap">
            <textarea
              className="pf-textarea"
              placeholder={placeholder}
              value={value}
              rows={9}
              onChange={e => { set(e.target.value); markDirtyAndUnreview() }}
            />
            <button
              type="button"
              className="pf-expand-btn"
              aria-label={`Expand ${label}`}
              onClick={() => setFullscreenKey(key)}
            >⤢</button>
          </div>
        </div>
      ))}

      {/* Morning state */}
      <div className="pf-section">
        <p className="pf-section-title">Morning State</p>

        <ScaleSelector
          label="Brain Activity"
          value={morning.brainScale}
          color="#4A7FA5"
          labels={BRAIN_LABELS}
          onChange={n => { setMorning(m => ({ ...m, brainScale: n })); markDirty() }}
        />
        <ScaleSelector
          label="Body Energy"
          value={morning.bodyScale}
          color="#A0622A"
          labels={BODY_LABELS}
          onChange={n => { setMorning(m => ({ ...m, bodyScale: n })); markDirty() }}
        />
        <ScaleSelector
          label="Happy Scale"
          value={morning.happyScale}
          color="#3AB87A"
          labels={HAPPY_LABELS}
          onChange={n => { setMorning(m => ({ ...m, happyScale: n })); markDirty() }}
        />

        {/* Rituals */}
        <div className="pf-rituals">
          {RITUAL_KEYS.map(key => {
            const { label, Icon, color } = ROUTINE_ICON_MAP[key]
            const done = morning.routineChecklist[key]
            return (
              <button
                key={key}
                type="button"
                className={`pf-ritual-btn${done ? ' pf-ritual-btn--done' : ''}`}
                style={done ? { borderColor: color, background: `${color}22` } : {}}
                onClick={() => toggleRitual(key)}
                title={label}
              >
                <Icon size={18} color={done ? color : undefined} />
                <span className="pf-ritual-label">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Visibility toggle — only shown when community is enabled */}
      {communityEnabled && (
        <div className="pf-visibility">
          <button
            type="button"
            className={`pf-visibility-btn${isPublic ? ' is-public' : ' is-private'}`}
            onClick={() => setIsPublic(p => !p)}
          >
            {isPublic ? '🌍 Public' : '🔒 Private'}
          </button>
          <span className="pf-visibility-hint">
            {isPublic ? 'This journal will appear in the community feed.' : 'Only you can see this journal.'}
          </span>
        </div>
      )}

      {/* Error / save messages */}
      {error && <p className="pf-error">{error}</p>}
      {saveMsg && <p className="pf-save-msg">{saveMsg}</p>}

      {/* Actions */}
      <div className="pf-actions">
        <button
          className="pf-btn pf-btn--draft"
          onClick={handleSaveDraft}
          disabled={saving || reviewing || publishing}
        >
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        {!reviewed ? (
          <button
            className="pf-btn pf-btn--review"
            onClick={handleReview}
            disabled={saving || reviewing || publishing}
          >
            {reviewing ? 'Reviewing…' : 'Review'}
          </button>
        ) : (
          <button
            className="pf-btn pf-btn--publish"
            onClick={handlePublish}
            disabled={saving || reviewing || publishing}
          >
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        )}
      </div>

      {/* Delete (edit mode only) */}
      {mode === 'edit' && postId && (
        <div className="pf-delete-wrap">
          {!showDelete ? (
            <button className="pf-delete-trigger" onClick={() => setShowDelete(true)}>
              Delete this journal
            </button>
          ) : (
            <div className="pf-delete-confirm">
              <span>Are you sure?</span>
              <button className="pf-delete-yes" onClick={handleDelete}>Yes, delete</button>
              <button className="pf-delete-no" onClick={() => setShowDelete(false)}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen overlay */}
      {fullscreenKey && (() => {
        const map = {
          intention: { label: "Today's Intention", value: intention, set: setIntention },
          grateful:  { label: "I'm Grateful For",  value: grateful,  set: setGrateful  },
          greatAt:   { label: "Something I'm Great At", value: greatAt, set: setGreatAt },
        }
        const { label, value, set } = map[fullscreenKey]
        return (
          <div className="pf-fullscreen">
            <div className="pf-fullscreen-header">
              <span className="pf-fullscreen-label">{label}</span>
              <button
                type="button"
                className="pf-fullscreen-done"
                onClick={() => setFullscreenKey(null)}
              >Done</button>
            </div>
            <textarea
              className="pf-fullscreen-textarea"
              value={value}
              autoFocus
              onChange={e => { set(e.target.value); markDirtyAndUnreview() }}
            />
          </div>
        )
      })()}
    </div>
  )
}
