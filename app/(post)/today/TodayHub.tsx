'use client'

import { useState, useCallback, useRef } from 'react'
import type { TodayData, TodayEntry } from '@/lib/actions/today'
import JournalSection from '@/components/today/JournalSection'
import ScaleSection from '@/components/today/ScaleSection'
import RitualPanel from '@/components/today/RitualPanel'
import PhotoSection from '@/components/today/PhotoSection'
import PublishBar from '@/components/today/PublishBar'
import { BRAIN_LABELS, BODY_LABELS, HAPPY_LABELS, STRESS_LABELS } from '@/lib/scale-config'

export type RitualDef = {
  key: string
  label: string
  description: string
  category: string
  color: string
  svgContent: string | null
  sortOrder: number
}

interface Props {
  initialData: TodayData
  rituals: RitualDef[]
  communityEnabled: boolean
  username: string | null
}

const SECTIONS = [
  { type: 'intention', label: "Today's Intention", placeholder: 'What is your intention for today?' },
  { type: 'gratitude', label: "I'm Grateful For", placeholder: 'What are you grateful for right now?' },
  { type: 'great_at', label: "Something I'm Great At", placeholder: "What's something you're great at?" },
  { type: 'reflection', label: 'Evening Reflection', placeholder: 'How did today go?' },
] as const

const SCALE_SECTIONS = [
  { type: 'brain', label: 'Brain', icon: '🧠', labels: BRAIN_LABELS },
  { type: 'body', label: 'Body', icon: '💪', labels: BODY_LABELS },
  { type: 'happy', label: 'Mood', icon: '😊', labels: HAPPY_LABELS },
  { type: 'stress', label: 'Stress', icon: '⚡', labels: STRESS_LABELS },
] as const

export default function TodayHub({ initialData, rituals, communityEnabled, username }: Props) {
  const postId = initialData.post.id

  const [entries, setEntries] = useState<TodayEntry[]>(initialData.entries)
  const [scales, setScales] = useState<Record<string, number | null>>({
    brain: initialData.scales.brainScale,
    body: initialData.scales.bodyScale,
    happy: initialData.scales.happyScale,
    stress: initialData.scales.stressScale,
  })
  const [ritualChecklist, setRitualChecklist] = useState<Record<string, boolean>>(initialData.rituals)
  const [image, setImage] = useState<string | null>(initialData.post.image)
  const [status, setStatus] = useState(initialData.post.status)
  const [isPublic, setIsPublic] = useState(initialData.post.isPublic)
  const [title, setTitle] = useState(initialData.post.title)
  const [slug, setSlug] = useState(initialData.post.slug)
  const [publishedAt, setPublishedAt] = useState<string | null>(
    initialData.post.publishedAt && new Date(initialData.post.publishedAt).getTime() > 0
      ? new Date(initialData.post.publishedAt).toISOString()
      : null
  )

  // ── Title editing ───────────────────────────────────────────────────

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const saveTitle = useCallback(async () => {
    const trimmed = titleDraft.trim()
    if (!trimmed || trimmed === title) {
      setEditingTitle(false)
      setTitleDraft(title)
      return
    }
    setTitle(trimmed)
    setEditingTitle(false)
    const res = await fetch(`/api/today/${postId}/title`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.slug) setSlug(data.slug)
    }
  }, [postId, titleDraft, title])

  // ── Entry CRUD ──────────────────────────────────────────────────────
  // Each of these reports success so callers can keep the user's writing on
  // screen when a save fails, instead of closing the editor and losing it.

  const addEntry = useCallback(async (type: string, content: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/today/${postId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content }),
      })
      if (!res.ok) return false
      const { entry } = await res.json()
      setEntries(prev => [...prev, entry])
      return true
    } catch {
      return false
    }
  }, [postId])

  const updateEntry = useCallback(async (entryId: string, content: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/today/${postId}/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) return false
      const { entry } = await res.json()
      setEntries(prev => prev.map(e => e.id === entryId ? entry : e))
      return true
    } catch {
      return false
    }
  }, [postId])

  const deleteEntry = useCallback(async (entryId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/today/${postId}/entries/${entryId}`, { method: 'DELETE' })
      if (!res.ok) return false
      setEntries(prev => prev.filter(e => e.id !== entryId))
      return true
    } catch {
      return false
    }
  }, [postId])

  // ── Open editors ────────────────────────────────────────────────────
  // Text typed into a section but not yet added lives here rather than inside
  // the form, so Publish can commit it. A key present means that section's
  // editor is open; absent means closed.

  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({})

  const openDraft = useCallback((type: string) => {
    setDrafts(prev => ({ ...prev, [type]: prev[type] ?? '' }))
  }, [])

  const changeDraft = useCallback((type: string, content: string) => {
    setDrafts(prev => ({ ...prev, [type]: content }))
  }, [])

  const closeDraft = useCallback((type: string) => {
    setDrafts(prev => {
      const next = { ...prev }
      delete next[type]
      return next
    })
    setDraftErrors(prev => {
      const next = { ...prev }
      delete next[type]
      return next
    })
  }, [])

  const commitDraft = useCallback(async (type: string) => {
    const content = drafts[type]
    if (!content || !content.trim()) return
    const ok = await addEntry(type, content)
    if (ok) {
      closeDraft(type)
    } else {
      setDraftErrors(prev => ({
        ...prev,
        [type]: "Couldn't save that. Your writing is still here — check your connection and try again.",
      }))
    }
  }, [drafts, addEntry, closeDraft])

  const pendingDrafts = Object.entries(drafts).filter(([, c]) => c.trim().length > 0)

  // ── Scales — one snapshot per day ─────────────────────────────────

  const setScale = useCallback(async (type: string, value: number) => {
    setScales(prev => ({ ...prev, [type]: value }))
    const res = await fetch(`/api/today/${postId}/scale-entries`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value }),
    })
    if (!res.ok) setScales(prev => ({ ...prev, [type]: null }))
  }, [postId])

  const clearScale = useCallback(async (type: string) => {
    const previous = scales[type]
    setScales(prev => ({ ...prev, [type]: null }))
    const res = await fetch(`/api/today/${postId}/scale-entries`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    if (!res.ok) setScales(prev => ({ ...prev, [type]: previous ?? null }))
  }, [postId, scales])

  // ── Rituals ─────────────────────────────────────────────────────────

  const toggleRitual = useCallback(async (key: string) => {
    const updated = { ...ritualChecklist, [key]: !ritualChecklist[key] }
    setRitualChecklist(updated)
    await fetch(`/api/today/${postId}/rituals`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routineChecklist: updated }),
    })
  }, [postId, ritualChecklist])

  // ── Photo ───────────────────────────────────────────────────────────

  const onPhotoUploaded = useCallback((url: string) => {
    setImage(url)
  }, [])

  // ── Visibility ──────────────────────────────────────────────────────
  // Drafts flip locally and the value is sent at publish time; published
  // posts update the database immediately so nothing is ever stuck Private.

  const togglePublic = useCallback(async () => {
    const next = !isPublic
    setIsPublic(next)
    if (status !== 'published') return
    const res = await fetch(`/api/today/${postId}/visibility`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: next }),
    })
    if (!res.ok) setIsPublic(!next)
  }, [postId, isPublic, status])

  // ── Publish ─────────────────────────────────────────────────────────

  const [publishError, setPublishError] = useState<string | null>(null)

  const publish = useCallback(async (): Promise<boolean> => {
    setPublishError(null)

    // Anything still sitting in an open editor is real writing — save it
    // first, so pressing Publish never quietly leaves it out of the journal.
    for (const [type, content] of pendingDrafts) {
      const ok = await addEntry(type, content)
      if (!ok) {
        setDraftErrors(prev => ({
          ...prev,
          [type]: "Couldn't save this. Your writing is still here — check your connection and try again.",
        }))
        setPublishError('Some of your writing could not be saved, so nothing was published.')
        return false
      }
      closeDraft(type)
    }

    try {
      const res = await fetch(`/api/today/${postId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic }),
      })
      if (!res.ok) {
        setPublishError("Couldn't publish just now. Your journal is saved — try again in a moment.")
        return false
      }
      const data = await res.json()
      setStatus('published')
      setSlug(data.slug)
      if (data.title) setTitle(data.title)
      if (data.publishedAt) setPublishedAt(data.publishedAt)
      return true
    } catch {
      setPublishError("Couldn't publish just now. Your journal is saved — try again in a moment.")
      return false
    }
  }, [postId, isPublic, pendingDrafts, addEntry, closeDraft])

  return (
    <main className="td-hub">
      <div className="td-date">{formatDate(initialData.post.date)}</div>

      {/* Title */}
      <div className="td-title-section">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            className="td-title-input"
            type="text"
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(title) } }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="td-title-display"
            onClick={() => { setTitleDraft(title); setEditingTitle(true) }}
            title="Tap to edit title"
          >
            {title}
          </button>
        )}
      </div>

      {SECTIONS.map(section => (
        <JournalSection
          key={section.type}
          type={section.type}
          label={section.label}
          placeholder={section.placeholder}
          entries={entries.filter(e => e.type === section.type)}
          draft={drafts[section.type] ?? null}
          draftError={draftErrors[section.type] ?? null}
          onOpenDraft={() => openDraft(section.type)}
          onDraftChange={content => changeDraft(section.type, content)}
          onCommitDraft={() => commitDraft(section.type)}
          onCancelDraft={() => closeDraft(section.type)}
          onUpdate={updateEntry}
          onDelete={deleteEntry}
        />
      ))}

      <div className="td-divider" />

      <div className="td-scale-panel">
        <h2 className="td-panel-title">How I Showed Up</h2>
        {SCALE_SECTIONS.map(s => (
          <ScaleSection
            key={s.type}
            label={s.label}
            icon={s.icon}
            labels={s.labels}
            value={scales[s.type] ?? null}
            onSelect={value => setScale(s.type, value)}
            onClear={() => clearScale(s.type)}
          />
        ))}
      </div>

      <div className="td-divider" />

      <RitualPanel
        rituals={rituals}
        checklist={ritualChecklist}
        onToggle={toggleRitual}
      />

      <div className="td-divider" />

      <PhotoSection
        postId={postId}
        image={image}
        onUploaded={onPhotoUploaded}
      />

      <div className="td-divider" />

      <PublishBar
        status={status}
        entryCount={entries.length}
        pendingCount={pendingDrafts.length}
        error={publishError}
        isPublic={isPublic}
        communityEnabled={communityEnabled}
        publishedAt={publishedAt}
        slug={slug}
        username={username}
        onTogglePublic={togglePublic}
        onPublish={publish}
      />
    </main>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const day = d.getDate()
  const suffix = [, 'st', 'nd', 'rd'][day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10 ? day % 10 : 0)] || 'th'
  return `${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`
}
