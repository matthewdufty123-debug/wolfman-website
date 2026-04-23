'use client'

import { useState } from 'react'
import Link from 'next/link'
import RitualIcon from '@/components/RitualIcon'
import type { Ritual } from '@/lib/rituals'

type Filter = 'all' | 'active' | 'archived'

const EMPTY_FORM = {
  label: '',
  description: '',
  category: '',
  color: '#4A7FA5',
  svgContent: '',
  emoji: '',
  hashtag: '',
  sortOrder: 0,
}

export default function RitualManager({ initialRituals }: { initialRituals: Ritual[] }) {
  const [rituals, setRituals] = useState<Ritual[]>(initialRituals)
  const [filter, setFilter] = useState<Filter>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [error, setError] = useState('')

  const categories = [...new Set(rituals.map(r => r.category).filter(Boolean))]
  const filtered = rituals.filter(r =>
    filter === 'all' ? true : filter === 'active' ? r.isActive : !r.isActive
  )

  // ── Helpers ──────────────────────────────────────────────────────────────

  async function refetch() {
    const res = await fetch('/api/admin/rituals')
    if (res.ok) setRituals(await res.json())
  }

  async function saveField(id: string, field: string, value: unknown) {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/rituals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Save failed')
    } else {
      await refetch()
    }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await saveField(id, 'isActive', !current)
  }

  async function deleteRitual(id: string) {
    if (!confirm('Delete this ritual permanently? This only works if no journals reference it.')) return
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/rituals/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Delete failed')
    } else {
      await refetch()
      setEditingId(null)
    }
    setSaving(false)
  }

  async function addRitual() {
    if (!addForm.label.trim()) { setError('Label is required'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/rituals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...addForm,
        svgContent: addForm.svgContent || null,
        emoji: addForm.emoji || null,
        hashtag: addForm.hashtag || null,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Create failed')
    } else {
      await refetch()
      setAddForm(EMPTY_FORM)
      setShowAdd(false)
    }
    setSaving(false)
  }

  async function generateSvg(ritual: { label: string; description: string; category: string; color: string }, targetId?: string) {
    const genKey = targetId ?? 'new'
    setGenerating(genKey)
    setError('')
    const res = await fetch('/api/admin/rituals/generate-svg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ritual),
    })
    if (!res.ok) {
      setError('SVG generation failed')
    } else {
      const { svgContent } = await res.json()
      if (targetId) {
        await saveField(targetId, 'svgContent', svgContent)
      } else {
        setAddForm(f => ({ ...f, svgContent }))
      }
    }
    setGenerating(null)
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <header className="dash-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Link href="/admin" style={{ fontSize: 13, opacity: 0.5 }}>← admin</Link>
          <h1 className="dash-title" style={{ marginTop: 4 }}>Manage Rituals</h1>
          <p className="dash-subtitle">{rituals.filter(r => r.isActive).length} active · {rituals.filter(r => !r.isActive).length} archived</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null) }}
          className="dash-btn"
          style={{ background: '#214459', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          + Add Ritual
        </button>
      </header>

      {error && (
        <div style={{ background: '#A8202015', border: '1px solid #A82020', color: '#A82020', padding: '8px 12px', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'active', 'archived'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid #ddd', cursor: 'pointer',
              fontSize: 12, fontWeight: 500, textTransform: 'capitalize',
              background: filter === f ? '#4A7FA5' : 'transparent',
              color: filter === f ? '#fff' : 'inherit',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ border: '2px dashed #4A7FA5', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>New Ritual</h3>
          <RitualForm
            values={addForm}
            onChange={setAddForm}
            categories={categories}
            onGenerateSvg={() => generateSvg(addForm)}
            generating={generating === 'new'}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={addRitual} disabled={saving} className="dash-btn"
              style={{ background: '#214459', color: '#fff', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Saving…' : 'Create Ritual'}
            </button>
            <button onClick={() => { setShowAdd(false); setAddForm(EMPTY_FORM); setError('') }}
              style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ddd', background: 'transparent', cursor: 'pointer', fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Ritual list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filtered.map(r => (
          <RitualRow
            key={r.id}
            ritual={r}
            isEditing={editingId === r.id}
            onToggleEdit={() => setEditingId(editingId === r.id ? null : r.id)}
            onSave={(field, value) => saveField(r.id, field, value)}
            onToggleActive={() => toggleActive(r.id, r.isActive)}
            onDelete={() => deleteRitual(r.id)}
            onGenerateSvg={() => generateSvg(r, r.id)}
            generating={generating === r.id}
            saving={saving}
            categories={categories}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', opacity: 0.4, padding: 40 }}>No {filter} rituals</p>
      )}
    </div>
  )
}

// ── Ritual row ──────────────────────────────────────────────────────────────

function RitualRow({
  ritual: r,
  isEditing,
  onToggleEdit,
  onSave,
  onToggleActive,
  onDelete,
  onGenerateSvg,
  generating,
  saving,
  categories,
}: {
  ritual: Ritual
  isEditing: boolean
  onToggleEdit: () => void
  onSave: (field: string, value: unknown) => void
  onToggleActive: () => void
  onDelete: () => void
  onGenerateSvg: () => void
  generating: boolean
  saving: boolean
  categories: string[]
}) {
  return (
    <div style={{
      border: '1px solid #e5e5e5', borderRadius: 8,
      opacity: r.isActive ? 1 : 0.5,
      background: isEditing ? 'var(--color-surface, #fafafa)' : 'transparent',
    }}>
      {/* Summary row */}
      <div
        onClick={onToggleEdit}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer',
        }}
      >
        {/* Icon preview */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${r.color}15`, border: `1.5px solid ${r.color}`,
          flexShrink: 0,
        }}>
          <RitualIcon svgContent={r.svgContent} color={r.color} size={18} label={r.label} />
        </div>

        {/* Label + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{r.label}</div>
          <div style={{ fontSize: 12, opacity: 0.5 }}>
            {r.category || 'Uncategorised'} · {r.key}
            {!r.isActive && ' · archived'}
          </div>
        </div>

        {/* Color swatch */}
        <div style={{ width: 16, height: 16, borderRadius: 4, background: r.color, flexShrink: 0 }} />

        {/* Sort order */}
        <span style={{ fontSize: 11, opacity: 0.4, width: 20, textAlign: 'center' }}>{r.sortOrder}</span>

        {/* Expand indicator */}
        <span style={{ fontSize: 12, opacity: 0.3 }}>{isEditing ? '▲' : '▼'}</span>
      </div>

      {/* Edit form */}
      {isEditing && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e5e5e5' }}>
          <div style={{ paddingTop: 16 }}>
            <EditableField label="Label" value={r.label} onSave={v => onSave('label', v)} />
            <EditableField label="Description" value={r.description} onSave={v => onSave('description', v)} multiline />
            <CategoryField value={r.category} categories={categories} onSave={v => onSave('category', v)} />
            <EditableField label="Color (hex)" value={r.color} onSave={v => onSave('color', v)} />
            <EditableField label="Emoji" value={r.emoji ?? ''} onSave={v => onSave('emoji', v)} />
            <EditableField label="Hashtag" value={r.hashtag ?? ''} onSave={v => onSave('hashtag', v)} />
            <EditableField label="Sort Order" value={String(r.sortOrder)} onSave={v => onSave('sortOrder', Number(v))} />

            {/* SVG editor */}
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>SVG Content</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <textarea
                  defaultValue={r.svgContent ?? ''}
                  onBlur={e => {
                    if (e.target.value !== (r.svgContent ?? '')) onSave('svgContent', e.target.value)
                  }}
                  rows={4}
                  style={{ flex: 1, fontFamily: 'var(--font-jetbrains)', fontSize: 11, padding: 8, borderRadius: 6, border: '1px solid #ddd', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  {/* Large preview */}
                  <div style={{
                    width: 64, height: 64, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${r.color}10`, border: `1px solid ${r.color}30`,
                  }}>
                    <RitualIcon svgContent={r.svgContent} color={r.color} size={36} label={r.label} />
                  </div>
                  <button
                    onClick={onGenerateSvg}
                    disabled={generating || saving}
                    style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #4A7FA5',
                      background: 'transparent', color: '#4A7FA5', cursor: 'pointer',
                      opacity: generating ? 0.5 : 1,
                    }}
                  >
                    {generating ? 'Generating…' : 'AI Generate'}
                  </button>
                </div>
              </div>
            </div>

            {/* Key (read-only) */}
            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.4 }}>
              Key: <code style={{ fontFamily: 'var(--font-jetbrains)' }}>{r.key}</code> (immutable)
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={onToggleActive}
                disabled={saving}
                style={{
                  fontSize: 12, padding: '6px 12px', borderRadius: 4, cursor: 'pointer',
                  border: '1px solid #ddd', background: 'transparent',
                }}
              >
                {r.isActive ? 'Archive' : 'Restore'}
              </button>
              <button
                onClick={onDelete}
                disabled={saving}
                style={{
                  fontSize: 12, padding: '6px 12px', borderRadius: 4, cursor: 'pointer',
                  border: '1px solid #A82020', background: 'transparent', color: '#A82020',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Field components ────────────────────────────────────────────────────────

function EditableField({
  label,
  value,
  onSave,
  multiline,
}: {
  label: string
  value: string
  onSave: (v: string) => void
  multiline?: boolean
}) {
  const style = {
    width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd',
    fontSize: 13, fontFamily: 'inherit',
  }
  return (
    <div style={{ marginTop: 10 }}>
      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 2 }}>{label}</label>
      {multiline ? (
        <textarea defaultValue={value} onBlur={e => { if (e.target.value !== value) onSave(e.target.value) }} rows={3} style={{ ...style, resize: 'vertical' }} />
      ) : (
        <input defaultValue={value} onBlur={e => { if (e.target.value !== value) onSave(e.target.value) }} style={style} />
      )}
    </div>
  )
}

function CategoryField({
  value,
  categories,
  onSave,
}: {
  value: string
  categories: string[]
  onSave: (v: string) => void
}) {
  const [custom, setCustom] = useState(false)

  return (
    <div style={{ marginTop: 10 }}>
      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 2 }}>Category</label>
      {custom ? (
        <input
          defaultValue={value}
          onBlur={e => { onSave(e.target.value); setCustom(false) }}
          autoFocus
          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }}
        />
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={value}
            onChange={e => { if (e.target.value === '__custom') { setCustom(true) } else { onSave(e.target.value) } }}
            style={{ flex: 1, padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }}
          >
            <option value="">Uncategorised</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="__custom">+ New category…</option>
          </select>
        </div>
      )}
    </div>
  )
}

// ── Add form (reusable fields) ──────────────────────────────────────────────

function RitualForm({
  values,
  onChange,
  categories,
  onGenerateSvg,
  generating,
}: {
  values: typeof EMPTY_FORM
  onChange: (v: typeof EMPTY_FORM) => void
  categories: string[]
  onGenerateSvg: () => void
  generating: boolean
}) {
  const set = (field: string, value: string | number) => onChange({ ...values, [field]: value })

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 2 }}>Label *</label>
        <input value={values.label} onChange={e => set('label', e.target.value)}
          placeholder="e.g. Morning Run"
          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 2 }}>Description</label>
        <textarea value={values.description} onChange={e => set('description', e.target.value)}
          placeholder="A short description of this ritual"
          rows={2} style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 2 }}>Category</label>
          <select value={values.category} onChange={e => set('category', e.target.value)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }}>
            <option value="">Uncategorised</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 2 }}>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="color" value={values.color} onChange={e => set('color', e.target.value)}
              style={{ width: 36, height: 30, border: 'none', cursor: 'pointer' }} />
            <input value={values.color} onChange={e => set('color', e.target.value)}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13, fontFamily: 'var(--font-jetbrains)' }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 2 }}>Emoji</label>
          <input value={values.emoji} onChange={e => set('emoji', e.target.value)} placeholder="🌅"
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 2 }}>Hashtag</label>
          <input value={values.hashtag} onChange={e => set('hashtag', e.target.value)} placeholder="#sunlight"
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 2 }}>Sort Order</label>
          <input type="number" value={values.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }} />
        </div>
      </div>
      {/* SVG */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 2 }}>SVG Content</label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <textarea value={values.svgContent} onChange={e => set('svgContent', e.target.value)}
            placeholder="Inner SVG elements (paths, circles, etc.)"
            rows={3} style={{ flex: 1, fontFamily: 'var(--font-jetbrains)', fontSize: 11, padding: 8, borderRadius: 6, border: '1px solid #ddd', resize: 'vertical' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${values.color}10`, border: `1px solid ${values.color}30`,
            }}>
              <RitualIcon svgContent={values.svgContent || null} color={values.color} size={36} label={values.label} />
            </div>
            <button
              onClick={onGenerateSvg}
              disabled={generating || !values.label}
              type="button"
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #4A7FA5',
                background: 'transparent', color: '#4A7FA5', cursor: 'pointer',
                opacity: generating || !values.label ? 0.5 : 1,
              }}
            >
              {generating ? 'Generating…' : 'AI Generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
