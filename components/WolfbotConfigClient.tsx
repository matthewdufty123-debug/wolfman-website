'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import WolfbotPixelRenderer from './WolfbotPixelRenderer'
import WolfbotPixelEditor from './WolfbotPixelEditor'

// ── Types ──────────────────────────────────────────────────────────────────
interface WolfbotConfigRow {
  id: number
  key: string
  category: string
  label: string
  value: unknown
  description: string | null
  updatedAt: Date | string | null
}

interface PaletteEntry { num: number; hex: string; name: string }
interface EmotionItem  { name: string; label: string; trigger: string; animation_notes: string }
interface EventItem    { event: string; page: string; emotion: string; message_context: string }
interface PageItem     { path: string; role: string; default_emotion: string; active: boolean }

// ── Save helper ────────────────────────────────────────────────────────────
async function saveKey(key: string, value: unknown): Promise<string | null> {
  const res = await fetch('/api/admin/wolfbot-config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    return (d as { error?: string }).error ?? 'Save failed'
  }
  return null
}

// ── Save state hook ────────────────────────────────────────────────────────
function useSaveState() {
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)
  const [error,  setError]    = useState('')
  const save = async (key: string, value: unknown) => {
    setSaving(true); setSaved(false); setError('')
    const err = await saveKey(key, value)
    if (err) setError(err)
    else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }
  return { saving, saved, error, save }
}

// ── Section 1: Identity ────────────────────────────────────────────────────
function IdentitySection({
  baseSprite, palette, version, personalityPrompt, tagline,
}: {
  baseSprite: number[][]; palette: string[]; version: string
  personalityPrompt: string; tagline: string
}) {
  const [prompt, setPrompt] = useState(personalityPrompt)
  const [tag,    setTag]    = useState(tagline)
  const ps = useSaveState()
  const ts = useSaveState()

  return (
    <section className="dash-section">
      <h2 className="dash-section-title">Identity</h2>
      <div className="wolfbot-identity-wrap">
        <div>
          <WolfbotPixelRenderer grid={baseSprite} palette={palette} />
          <div className="wolfbot-version-tag">Wolfbot {version}</div>
        </div>
        <div className="wolfbot-identity-fields">
          <div className="dash-config-row">
            <label className="dash-config-label">Tagline</label>
            <input
              className="dash-config-input"
              value={tag}
              onChange={e => setTag(e.target.value)}
            />
            <div className="dash-config-actions">
              <button className="dash-action-btn" onClick={() => ts.save('tagline', tag)} disabled={ts.saving}>
                {ts.saving ? 'Saving…' : 'Save'}
              </button>
              {ts.saved  && <span className="dash-config-saved">Saved</span>}
              {ts.error  && <span className="dash-config-error">{ts.error}</span>}
            </div>
          </div>
          <div className="dash-config-row" style={{ marginTop: 16 }}>
            <label className="dash-config-label">Personality Prompt (base)</label>
            <textarea
              className="dash-config-input wolfbot-prompt-textarea"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={6}
            />
            <div className="dash-config-actions">
              <button className="dash-action-btn" onClick={() => ps.save('personality_prompt', prompt)} disabled={ps.saving}>
                {ps.saving ? 'Saving…' : 'Save'}
              </button>
              {ps.saved && <span className="dash-config-saved">Saved</span>}
              {ps.error && <span className="dash-config-error">{ps.error}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Section 2: Colour Palette ──────────────────────────────────────────────
function PaletteSection({ palette }: { palette: PaletteEntry[] }) {
  return (
    <section className="dash-section">
      <h2 className="dash-section-title">Colour Palette</h2>
      <div className="wolfbot-palette-display">
        {palette.map(p => (
          <div key={p.num} className="wolfbot-palette-swatch-wrap">
            <div className="wolfbot-palette-swatch" style={{ background: p.hex }} title={p.hex} />
            <div className="wolfbot-palette-swatch-num">{p.num}</div>
            <div className="wolfbot-palette-swatch-name">{p.name}</div>
            <div className="wolfbot-palette-swatch-hex">{p.hex}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Section 3: Emotion Register ────────────────────────────────────────────
function EmotionRegisterSection({
  emotions, emotionSprites, palette,
}: {
  emotions: EmotionItem[]
  emotionSprites: Record<string, number[][]>
  palette: string[]
}) {
  const [rows, setRows]         = useState<EmotionItem[]>(emotions)
  const [editing, setEditing]   = useState<string | null>(null)
  const [draft, setDraft]       = useState<EmotionItem | null>(null)
  const { saving, saved, error, save } = useSaveState()

  const startEdit = (em: EmotionItem) => { setEditing(em.name); setDraft({ ...em }) }
  const cancelEdit = () => { setEditing(null); setDraft(null) }

  const saveRow = async () => {
    if (!draft) return
    const updated = rows.map(r => r.name === draft.name ? draft : r)
    const err = await saveKey('emotion_register', updated)
    if (!err) { setRows(updated); cancelEdit() }
  }

  return (
    <section className="dash-section">
      <h2 className="dash-section-title">Emotion Register</h2>
      <table className="dash-table wolfbot-emotion-table">
        <thead>
          <tr>
            <th>Preview</th>
            <th>Name</th>
            <th>Label</th>
            <th>Trigger</th>
            <th>Animation Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(em => {
            const sprite = emotionSprites[em.name]
            const hasSprite = Array.isArray(sprite) && sprite.length === 25
            const isEditing = editing === em.name

            return (
              <tr key={em.name}>
                <td>
                  <div className="wolfbot-mini-preview">
                    <WolfbotPixelRenderer
                      grid={hasSprite ? sprite : Array.from({ length: 25 }, () => Array(25).fill(1))}
                      palette={palette}
                      size={0.25}
                    />
                  </div>
                </td>
                <td><span className="dash-muted">{em.name}</span></td>
                <td>
                  {isEditing && draft ? (
                    <input className="wolfbot-inline-input" value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} />
                  ) : em.label}
                </td>
                <td>
                  {isEditing && draft ? (
                    <input className="wolfbot-inline-input" value={draft.trigger} onChange={e => setDraft({ ...draft, trigger: e.target.value })} />
                  ) : em.trigger}
                </td>
                <td>
                  {isEditing && draft ? (
                    <input className="wolfbot-inline-input" value={draft.animation_notes} onChange={e => setDraft({ ...draft, animation_notes: e.target.value })} />
                  ) : (em.animation_notes || <span className="dash-muted">—</span>)}
                </td>
                <td>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="wolfbot-btn wolfbot-btn--primary" onClick={saveRow}>Save</button>
                      <button className="wolfbot-btn" onClick={cancelEdit}>Cancel</button>
                    </div>
                  ) : (
                    <button className="wolfbot-btn" onClick={() => startEdit(em)}>Edit</button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {saving && <span className="dash-muted" style={{ fontSize: '0.8rem', marginTop: 8 }}>Saving…</span>}
      {saved  && <span className="dash-config-saved" style={{ marginTop: 8 }}>Saved</span>}
      {error  && <span className="dash-config-error"  style={{ marginTop: 8 }}>{error}</span>}
    </section>
  )
}

// ── Section 4: Animation Test Lab ─────────────────────────────────────────
function TestLabSection({
  emotions, emotionSprites, baseSprite, palette,
}: {
  emotions: EmotionItem[]
  emotionSprites: Record<string, number[][]>
  baseSprite: number[][]
  palette: string[]
}) {
  const [selected, setSelected] = useState(emotions[0]?.name ?? '')
  const [playing,  setPlaying]  = useState(false)
  const [frame,    setFrame]    = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => setFrame(f => f + 1), 400)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setFrame(0)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing])

  const sprite = emotionSprites[selected]
  const hasSprite = Array.isArray(sprite) && sprite.length === 25
  const displayGrid = hasSprite ? sprite : baseSprite

  // Colour-change-only animation: pulse eye colours (indices 4 and 5) between dim and full
  const animPalette = palette.map((hex, i) => {
    if (!playing) return hex
    if (i === 4 || i === 5) {
      // Alternate brightness every other frame
      return frame % 2 === 0 ? hex : shiftBrightness(hex, 0.6)
    }
    return hex
  })

  return (
    <section className="dash-section">
      <h2 className="dash-section-title">Animation Test Lab</h2>
      <div className="wolfbot-testlab-wrap">
        <div className="wolfbot-testlab-controls">
          <select className="wolfbot-select" value={selected} onChange={e => { setSelected(e.target.value); setPlaying(false) }}>
            {emotions.map(em => <option key={em.name} value={em.name}>{em.label}</option>)}
          </select>
          <button
            className={`wolfbot-btn${playing ? ' wolfbot-btn--primary' : ''}`}
            onClick={() => setPlaying(p => !p)}
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          {!hasSprite && <span className="dash-muted" style={{ fontSize: '0.8rem' }}>No sprite designed yet — showing base</span>}
        </div>
        <WolfbotPixelRenderer grid={displayGrid} palette={animPalette} />
      </div>
    </section>
  )
}

// Simple brightness shift for animation (multiplies RGB components)
function shiftBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)))
  return `#${clamp(r * factor).toString(16).padStart(2, '0')}${clamp(g * factor).toString(16).padStart(2, '0')}${clamp(b * factor).toString(16).padStart(2, '0')}`
}

// ── Section 6: Event Map ───────────────────────────────────────────────────
function EventMapSection({ events: initialEvents, emotions }: { events: EventItem[], emotions: EmotionItem[] }) {
  const [rows, setRows] = useState<EventItem[]>(initialEvents)
  const { saving, saved, error, save } = useSaveState()

  const update = (i: number, field: keyof EventItem, val: string) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }
  const addRow = () => setRows(prev => [...prev, { event: '', page: '', emotion: emotions[0]?.name ?? '', message_context: '' }])
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i))

  return (
    <section className="dash-section">
      <h2 className="dash-section-title">Event Map</h2>
      <table className="dash-table wolfbot-event-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Page</th>
            <th>Emotion</th>
            <th>Message Context</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td><input className="wolfbot-inline-input" value={row.event}           onChange={e => update(i, 'event',           e.target.value)} /></td>
              <td><input className="wolfbot-inline-input" value={row.page}            onChange={e => update(i, 'page',            e.target.value)} /></td>
              <td>
                <select className="wolfbot-inline-select" value={row.emotion} onChange={e => update(i, 'emotion', e.target.value)}>
                  {emotions.map(em => <option key={em.name} value={em.name}>{em.label}</option>)}
                </select>
              </td>
              <td><input className="wolfbot-inline-input" value={row.message_context} onChange={e => update(i, 'message_context', e.target.value)} /></td>
              <td><button className="wolfbot-btn wolfbot-btn--danger" onClick={() => removeRow(i)}>×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="dash-config-actions" style={{ marginTop: 12 }}>
        <button className="wolfbot-btn" onClick={addRow}>+ Add event</button>
        <button className="dash-action-btn" onClick={() => save('event_map', rows)} disabled={saving}>
          {saving ? 'Saving…' : 'Save all'}
        </button>
        {saved && <span className="dash-config-saved">Saved</span>}
        {error && <span className="dash-config-error">{error}</span>}
      </div>
    </section>
  )
}

// ── Section 7: Page Appearances ────────────────────────────────────────────
function PageAppearancesSection({ pages: initialPages, emotions }: { pages: PageItem[], emotions: EmotionItem[] }) {
  const [rows, setRows] = useState<PageItem[]>(initialPages)
  const { saving, saved, error, save } = useSaveState()

  const update = (i: number, field: keyof PageItem, val: string | boolean) => {
    setRows(prev => {
      const next = prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
      // Auto-save on toggle
      if (field === 'active') save('page_appearances', next)
      return next
    })
  }

  return (
    <section className="dash-section">
      <h2 className="dash-section-title">Page Appearances</h2>
      <table className="dash-table wolfbot-pages-table">
        <thead>
          <tr>
            <th>Path</th>
            <th>Role</th>
            <th>Default Emotion</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td><code style={{ color: '#4A90C4', fontSize: '0.8rem' }}>{row.path}</code></td>
              <td><input className="wolfbot-inline-input" value={row.role} onChange={e => update(i, 'role', e.target.value)} /></td>
              <td>
                <select className="wolfbot-inline-select" value={row.default_emotion} onChange={e => update(i, 'default_emotion', e.target.value)}>
                  {emotions.map(em => <option key={em.name} value={em.name}>{em.label}</option>)}
                </select>
              </td>
              <td>
                <label className="wolfbot-toggle">
                  <input
                    type="checkbox"
                    checked={row.active}
                    onChange={e => update(i, 'active', e.target.checked)}
                  />
                  <span className="wolfbot-toggle-track" />
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="dash-config-actions" style={{ marginTop: 12 }}>
        <button className="dash-action-btn" onClick={() => save('page_appearances', rows)} disabled={saving}>
          {saving ? 'Saving…' : 'Save roles & emotions'}
        </button>
        {saved && <span className="dash-config-saved">Saved</span>}
        {error && <span className="dash-config-error">{error}</span>}
      </div>
    </section>
  )
}

// ── Root Client Component ──────────────────────────────────────────────────
export default function WolfbotConfigClient({ rows }: { rows: WolfbotConfigRow[] }) {
  // Build keyed config object
  const cfg = Object.fromEntries(rows.map(r => [r.key, r.value]))

  const paletteEntries  = (cfg.colour_palette  as PaletteEntry[]) ?? []
  const paletteHex      = paletteEntries.map(p => p.hex)
  const baseSprite      = (cfg.base_sprite      as number[][]) ?? []
  const emotionSprites  = (cfg.emotion_sprites  as Record<string, number[][]>) ?? {}
  const emotionRegister = (cfg.emotion_register as EmotionItem[]) ?? []
  const eventMap        = (cfg.event_map        as EventItem[]) ?? []
  const pageAppearances = (cfg.page_appearances as PageItem[]) ?? []
  const version         = (cfg.version          as string) ?? 'v1.0.0'
  const personalityPrompt = (cfg.personality_prompt as string) ?? ''
  const tagline         = (cfg.tagline          as string) ?? ''

  const [liveEmotionSprites, setLiveEmotionSprites] = useState(emotionSprites)

  const handleSpriteUpdate = useCallback((emotionName: string, grid: number[][]) => {
    setLiveEmotionSprites(prev => ({ ...prev, [emotionName]: grid }))
  }, [])

  return (
    <div>
      {/* 1 — Identity */}
      <IdentitySection
        baseSprite={baseSprite}
        palette={paletteHex}
        version={version}
        personalityPrompt={personalityPrompt}
        tagline={tagline}
      />

      {/* 2 — Colour Palette */}
      <PaletteSection palette={paletteEntries} />

      {/* 3 — Emotion Register */}
      <EmotionRegisterSection
        emotions={emotionRegister}
        emotionSprites={liveEmotionSprites}
        palette={paletteHex}
      />

      {/* 4 — Animation Test Lab */}
      <TestLabSection
        emotions={emotionRegister}
        emotionSprites={liveEmotionSprites}
        baseSprite={baseSprite}
        palette={paletteHex}
      />

      {/* 5 — Pixel Editor */}
      <section className="dash-section">
        <h2 className="dash-section-title">Pixel Editor v1</h2>
        <WolfbotPixelEditor
          palette={paletteHex}
          emotionSprites={liveEmotionSprites}
          emotions={emotionRegister}
          onSpriteUpdate={handleSpriteUpdate}
        />
      </section>

      {/* 6 — Event Map */}
      <EventMapSection events={eventMap} emotions={emotionRegister} />

      {/* 7 — Page Appearances */}
      <PageAppearancesSection pages={pageAppearances} emotions={emotionRegister} />
    </div>
  )
}
