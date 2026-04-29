'use client'

import { useState, useCallback, useRef } from 'react'
import type { TodayData, TodayEntry } from '@/lib/actions/today'
import type { ScaleEntryMap } from '@/lib/db/queries'
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
  const [scaleEntries, setScaleEntries] = useState<ScaleEntryMap>(initialData.scaleEntries)
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

  const addEntry = useCallback(async (type: string, content: string) => {
    const res = await fetch(`/api/today/${postId}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content }),
    })
    if (!res.ok) return
    const { entry } = await res.json()
    setEntries(prev => [...prev, entry])
  }, [postId])

  const updateEntry = useCallback(async (entryId: string, content: string) => {
    const res = await fetch(`/api/today/${postId}/entries/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (!res.ok) return
    const { entry } = await res.json()
    setEntries(prev => prev.map(e => e.id === entryId ? entry : e))
  }, [postId])

  const deleteEntry = useCallback(async (entryId: string) => {
    const res = await fetch(`/api/today/${postId}/entries/${entryId}`, { method: 'DELETE' })
    if (!res.ok) return
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }, [postId])

  // ── Scale entry CRUD ──────────────────────────────────────────────

  const addScaleEntry = useCallback(async (type: string, value: number, note?: string) => {
    const res = await fetch(`/api/today/${postId}/scale-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value, note }),
    })
    if (!res.ok) return
    const entry = await res.json()
    setScaleEntries(prev => ({
      ...prev,
      [type]: [...(prev[type] ?? []), entry],
    }))
  }, [postId])

  const updateScaleEntry = useCallback(async (type: string, entryId: string, value: number, note?: string) => {
    const res = await fetch(`/api/today/${postId}/scale-entries/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, note: note ?? null }),
    })
    if (!res.ok) return
    const updated = await res.json()
    setScaleEntries(prev => ({
      ...prev,
      [type]: (prev[type] ?? []).map(e => e.id === entryId ? updated : e),
    }))
  }, [postId])

  const deleteScaleEntry = useCallback(async (type: string, entryId: string) => {
    const res = await fetch(`/api/today/${postId}/scale-entries/${entryId}`, { method: 'DELETE' })
    if (!res.ok) return
    setScaleEntries(prev => ({
      ...prev,
      [type]: (prev[type] ?? []).filter(e => e.id !== entryId),
    }))
  }, [postId])

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

  // ── Publish ─────────────────────────────────────────────────────────

  const publish = useCallback(async () => {
    const res = await fetch(`/api/today/${postId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic }),
    })
    if (!res.ok) return
    const data = await res.json()
    setStatus('published')
    setSlug(data.slug)
    if (data.title) setTitle(data.title)
    if (data.publishedAt) setPublishedAt(data.publishedAt)
  }, [postId, isPublic])

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
          onAdd={content => addEntry(section.type, content)}
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
            type={s.type}
            label={s.label}
            icon={s.icon}
            labels={s.labels}
            entries={scaleEntries[s.type] ?? []}
            onAdd={(value, note) => addScaleEntry(s.type, value, note)}
            onUpdate={(entryId, value, note) => updateScaleEntry(s.type, entryId, value, note)}
            onDelete={(entryId) => deleteScaleEntry(s.type, entryId)}
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
        isPublic={isPublic}
        communityEnabled={communityEnabled}
        publishedAt={publishedAt}
        slug={slug}
        username={username}
        onTogglePublic={() => setIsPublic(v => !v)}
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
