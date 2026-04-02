'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WOLFBOT_GRID, WOLFBOT_PALETTE } from '@/lib/wolfbot-pixel-data'

type Config = Record<string, unknown>
type LogEntry = {
  id: number
  version: number
  keyChanged: string
  changedAt: string
}

const PROMPT_FIELDS = [
  { key: 'prompt_core',    label: 'Core Prompt',    rows: 8 },
  { key: 'prompt_helpful', label: 'HELPFUL Prompt', rows: 6 },
  { key: 'prompt_sassy',   label: 'SASSY Prompt',   rows: 6 },
]

function gridToText(grid: number[][]): string {
  return grid.map(row => row.join(' ')).join('\n')
}

function textToGrid(text: string): number[][] | null {
  try {
    const rows = text.trim().split('\n').map(row =>
      row.trim().split(/\s+/).map(n => parseInt(n, 10))
    )
    if (rows.length !== 25 || rows.some(r => r.length !== 25 || r.some(isNaN))) return null
    return rows
  } catch {
    return null
  }
}

const PALETTE_LABELS: Record<number, string> = {
  2: 'Main Fur',
  3: 'Core Facial (dark)',
  4: 'Alt Facial (mid-grey)',
  5: 'Outer Eye (steel blue)',
  6: 'Inner Eye (pale blue)',
  7: 'Tongue / Bronze',
  8: 'Heart / Blush',
  9: 'Object / Copper',
  10: 'Angry',
}

export default function WolfBotConfigPage() {
  const router = useRouter()
  const [config, setConfig] = useState<Config>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [log, setLog] = useState<LogEntry[]>([])

  // Pixel grid state — controlled textarea
  const [gridText, setGridText] = useState(gridToText(WOLFBOT_GRID))
  const [gridError, setGridError] = useState('')

  // Palette state — keyed by string index
  const [palette, setPalette] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(WOLFBOT_PALETTE).map(([k, v]) => [k, v]))
  )

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/wolfbot-config').then(r => r.json()),
      fetch('/api/admin/wolfbot-version-log').then(r => r.json()),
    ]).then(([rows, logRows]) => {
      const map: Config = {}
      for (const row of (rows as { key: string; value: unknown }[])) map[row.key] = row.value
      setConfig(map)

      // Restore grid from DB if saved
      if (map['pixel_grid']) {
        const stored = map['pixel_grid'] as number[][]
        setGridText(gridToText(stored))
      }

      // Restore palette from DB if saved
      if (map['pixel_palette']) {
        setPalette(map['pixel_palette'] as Record<string, string>)
      }

      setLog(logRows)
      setLoading(false)
    })
  }, [])

  async function save(key: string, value: unknown) {
    setSaving(key)
    setSaved(null)
    await fetch('/api/admin/wolfbot-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  function saveGrid() {
    const grid = textToGrid(gridText)
    if (!grid) {
      setGridError('Invalid grid — must be 25 rows of 25 space-separated integers (1–10)')
      return
    }
    setGridError('')
    save('pixel_grid', grid)
  }

  function savePaletteColor(idx: string, color: string) {
    const updated = { ...palette, [idx]: color }
    setPalette(updated)
    save('pixel_palette', updated)
  }

  function SaveStatus({ k }: { k: string }) {
    if (saving === k) return <p className="dash-muted" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Saving…</p>
    if (saved === k) return <p style={{ marginTop: '0.5rem', color: '#3AB87A', fontSize: '0.8rem' }}>Saved ✓</p>
    return null
  }

  if (loading) return <main className="dash-main"><div className="dash-wrap"><p className="dash-empty">Loading…</p></div></main>

  const promptVersion = config['prompt_version'] ?? '—'

  return (
    <main className="dash-main">
      <div className="dash-wrap">

        <header className="dash-header">
          <div>
            <h1 className="dash-title">WOLF|BOT Config</h1>
            <p className="dash-subtitle">WOLF BRAIN v{promptVersion as string} — live configuration</p>
          </div>
          <button
            className="dash-link"
            onClick={() => router.push('/admin')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Admin
          </button>
        </header>

        {/* ── Review AI Settings ── */}
        <section className="dash-section">
          <h2 className="dash-section-title">Review AI Settings</h2>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>
                Model
              </label>
              <input
                type="text"
                className="dash-config-textarea"
                style={{ width: '280px', fontFamily: 'var(--font-jetbrains)' }}
                defaultValue={(config['model'] as string) ?? 'claude-haiku-4-5-20251001'}
                onBlur={e => {
                  const val = e.target.value.trim()
                  if (val && val !== config['model']) save('model', val)
                }}
              />
              <SaveStatus k="model" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>
                Max tokens per review
              </label>
              <input
                type="number"
                className="dash-config-textarea"
                style={{ width: '120px', fontFamily: 'inherit' }}
                defaultValue={(config['max_tokens'] as number) ?? 600}
                onBlur={e => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val) && val !== config['max_tokens']) save('max_tokens', val)
                }}
              />
              <SaveStatus k="max_tokens" />
            </div>
          </div>
        </section>

        {/* ── Prompts ── */}
        {PROMPT_FIELDS.map(({ key, label, rows }) => (
          <section key={key} className="dash-section">
            <h2 className="dash-section-title">{label}</h2>
            <textarea
              className="dash-config-textarea"
              rows={rows}
              defaultValue={(config[key] as string) ?? ''}
              onBlur={e => {
                if (e.target.value !== (config[key] ?? '')) save(key, e.target.value)
              }}
            />
            <SaveStatus k={key} />
          </section>
        ))}

        {/* ── Title Suggestion Settings ── */}
        <section className="dash-section">
          <h2 className="dash-section-title">Title Suggestion</h2>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>
                Model (blank = use Review model)
              </label>
              <input
                type="text"
                className="dash-config-textarea"
                style={{ width: '280px', fontFamily: 'var(--font-jetbrains)' }}
                defaultValue={(config['title_model'] as string) ?? ''}
                placeholder={(config['model'] as string) ?? 'claude-haiku-4-5-20251001'}
                onBlur={e => {
                  const val = e.target.value.trim()
                  if (val !== (config['title_model'] ?? '')) save('title_model', val)
                }}
              />
              <SaveStatus k="title_model" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>
                Max tokens
              </label>
              <input
                type="number"
                className="dash-config-textarea"
                style={{ width: '120px', fontFamily: 'inherit' }}
                defaultValue={(config['title_max_tokens'] as number) ?? 25}
                onBlur={e => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val) && val !== config['title_max_tokens']) save('title_max_tokens', val)
                }}
              />
              <SaveStatus k="title_max_tokens" />
            </div>
          </div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>
            Title suffix prompt (appended to core prompt)
          </label>
          <textarea
            className="dash-config-textarea"
            rows={4}
            defaultValue={(config['title_prompt'] as string) ?? ''}
            placeholder="You are now in title-suggestion mode. Suggest a single vivid, specific title for this journal entry. Return ONLY the title — no quotes, no punctuation at the end, no explanation, nothing else. Maximum 6 words and 50 characters."
            onBlur={e => {
              if (e.target.value !== (config['title_prompt'] ?? '')) save('title_prompt', e.target.value)
            }}
          />
          <SaveStatus k="title_prompt" />
        </section>

        {/* ── Pixel Art Grid ── */}
        <section className="dash-section">
          <h2 className="dash-section-title">Pixel Art Grid</h2>
          <p className="dash-muted" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            25×25 grid. Each cell is a palette index (1 = transparent, 2–10 = palette colours).
            One row per line, space-separated integers. Saved to database — apply to live icon by updating{' '}
            <code style={{ fontFamily: 'var(--font-jetbrains)' }}>lib/wolfbot-pixel-data.ts</code>.
          </p>
          <textarea
            className="dash-config-textarea"
            rows={26}
            value={gridText}
            onChange={e => { setGridText(e.target.value); setGridError('') }}
            style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.62rem', lineHeight: 1.4, whiteSpace: 'pre' }}
            spellCheck={false}
          />
          {gridError && (
            <p style={{ color: '#A82020', fontSize: '0.8rem', marginTop: '0.5rem' }}>{gridError}</p>
          )}
          <button
            className="dash-link"
            style={{ marginTop: '0.75rem', background: 'none', border: '1px solid currentColor', padding: '0.4rem 1rem', cursor: 'pointer', borderRadius: '4px' }}
            onClick={saveGrid}
          >
            Save Grid
          </button>
          <SaveStatus k="pixel_grid" />
        </section>

        {/* ── Pixel Palette ── */}
        <section className="dash-section">
          <h2 className="dash-section-title">Pixel Palette</h2>
          <p className="dash-muted" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            Index 1 is always transparent. Changes save on blur and are stored in the database.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {Object.entries(WOLFBOT_PALETTE).map(([idxStr]) => {
              const currentColor = palette[idxStr] ?? WOLFBOT_PALETTE[parseInt(idxStr)]
              return (
                <div key={idxStr} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input
                    type="color"
                    value={currentColor}
                    onChange={e => setPalette(p => ({ ...p, [idxStr]: e.target.value }))}
                    onBlur={e => savePaletteColor(idxStr, e.target.value)}
                    style={{ width: '38px', height: '38px', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}
                  />
                  <div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-jetbrains)' }}>
                      {idxStr}: {currentColor}
                    </span>
                    <br />
                    <span className="dash-muted" style={{ fontSize: '0.7rem' }}>
                      {PALETTE_LABELS[parseInt(idxStr)]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <SaveStatus k="pixel_palette" />
        </section>

        <p className="dash-muted" style={{ fontSize: '0.75rem', marginTop: '1rem' }}>
          Prompts and AI settings save on blur and auto-increment WOLF BRAIN version. Pixel data saves on button click.
        </p>

        {/* ── Version Log ── */}
        {log.length > 0 && (
          <section className="dash-section">
            <h2 className="dash-section-title">Version Log</h2>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Key changed</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {log.map(entry => (
                  <tr key={entry.id}>
                    <td>
                      <span className="dash-badge dash-badge--post">v{entry.version}</span>
                    </td>
                    <td className="dash-muted" style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.8rem' }}>
                      {entry.keyChanged}
                    </td>
                    <td className="dash-muted">
                      {new Date(entry.changedAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

      </div>
    </main>
  )
}
