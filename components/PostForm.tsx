'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Maximize2 } from 'lucide-react'
import { ROUTINE_ICON_MAP } from './RoutineIcons'
import PhotoCropUpload from './PhotoCropUpload'
import WolfBotLoadingOverlay from './WolfBotLoadingOverlay'

const RITUAL_KEYS = Object.keys(ROUTINE_ICON_MAP)

const BRAIN_LABELS  = ['Peaceful', 'Quiet', 'Active', 'Busy', 'Racing', 'Manic']
const BODY_LABELS   = ['Lethargic', 'Slow', 'Steady', 'Energised', 'Strong', 'Buzzing']
const HAPPY_LABELS  = ['Far from happy', 'Low', 'Okay', 'Good', 'Happy', 'Joyful']
const STRESS_LABELS = ['Calm', 'Relaxed', 'Mild', 'Tense', 'Stressed', 'Overwhelmed']

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

type MorningState = {
  brainScale: number | null
  bodyScale: number | null
  happyScale: number | null
  stressScale: number | null
  routineChecklist: Record<string, boolean>
}

type PostFormData = {
  title: string
  date: string
  intention: string
  grateful: string
  greatAt: string
  morning: MorningState
  image: string | null
  videoId: string | null
  eveningReflection: string
  feelAboutToday: number | null
}

interface PostFormProps {
  mode: 'create' | 'edit'
  postId?: string
  initialData?: Partial<PostFormData>
  initialTitleSuggestionsUsed?: number
  onDelete?: () => void
  communityEnabled?: boolean
  defaultPublic?: boolean
  initialIsPublic?: boolean
  username?: string | null
  wolfbotReviewExists?: boolean
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

function defaultJournalTitle(): string {
  const now = new Date()
  const day = now.getDate()
  const ordinal =
    [1, 21, 31].includes(day) ? 'st' :
    [2, 22].includes(day) ? 'nd' :
    [3, 23].includes(day) ? 'rd' : 'th'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const year = String(now.getFullYear()).slice(2)
  return `Today's Intentional Journal — ${day}${ordinal} ${months[now.getMonth()]} '${year}`
}

function extractYouTubeId(url: string): string | null {
  const s = url.trim()
  if (!s) return null
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  const short = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (short) return short[1]
  const watch = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (watch) return watch[1]
  const embed = s.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embed) return embed[1]
  return null
}

function ScaleSelector({ label, value, onChange, color, labels }: {
  label: string; value: number | null; onChange: (n: number) => void; color: string; labels: string[]
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
      <p className="pf-scale-value" style={{ color }}>{value !== null ? labels[value - 1] : ''}</p>
    </div>
  )
}

export default function PostForm({
  mode,
  postId: initialPostId,
  initialData,
  initialTitleSuggestionsUsed = 0,
  onDelete,
  communityEnabled = false,
  defaultPublic = false,
  initialIsPublic,
  username,
  wolfbotReviewExists = false,
}: PostFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'after-waking' | 'before-bed'>('after-waking')
  const [postId, setPostId] = useState<string | null>(initialPostId ?? null)
  const [title, setTitle] = useState(
    initialData?.title ?? (mode === 'create' ? defaultJournalTitle() : '')
  )
  const [date, setDate] = useState(initialData?.date ?? today())
  const [intention, setIntention] = useState(initialData?.intention ?? '')
  const [grateful, setGrateful] = useState(initialData?.grateful ?? '')
  const [greatAt, setGreatAt] = useState(initialData?.greatAt ?? '')
  const [morning, setMorning] = useState<MorningState>({
    brainScale:  initialData?.morning?.brainScale  ?? null,
    bodyScale:   initialData?.morning?.bodyScale   ?? null,
    happyScale:  initialData?.morning?.happyScale  ?? null,
    stressScale: initialData?.morning?.stressScale ?? null,
    routineChecklist: initialData?.morning?.routineChecklist ?? defaultChecklist(),
  })
  const [image, setImage] = useState<string | null>(initialData?.image ?? null)
  const [showCropUpload, setShowCropUpload] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState(
    initialData?.videoId ? `https://youtu.be/${initialData.videoId}` : ''
  )
  const [eveningReflection, setEveningReflection] = useState(initialData?.eveningReflection ?? '')
  const [feelAboutToday, setFeelAboutToday] = useState<number | null>(initialData?.feelAboutToday ?? null)
  const [isPublic, setIsPublic] = useState<boolean>(initialIsPublic ?? defaultPublic)

  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestionsLeft, setSuggestionsLeft] = useState(Math.max(0, 2 - initialTitleSuggestionsUsed))
  const [saveMsg, setSaveMsg] = useState('')
  const [error, setError] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [fullscreenKey, setFullscreenKey] = useState<'intention' | 'grateful' | 'greatAt' | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'none' | 'loading' | 'done' | 'error'>(
    wolfbotReviewExists ? 'done' : 'none'
  )

  const lastSavedRef = useRef<PostFormData | null>(null)

  function markDirty() { setIsDirty(true); setSaveMsg('') }

  const currentData = useCallback((): PostFormData => ({
    title, date, intention, grateful, greatAt, morning, image,
    videoId: extractYouTubeId(youtubeUrl),
    eveningReflection, feelAboutToday,
  }), [title, date, intention, grateful, greatAt, morning, image, youtubeUrl, eveningReflection, feelAboutToday])

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
    const payload = {
      title: data.title || 'Untitled',
      date: data.date,
      content,
      status: 'draft',
      morning: data.morning,
      image: data.image,
      videoId: data.videoId,
      eveningReflection: data.eveningReflection || null,
      feelAboutToday: data.feelAboutToday,
    }
    try {
      let id = postId
      if (!id) {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Save failed')
        const result = await res.json()
        id = result.id
        setPostId(id)
      } else {
        const res = await fetch(`/api/posts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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

  async function handleSuggestTitle() {
    if (!postId) {
      setError('Save a draft first before requesting a title suggestion.')
      return
    }
    setSuggesting(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${postId}/suggest-title`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) {
        if (d.error === 'limit_reached') { setSuggestionsLeft(0); return }
        throw new Error('Failed')
      }
      setTitle(d.title)
      setSuggestionsLeft(d.suggestionsLeft)
    } catch {
      setError('Could not suggest title. Try again.')
    } finally {
      setSuggesting(false)
    }
  }

  async function handleWolfBotTrigger() {
    if (!postId) return
    setReviewStatus('loading')
    try {
      const res = await fetch(`/api/posts/${postId}/wolfbot-reviews`, { method: 'POST' })
      if (res.ok || res.status === 409) {
        setReviewStatus('done')
      } else {
        setReviewStatus('error')
      }
    } catch {
      setReviewStatus('error')
    }
  }

  async function handlePublish() {
    const data = currentData()
    if (!data.title.trim()) { setError('Add a title first.'); return }
    if (!data.intention.trim()) { setError('Write your intention first.'); return }
    setPublishing(true)
    setError('')
    const content = buildContent(data.intention, data.grateful, data.greatAt)
    const payload = {
      title: data.title,
      date: data.date,
      content,
      status: 'published',
      morning: data.morning,
      isPublic,
      image: data.image,
      videoId: data.videoId,
      eveningReflection: data.eveningReflection || null,
      feelAboutToday: data.feelAboutToday,
    }
    try {
      let slug: string
      if (!postId) {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Publish failed')
        const result = await res.json()
        slug = result.slug
      } else {
        const res = await fetch(`/api/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
    { key: 'intention' as const, label: "Today's Intention",    placeholder: 'A story, observation or reflection that leads to a lesson or intention for the day…', value: intention, set: setIntention },
    { key: 'grateful'  as const, label: "I'm Grateful For",     placeholder: 'Something specific, vivid and personal. Never generic.',                          value: grateful,  set: setGrateful  },
    { key: 'greatAt'   as const, label: "Something I'm Great At", placeholder: 'A strength, owned with confidence and without apology.',                        value: greatAt,   set: setGreatAt   },
  ]

  return (
    <div className="pf-wrap">
      {/* Header */}
      <div className="pf-header">
        <button className="pf-back" onClick={() => router.back()} aria-label="Go back">←</button>
        <p className="pf-prompt">What&apos;s on your mind today?</p>
      </div>

      {/* Tab switcher */}
      <div className="pf-tabs">
        <button
          type="button"
          className={`pf-tab${activeTab === 'after-waking' ? ' pf-tab--active' : ''}`}
          onClick={() => setActiveTab('after-waking')}
        >
          After Waking
        </button>
        <button
          type="button"
          className={`pf-tab${activeTab === 'before-bed' ? ' pf-tab--active' : ''}`}
          onClick={() => setActiveTab('before-bed')}
        >
          Before Bed
        </button>
      </div>

      {/* ── After Waking tab ───────────────────────────────────────────────── */}
      {activeTab === 'after-waking' && (
        <>
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
              onChange={e => { setTitle(e.target.value); markDirty() }}
            />
            {suggestionsLeft > 0 ? (
              <button
                type="button"
                className="pf-suggest-btn"
                onClick={handleSuggestTitle}
                disabled={suggesting}
              >
                {suggesting ? 'Thinking…' : '▶ SUGGEST TITLE'}
              </button>
            ) : (
              <span className="pf-suggest-locked">WOLF|BOT cannot think of any more suggestions for this post</span>
            )}
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
                  onChange={e => { set(e.target.value); markDirty() }}
                />
                <button
                  type="button"
                  className="pf-expand-btn"
                  aria-label={`Expand ${label}`}
                  onClick={() => setFullscreenKey(key)}
                >
                  <Maximize2 size={11} strokeWidth={2} />
                  <span>EXPAND</span>
                </button>
              </div>
            </div>
          ))}

          {/* Morning state */}
          <div className="pf-section">
            <p className="pf-section-title">Morning State</p>
            <ScaleSelector label="Brain Activity" value={morning.brainScale}  color="#4A7FA5" labels={BRAIN_LABELS}  onChange={n => { setMorning(m => ({ ...m, brainScale:  n })); markDirty() }} />
            <ScaleSelector label="Body Energy"    value={morning.bodyScale}   color="#A0622A" labels={BODY_LABELS}   onChange={n => { setMorning(m => ({ ...m, bodyScale:   n })); markDirty() }} />
            <ScaleSelector label="Happy Scale"    value={morning.happyScale}  color="#3AB87A" labels={HAPPY_LABELS}  onChange={n => { setMorning(m => ({ ...m, happyScale:  n })); markDirty() }} />
            <ScaleSelector label="Stress Level"   value={morning.stressScale} color="#C87840" labels={STRESS_LABELS} onChange={n => { setMorning(m => ({ ...m, stressScale: n })); markDirty() }} />

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

          {/* Journal photo */}
          <div className="pf-section">
            <p className="pf-section-title">Journal Photo</p>
            {image ? (
              <div className="pf-photo-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Journal photo" className="pf-photo-img" />
                <div className="pf-photo-actions">
                  <button type="button" className="pf-photo-change" onClick={() => setShowCropUpload(true)}>Change photo</button>
                  <button type="button" className="pf-photo-remove" onClick={() => { setImage(null); markDirty() }}>Remove</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="pf-photo-add"
                onClick={() => {
                  if (!postId) { setError('Save a draft first before adding a photo.'); return }
                  setShowCropUpload(true)
                }}
              >
                + Add a journal photo
              </button>
            )}
          </div>

          {/* YouTube URL */}
          <div className="pf-section">
            <p className="pf-section-title">YouTube Video</p>
            <div className="pf-field">
              <input
                type="url"
                className="pf-input"
                placeholder="Paste a YouTube link… (optional)"
                value={youtubeUrl}
                onChange={e => { setYoutubeUrl(e.target.value); markDirty() }}
              />
              {youtubeUrl && !extractYouTubeId(youtubeUrl) && (
                <p className="pf-field-hint">Could not extract a video ID from this URL</p>
              )}
            </div>
          </div>

          {/* Visibility toggle */}
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
        </>
      )}

      {/* ── Before Bed tab ─────────────────────────────────────────────────── */}
      {activeTab === 'before-bed' && (
        <div className="pf-section">
          <p className="pf-section-title">Evening Reflection</p>

          <div className="pf-field">
            <label className="pf-label">How did the day go?</label>
            <div className="pf-textarea-wrap">
              <textarea
                className="pf-textarea"
                placeholder="Write freely about how it went…"
                value={eveningReflection}
                rows={7}
                onChange={e => { setEveningReflection(e.target.value); markDirty() }}
              />
            </div>
          </div>

          <div className="pf-field">
            <label className="pf-label">How do you feel about today?</label>
            <div className="pf-feel-options">
              {([1, 2, 3, 4, 5, 6] as const).map(n => (
                <button
                  key={n}
                  type="button"
                  className={`pf-feel-btn${feelAboutToday === n ? ' pf-feel-btn--active' : ''}`}
                  style={feelAboutToday === n ? { borderColor: FEEL_COLORS[n], background: `${FEEL_COLORS[n]}18`, color: FEEL_COLORS[n] } : {}}
                  onClick={() => { setFeelAboutToday(n); markDirty() }}
                >
                  {FEEL_LABELS[n]}
                </button>
              ))}
            </div>
          </div>
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
          disabled={saving || publishing}
        >
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        <button
          className="pf-btn pf-btn--publish"
          onClick={handlePublish}
          disabled={saving || publishing}
        >
          {publishing ? 'Publishing…' : 'Publish'}
        </button>
      </div>

      {/* WOLF|BOT review trigger */}
      {postId && (
        <div className="pf-wolfbot-section">
          {(reviewStatus === 'none' || reviewStatus === 'error') && (
            <button
              type="button"
              className="pf-wolfbot-trigger"
              onClick={handleWolfBotTrigger}
            >
              {reviewStatus === 'error' ? 'WOLF|BOT Review Failed — Retry' : 'Generate WOLF|BOT Review'}
            </button>
          )}
          {reviewStatus === 'done' && (
            <p className="pf-wolfbot-done">
              <span className="wbt-prompt">&gt;&nbsp;</span>
              WOLF|BOT REVIEW COMPLETE
            </p>
          )}
          {reviewStatus === 'done' && session?.user?.role === 'admin' && (
            <button
              type="button"
              className="pf-wolfbot-retrigger"
              onClick={handleWolfBotTrigger}
            >
              Re-generate (admin)
            </button>
          )}
        </div>
      )}

      <WolfBotLoadingOverlay open={reviewStatus === 'loading'} />

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
              <button type="button" className="pf-fullscreen-done" onClick={() => setFullscreenKey(null)}>Done</button>
            </div>
            <textarea
              className="pf-fullscreen-textarea"
              value={value}
              autoFocus
              onChange={e => { set(e.target.value); markDirty() }}
            />
            <div className="pf-fullscreen-footer">
              <button type="button" className="pf-fullscreen-done" onClick={() => setFullscreenKey(null)}>Done</button>
            </div>
          </div>
        )
      })()}

      {/* Photo crop/upload modal */}
      {showCropUpload && postId && (
        <PhotoCropUpload
          postId={postId}
          onUploaded={url => { setImage(url); setShowCropUpload(false); markDirty() }}
          onClose={() => setShowCropUpload(false)}
        />
      )}
    </div>
  )
}
