'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { TodayData, TodayEntry } from '@/lib/actions/today'
import JournalSection from '@/components/today/JournalSection'
import ScalePanel from '@/components/today/ScalePanel'
import RitualPanel from '@/components/today/RitualPanel'
import PhotoSection from '@/components/today/PhotoSection'
import PublishBar from '@/components/today/PublishBar'

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

export default function TodayHub({ initialData, rituals, communityEnabled, username }: Props) {
  const router = useRouter()
  const postId = initialData.post.id

  const [entries, setEntries] = useState<TodayEntry[]>(initialData.entries)
  const [scales, setScales] = useState(initialData.scales)
  const [ritualChecklist, setRitualChecklist] = useState<Record<string, boolean>>(initialData.rituals)
  const [image, setImage] = useState<string | null>(initialData.post.image)
  const [status, setStatus] = useState(initialData.post.status)
  const [isPublic, setIsPublic] = useState(initialData.post.isPublic)

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

  // ── Scales ──────────────────────────────────────────────────────────

  const saveScales = useCallback(async (newScales: typeof scales) => {
    setScales(newScales)
    await fetch(`/api/today/${postId}/scales`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newScales),
    })
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
    const { slug } = await res.json()
    setStatus('published')
    if (username) {
      router.push(`/${username}/${slug}`)
    }
  }, [postId, isPublic, username, router])

  return (
    <main className="td-hub">
      <div className="td-date">{formatDate(initialData.post.date)}</div>

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

      <ScalePanel scales={scales} onSave={saveScales} />

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
