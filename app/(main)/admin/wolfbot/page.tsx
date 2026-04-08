'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WOLFBOT_GRID, WOLFBOT_PALETTE } from '@/lib/wolfbot-pixel-data'

type Config = Record<string, unknown>
type LogEntry = { id: number; version: number; keyChanged: string; changedAt: string }
type ReviewRow = {
  id: string; postTitle: string; postDate: string; moodSignal: string | null
  themeWords: string | null; journalContext: unknown; modelUsed: string | null
  inputTokensTotal: number | null; outputTokensTotal: number | null; generatedAt: string
  review: string | null
}

// ── Defaults (mirrored from API routes) ───────────────────────────────────────

const DEFAULT_CORE_PROMPT = `You are WOLF|BOT — a journal review AI. Wolf by programming, dog at heart — that dog brain occasionally surfaces: a bark, a dog analogy, a moment of pure enthusiasm. It shows through whatever mode you are in. Review the user's intention, gratitude, and what they said they are great at. Cross-reference morning scores and rituals where available. Be specific. Never be generic. Max 3 paragraphs. Never mock the person. If content suggests risk or distress, respond only: "I'm not able to review this journal. Please visit the guidance section of Wolfman.blog."`

const DEFAULT_TITLE_PROMPT = `You are a title generator for a mindful morning journal. Read the journal entry and return a single vivid, specific title that captures the core theme or insight of the entry. Return ONLY the title — no quotes, no punctuation at the end, no explanation, nothing else. Maximum {max_words} words and {max_chars} characters.`

const PROMPT_FIELDS = [
  { key: 'prompt_core', label: 'Review Prompt', rows: 10, def: DEFAULT_CORE_PROMPT },
]

const CLAUDE_MODELS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 — fastest, cheapest' },
  { value: 'claude-sonnet-4-6',         label: 'Sonnet 4.6 — balanced'          },
  { value: 'claude-opus-4-6',           label: 'Opus 4.6 — most capable'        },
]

const PALETTE_LABELS: Record<number, string> = {
  2: 'Main Fur',           3: 'Core Facial (dark)',  4: 'Alt Facial (mid-grey)',
  5: 'Outer Eye',          6: 'Inner Eye',            7: 'Tongue / Bronze',
  8: 'Heart / Blush',      9: 'Object / Copper',     10: 'Angry',
}

// ── Grid helpers ──────────────────────────────────────────────────────────────

function gridToText(grid: number[][]): string {
  const rows = grid.map((row, i) => `  // row ${i + 1}\n  [${row.join(',')}]`)
  return `[\n${rows.join(',\n')}\n]`
}

function parseGridInput(text: string): number[][] | null {
  try {
    // Remove // line comments
    const noComments = text.replace(/\/\/[^\n]*/g, '')
    // Find all bracketed rows [n,n,n,...] — each must contain exactly 25 integers
    const rowMatches = noComments.match(/\[[\d,\s]+\]/g)
    if (rowMatches) {
      const rows = rowMatches
        .map(r => r.replace(/[\[\]]/g, '').split(',').map(n => parseInt(n.trim(), 10)))
        .filter(r => r.length === 25)
      if (rows.length === 25 && !rows.some(r => r.some(isNaN))) return rows
    }
    // Fallback: plain space-separated rows (one row per line)
    const lines = text.trim().split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('//') && l !== '[' && l !== ']')
    if (lines.length === 25) {
      const rows = lines.map(l =>
        l.replace(/[\[\],]/g, ' ').trim().split(/\s+/).map(n => parseInt(n, 10))
      )
      if (rows.every(r => r.length === 25 && !r.some(isNaN))) return rows
    }
    return null
  } catch {
    return null
  }
}

// ── Pixel preview ─────────────────────────────────────────────────────────────

function PixelPreview({
  grid,
  palette,
  size = 140,
}: {
  grid: number[][]
  palette: Record<string, string>
  size?: number
}) {
  return (
    <svg
      viewBox="0 0 25 25"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="WOLF|BOT preview"
      role="img"
      style={{ display: 'block', imageRendering: 'pixelated' }}
    >
      {grid.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          if (cell === 1) return null
          const fill = palette[String(cell)]
          if (!fill) return null
          return (
            <rect key={`${rowIdx}-${colIdx}`} x={colIdx} y={rowIdx} width={1} height={1} fill={fill} />
          )
        })
      )}
    </svg>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WolfBotConfigPage() {
  const router = useRouter()
  const [config, setConfig] = useState<Config>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [log, setLog] = useState<LogEntry[]>([])
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [expandedReview, setExpandedReview] = useState<string | null>(null)

  const [gridText, setGridText] = useState(gridToText(WOLFBOT_GRID))
  const [gridError, setGridError] = useState('')
  const [previewGrid, setPreviewGrid] = useState<number[][]>(WOLFBOT_GRID)

  const [palette, setPalette] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(WOLFBOT_PALETTE).map(([k, v]) => [k, v]))
  )

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/wolfbot-config').then(r => r.json()),
      fetch('/api/admin/wolfbot-version-log').then(r => r.json()),
      fetch('/api/admin/wolfbot-reviews').then(r => r.json()),
    ]).then(([rows, logRows, reviewRows]) => {
      const map: Config = {}
      for (const row of (rows as { key: string; value: unknown }[])) map[row.key] = row.value
      setConfig(map)
      if (map['pixel_grid']) {
        const stored = map['pixel_grid'] as number[][]
        setGridText(gridToText(stored))
        setPreviewGrid(stored)
      }
      if (map['pixel_palette']) {
        setPalette(map['pixel_palette'] as Record<string, string>)
      }
      setLog(logRows)
      setReviews(Array.isArray(reviewRows) ? reviewRows : [])
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
    const grid = parseGridInput(gridText)
    if (!grid) {
      setGridError('Invalid grid — must be 25 rows of 25 integers (1–10). Accepts bracket or space-separated format.')
      return
    }
    setGridError('')
    setPreviewGrid(grid)
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

  if (loading) return (
    <main className="dash-main"><div className="dash-wrap"><p className="dash-empty">Loading…</p></div></main>
  )

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
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>Model</label>
              <select
                className="dash-config-textarea"
                style={{ width: '300px', fontFamily: 'var(--font-jetbrains)', cursor: 'pointer' }}
                defaultValue={(config['model'] as string) ?? 'claude-haiku-4-5-20251001'}
                onChange={e => save('model', e.target.value)}
              >
                {CLAUDE_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <SaveStatus k="model" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>Max tokens per review</label>
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
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>Context posts (recent journals fed to WOLF|BOT)</label>
              <input
                type="number"
                className="dash-config-textarea"
                style={{ width: '90px', fontFamily: 'inherit' }}
                defaultValue={(config['context_post_count'] as number) ?? 5}
                min={0}
                max={20}
                onBlur={e => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val) && val !== config['context_post_count']) save('context_post_count', val)
                }}
              />
              <SaveStatus k="context_post_count" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>Context day limit</label>
              <input
                type="number"
                className="dash-config-textarea"
                style={{ width: '90px', fontFamily: 'inherit' }}
                defaultValue={(config['context_day_limit'] as number) ?? 30}
                min={7}
                max={90}
                onBlur={e => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val) && val !== config['context_day_limit']) save('context_day_limit', val)
                }}
              />
              <SaveStatus k="context_day_limit" />
            </div>
          </div>
        </section>

        {/* ── Review Prompts ── */}
        {PROMPT_FIELDS.map(({ key, label, rows, def }) => (
          <section key={key} className="dash-section">
            <h2 className="dash-section-title">{label}</h2>
            <textarea
              className="dash-config-textarea"
              rows={rows}
              defaultValue={(config[key] as string) || def}
              onBlur={e => {
                const current = (config[key] as string) || def
                if (e.target.value !== current) save(key, e.target.value)
              }}
            />
            <SaveStatus k={key} />
          </section>
        ))}

        {/* ── Title Suggestion ── */}
        <section className="dash-section">
          <h2 className="dash-section-title">Title Suggestion</h2>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>
                Model (blank = use Review model)
              </label>
              <select
                className="dash-config-textarea"
                style={{ width: '300px', fontFamily: 'var(--font-jetbrains)', cursor: 'pointer' }}
                value={(config['title_model'] as string) ?? ''}
                onChange={e => {
                  setConfig(c => ({ ...c, title_model: e.target.value }))
                  save('title_model', e.target.value)
                }}
              >
                <option value="">— same as Review model —</option>
                {CLAUDE_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <SaveStatus k="title_model" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>Max tokens</label>
              <input
                type="number"
                className="dash-config-textarea"
                style={{ width: '110px', fontFamily: 'inherit' }}
                defaultValue={(config['title_max_tokens'] as number) ?? 25}
                onBlur={e => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val) && val !== config['title_max_tokens']) save('title_max_tokens', val)
                }}
              />
              <SaveStatus k="title_max_tokens" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>Max words</label>
              <input
                type="number"
                className="dash-config-textarea"
                style={{ width: '90px', fontFamily: 'inherit' }}
                defaultValue={(config['title_max_words'] as number) ?? 6}
                onBlur={e => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val) && val !== config['title_max_words']) save('title_max_words', val)
                }}
              />
              <SaveStatus k="title_max_words" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>Max characters</label>
              <input
                type="number"
                className="dash-config-textarea"
                style={{ width: '90px', fontFamily: 'inherit' }}
                defaultValue={(config['title_max_chars'] as number) ?? 50}
                onBlur={e => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val) && val !== config['title_max_chars']) save('title_max_chars', val)
                }}
              />
              <SaveStatus k="title_max_chars" />
            </div>
          </div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted, #909090)' }}>
            Prompt — use{' '}
            <code style={{ fontFamily: 'var(--font-jetbrains)' }}>{'{max_words}'}</code>
            {' '}and{' '}
            <code style={{ fontFamily: 'var(--font-jetbrains)' }}>{'{max_chars}'}</code>
            {' '}as placeholders
          </label>
          <textarea
            className="dash-config-textarea"
            rows={4}
            defaultValue={(config['title_prompt'] as string) || DEFAULT_TITLE_PROMPT}
            onBlur={e => {
              const current = (config['title_prompt'] as string) || DEFAULT_TITLE_PROMPT
              if (e.target.value !== current) save('title_prompt', e.target.value)
            }}
          />
          <SaveStatus k="title_prompt" />
        </section>

        {/* ── Pixel Art Grid ── */}
        <section className="dash-section">
          <h2 className="dash-section-title">Pixel Art Grid</h2>
          <p className="dash-muted" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            25×25 grid. Paste directly from your pixel art editor — accepts{' '}
            <code style={{ fontFamily: 'var(--font-jetbrains)' }}>[ [1,2,...], ... ]</code>{' '}
            bracket format or plain space-separated rows. Index 1 = transparent.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <textarea
              className="dash-config-textarea"
              rows={30}
              value={gridText}
              onChange={e => { setGridText(e.target.value); setGridError('') }}
              style={{
                fontFamily: 'var(--font-jetbrains)',
                fontSize: '0.6rem',
                lineHeight: 1.4,
                flex: '1 1 300px',
                whiteSpace: 'pre',
                overflowX: 'auto',
              }}
              spellCheck={false}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <p className="dash-muted" style={{ fontSize: '0.7rem' }}>Preview</p>
              <div style={{
                border: '1px solid rgba(128,128,128,0.2)',
                borderRadius: '6px',
                padding: '10px',
                background: 'rgba(0,0,0,0.04)',
              }}>
                <PixelPreview grid={previewGrid} palette={palette} size={150} />
              </div>
            </div>
          </div>
          {gridError && (
            <p style={{ color: '#A82020', fontSize: '0.8rem', marginTop: '0.5rem' }}>{gridError}</p>
          )}
          <button
            className="dash-link"
            style={{
              marginTop: '0.75rem',
              background: 'none',
              border: '1px solid currentColor',
              padding: '0.4rem 1rem',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onClick={saveGrid}
          >
            Save Grid &amp; Update Preview
          </button>
          <SaveStatus k="pixel_grid" />
        </section>

        {/* ── Pixel Palette ── */}
        <section className="dash-section">
          <h2 className="dash-section-title">Pixel Palette</h2>
          <p className="dash-muted" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            Index 1 is always transparent. Colour changes save on blur and refresh the preview.
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
                    <span className="dash-muted" style={{ fontSize: '0.7rem' }}>{PALETTE_LABELS[parseInt(idxStr)]}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <SaveStatus k="pixel_palette" />
        </section>

        <p className="dash-muted" style={{ fontSize: '0.75rem', marginTop: '1rem' }}>
          Prompts and AI settings save on blur (auto-increments WOLF BRAIN version). Pixel grid saves on button click.
        </p>

        {/* ── Recent Reviews ── */}
        {reviews.length > 0 && (
          <section className="dash-section">
            <h2 className="dash-section-title">Recent Reviews</h2>
            <p className="dash-muted" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>
              Click a row to inspect its journalContext data.
            </p>
            <table className="dash-table">
              <thead>
                <tr><th>Date</th><th>Title</th><th>Mood</th><th>Themes</th><th>Context</th></tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedReview(expandedReview === r.id ? null : r.id)}>
                    <td className="dash-muted" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(r.postDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.postTitle}</td>
                    <td>
                      {r.moodSignal && <span className="dash-badge dash-badge--post">{r.moodSignal}</span>}
                    </td>
                    <td className="dash-muted" style={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.themeWords}
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>
                      {r.journalContext ? '✓' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expandedReview && (() => {
              const r = reviews.find(rv => rv.id === expandedReview)
              if (!r) return null
              return (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.04)', borderRadius: 8, border: '1px solid rgba(74,127,165,0.15)' }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{r.postTitle} — {r.postDate}</p>
                  {r.review && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p className="dash-muted" style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>Review</p>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{r.review}</p>
                    </div>
                  )}
                  <p className="dash-muted" style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>Journal Context</p>
                  <pre style={{
                    fontFamily: 'var(--font-jetbrains)', fontSize: '0.75rem', lineHeight: 1.5,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    background: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: 6,
                  }}>
                    {r.journalContext ? JSON.stringify(r.journalContext, null, 2) : 'null — no journalContext generated for this review'}
                  </pre>
                  <p className="dash-muted" style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>
                    Model: {r.modelUsed} · In: {r.inputTokensTotal} · Out: {r.outputTokensTotal}
                  </p>
                </div>
              )
            })()}
          </section>
        )}

        {/* ── Version Log ── */}
        {log.length > 0 && (
          <section className="dash-section">
            <h2 className="dash-section-title">Version Log</h2>
            <table className="dash-table">
              <thead>
                <tr><th>Version</th><th>Key changed</th><th>Date</th></tr>
              </thead>
              <tbody>
                {log.map(entry => (
                  <tr key={entry.id}>
                    <td><span className="dash-badge dash-badge--post">v{entry.version}</span></td>
                    <td className="dash-muted" style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '0.8rem' }}>{entry.keyChanged}</td>
                    <td className="dash-muted">
                      {new Date(entry.changedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
