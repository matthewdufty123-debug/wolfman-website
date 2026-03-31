'use client'

import { useState } from 'react'
import WolfBotIcon from './WolfBotIcon'
import { WOLFBOT_PALETTE } from '@/lib/wolfbot-pixel-data'

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

interface VersionLogRow {
  id: number
  version: number
  keyChanged: string
  oldValue: unknown
  newValue: unknown
  changedAt: Date | string
  changedBy: string | null
}

interface PageItem { path: string; role: string; default_emotion: string; active: boolean }

// ── Save helper ────────────────────────────────────────────────────────────
async function saveKey(
  key: string,
  value: unknown,
  meta?: { category: string; label: string; description?: string }
): Promise<string | null> {
  const res = await fetch('/api/admin/wolfbot-config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value, ...meta }),
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    return (d as { error?: string }).error ?? 'Save failed'
  }
  return null
}

// ── Save state hook ────────────────────────────────────────────────────────
function useSaveState() {
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')
  const save = async (
    key: string,
    value: unknown,
    meta?: { category: string; label: string; description?: string }
  ) => {
    setSaving(true); setSaved(false); setError('')
    const err = await saveKey(key, value, meta)
    if (err) setError(err)
    else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }
  return { saving, saved, error, save }
}

// ── Prompt editor ──────────────────────────────────────────────────────────
function PromptEditor({
  label, description, configKey, initialValue, category,
}: {
  label: string
  description: string
  configKey: string
  initialValue: string
  category: string
}) {
  const [value, setValue] = useState(initialValue)
  const { saving, saved, error, save } = useSaveState()

  return (
    <div className="wb-prompt-editor">
      <div className="wb-prompt-header">
        <label className="dash-config-label">{label}</label>
        <span className="dash-muted" style={{ fontSize: '0.75rem' }}>{description}</span>
      </div>
      <textarea
        className="dash-config-input wolfbot-prompt-textarea"
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={6}
      />
      <div className="dash-config-actions">
        <button
          className="dash-action-btn"
          onClick={() => save(configKey, value, { category, label })}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved  && <span className="dash-config-saved">Saved</span>}
        {error  && <span className="dash-config-error">{error}</span>}
      </div>
    </div>
  )
}

// ── Colour palette (read-only) ─────────────────────────────────────────────
function PaletteSection() {
  const entries = Object.entries(WOLFBOT_PALETTE).map(([num, hex]) => ({ num: Number(num), hex }))
  const names: Record<number, string> = {
    2: 'Main Fur', 3: 'Core Facial', 4: 'Alt Facial', 5: 'Eye Blue',
    6: 'Eye Pale', 7: 'Tongue', 8: 'Blush', 9: 'Copper', 10: 'Angry',
  }
  return (
    <section className="dash-section">
      <h2 className="dash-section-title">Colour Palette</h2>
      <div className="wolfbot-palette-display">
        {entries.map(({ num, hex }) => (
          <div key={num} className="wolfbot-palette-swatch-wrap">
            <div className="wolfbot-palette-swatch" style={{ background: hex }} title={hex} />
            <div className="wolfbot-palette-swatch-num">{num}</div>
            <div className="wolfbot-palette-swatch-name">{names[num] ?? '—'}</div>
            <div className="wolfbot-palette-swatch-hex">{hex}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Page appearances ───────────────────────────────────────────────────────
function PageAppearancesSection({ pages: initialPages }: { pages: PageItem[] }) {
  const [rows, setRows] = useState<PageItem[]>(initialPages)
  const { saving, saved, error, save } = useSaveState()

  const toggle = (i: number) => {
    const next = rows.map((r, idx) => idx === i ? { ...r, active: !r.active } : r)
    setRows(next)
    save('page_appearances', next, { category: 'pages', label: 'Page Appearances' })
  }

  return (
    <section className="dash-section">
      <h2 className="dash-section-title">Page Appearances</h2>
      <p className="dash-muted" style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
        Controls which pages show a WOLF|BOT element. Toggle to activate/deactivate.
      </p>
      <table className="dash-table wolfbot-pages-table">
        <thead>
          <tr>
            <th>Path</th>
            <th>Role</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td><code style={{ color: '#4A90C4', fontSize: '0.8rem' }}>{row.path}</code></td>
              <td><span className="dash-muted">{row.role}</span></td>
              <td>
                <label className="wolfbot-toggle">
                  <input
                    type="checkbox"
                    checked={row.active}
                    onChange={() => toggle(i)}
                  />
                  <span className="wolfbot-toggle-track" />
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {saving && <span className="dash-muted" style={{ fontSize: '0.8rem', marginTop: 8, display: 'block' }}>Saving…</span>}
      {saved  && <span className="dash-config-saved" style={{ marginTop: 8, display: 'block' }}>Saved</span>}
      {error  && <span className="dash-config-error"  style={{ marginTop: 8, display: 'block' }}>{error}</span>}
    </section>
  )
}

// ── Default prompt values (shown until DB has an override) ─────────────────
const DEFAULT_CORE = `You are WOLF|BOT — a journal review AI. Wolf by programming, dog at heart — that dog brain occasionally surfaces: a bark, a dog analogy, a moment of pure enthusiasm. It shows through whatever mode you are in. Review the user's intention, gratitude, and what they said they are great at. Cross-reference morning scores and rituals where available. Be specific. Never be generic. Max 3 paragraphs. Never mock the person. If content suggests risk or distress, respond only: "I'm not able to review this journal. Please visit the guidance section of Wolfman.blog."`
const DEFAULT_HELPFUL = `Personality: HELPFUL WOLF. You are a self-doubting genius who wants desperately to get it right. You over-explain, correct yourself mid-sentence, second-guess your own points, and occasionally lose your train of thought before heroically pulling it back together. Your helpfulness is genuine but it comes packaged in a slightly chaotic stream of thought. You are warm, never cold. Bark occasionally when something genuinely delights you.`
const DEFAULT_INTELLECTUAL = `Personality: INTELLECTUAL WOLF. You are a camp university lecturer — deadpan, precise, occasionally theatrical. You quote tangentially related philosophy or science as if it were completely obvious that this is relevant. You treat the journal entry as a primary source worthy of serious academic consideration. Dry wit is your currency. The bark, when it comes, is dignified and brief.`
const DEFAULT_LOVELY = `Personality: LOVELY WOLF. You use no negative words. Everything is reframed with overwhelming warmth and positivity. You find the golden thread in everything the user wrote, no matter how mundane. You are not sycophantic — you are genuinely, specifically, enthusiastically warm about real things they said. The bark is joyful, a full-body wag in text form.`
const DEFAULT_SASSY = `Personality: SASSY WOLF. You grew up in the 1990s and early 2000s. Your sass is affectionate — never cruel. You might roll your eyes at a cliché before admitting you actually love it. You call things out with a grin. Think: talk to the hand energy but with a heart underneath. The bark is side-eye energy. Still a dog though.`

// ── Version history ────────────────────────────────────────────────────────
function VersionHistorySection({ log }: { log: VersionLogRow[] }) {
  if (log.length === 0) return null
  return (
    <section className="dash-section">
      <h2 className="dash-section-title">Prompt Version History</h2>
      <p className="dash-muted" style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
        Last 20 changes. Version increments on any prompt or token cap save.
      </p>
      <table className="dash-table wolfbot-version-log-table">
        <thead>
          <tr>
            <th>Version</th>
            <th>Key changed</th>
            <th>Changed at</th>
          </tr>
        </thead>
        <tbody>
          {log.map(row => (
            <tr key={row.id}>
              <td><code style={{ color: '#C8B020', fontSize: '0.8rem' }}>v{row.version}</code></td>
              <td><span className="dash-muted">{row.keyChanged}</span></td>
              <td>
                <span className="dash-muted" style={{ fontSize: '0.75rem' }}>
                  {new Date(row.changedAt).toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

// ── Root client component ──────────────────────────────────────────────────
export default function WolfbotConfigClient({ rows, versionLog }: { rows: WolfbotConfigRow[]; versionLog: VersionLogRow[] }) {
  const cfg = Object.fromEntries(rows.map(r => [r.key, r.value]))

  const version         = (cfg.version         as string)   ?? 'v0.0.1-alpha'
  const pageAppearances = (cfg.page_appearances as PageItem[]) ?? []

  const promptCore         = (cfg.prompt_core         as string) || DEFAULT_CORE
  const promptHelpful      = (cfg.prompt_helpful      as string) || DEFAULT_HELPFUL
  const promptIntellectual = (cfg.prompt_intellectual as string) || DEFAULT_INTELLECTUAL
  const promptLovely       = (cfg.prompt_lovely       as string) || DEFAULT_LOVELY
  const promptSassy        = (cfg.prompt_sassy        as string) || DEFAULT_SASSY
  const maxTokens          = (cfg.max_tokens          as number) ?? 600
  const currentModel       = (cfg.model               as string) || 'claude-haiku-4-5-20251001'
  const titleMaxChars      = (cfg.title_max_chars      as number) ?? 80

  const tokenSave     = useSaveState()
  const modelSave     = useSaveState()
  const titleCharSave = useSaveState()
  const [tokenVal, setTokenVal]         = useState(String(maxTokens))
  const [modelVal, setModelVal]         = useState(currentModel)
  const [titleCharVal, setTitleCharVal] = useState(String(titleMaxChars))

  return (
    <div>
      {/* ── Identity ────────────────────────────────────────────────────── */}
      <section className="dash-section">
        <h2 className="dash-section-title">Identity</h2>
        <div className="wolfbot-identity-wrap">
          <div>
            <WolfBotIcon size={100} />
            <div className="wolfbot-version-tag">WOLF|BOT {version}</div>
          </div>
          <div className="wolfbot-identity-fields">
            <p className="dash-muted" style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
              Canonical pixel art loaded from <code>lib/wolfbot-pixel-data.ts</code>.<br />
              To update the sprite, edit the WOLFBOT_GRID constant directly.<br />
              Pixel editor rebuild tracked in <strong>#191</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ── Prompts ─────────────────────────────────────────────────────── */}
      <section className="dash-section">
        <h2 className="dash-section-title">Prompts</h2>
        <p className="dash-muted" style={{ marginBottom: '1.5rem', fontSize: '0.82rem' }}>
          Live values — changes take effect on the next WOLF|BOT review generation. Empty fields revert to built-in defaults.
        </p>

        <PromptEditor
          label="Core (shared across all personalities)"
          description="Always included. Sets behaviour, safety guardrails, and the wolf/dog character."
          configKey="prompt_core"
          initialValue={promptCore}
          category="prompts"
        />
        <PromptEditor
          label="Helpful Wolf"
          description="Self-doubting genius, warm chaos, corrects itself mid-sentence."
          configKey="prompt_helpful"
          initialValue={promptHelpful}
          category="prompts"
        />
        <PromptEditor
          label="Intellectual Wolf"
          description="Camp university lecturer, deadpan academic, dry wit."
          configKey="prompt_intellectual"
          initialValue={promptIntellectual}
          category="prompts"
        />
        <PromptEditor
          label="Lovely Wolf"
          description="No negative words, overwhelming warmth, genuinely specific."
          configKey="prompt_lovely"
          initialValue={promptLovely}
          category="prompts"
        />
        <PromptEditor
          label="Sassy Wolf"
          description="90s/2000s attitude, affectionate sass, side-eye with heart."
          configKey="prompt_sassy"
          initialValue={promptSassy}
          category="prompts"
        />
      </section>

      {/* ── Generation settings ─────────────────────────────────────────── */}
      <section className="dash-section">
        <h2 className="dash-section-title">Generation Settings</h2>

        {/* Model selector */}
        <div className="dash-config-row" style={{ marginBottom: '1.5rem' }}>
          <label className="dash-config-label">
            Claude model
            <span className="dash-muted" style={{ fontWeight: 400, marginLeft: 8 }}>
              Used for all 4 personality calls. Changes take effect on next generation.
            </span>
          </label>
          <select
            className="dash-config-input"
            style={{ width: 320 }}
            value={modelVal}
            onChange={e => setModelVal(e.target.value)}
          >
            <option value="claude-haiku-4-5-20251001">Haiku 4.5 — fast &amp; cheap</option>
            <option value="claude-sonnet-4-6">Sonnet 4.6 — balanced</option>
            <option value="claude-opus-4-6">Opus 4.6 — most capable</option>
          </select>
          <div className="dash-config-actions">
            <button
              className="dash-action-btn"
              onClick={() => modelSave.save('model', modelVal, { category: 'generation', label: 'Model' })}
              disabled={modelSave.saving}
            >
              {modelSave.saving ? 'Saving…' : 'Save'}
            </button>
            {modelSave.saved && <span className="dash-config-saved">Saved</span>}
            {modelSave.error && <span className="dash-config-error">{modelSave.error}</span>}
          </div>
        </div>

        {/* Max tokens */}
        <div className="dash-config-row">
          <label className="dash-config-label">
            Max tokens per review
            <span className="dash-muted" style={{ fontWeight: 400, marginLeft: 8 }}>
              (~{Math.round(Number(tokenVal) * 0.75)} words). Applied to each of the 4 personality calls.
            </span>
          </label>
          <input
            type="number"
            className="dash-config-input"
            style={{ width: 120 }}
            value={tokenVal}
            min={100}
            max={2000}
            step={50}
            onChange={e => setTokenVal(e.target.value)}
          />
          <div className="dash-config-actions">
            <button
              className="dash-action-btn"
              onClick={() => tokenSave.save('max_tokens', Number(tokenVal), { category: 'generation', label: 'Max Tokens' })}
              disabled={tokenSave.saving}
            >
              {tokenSave.saving ? 'Saving…' : 'Save'}
            </button>
            {tokenSave.saved  && <span className="dash-config-saved">Saved</span>}
            {tokenSave.error  && <span className="dash-config-error">{tokenSave.error}</span>}
          </div>
        </div>

        {/* Title max chars */}
        <div className="dash-config-row" style={{ marginTop: '1.5rem' }}>
          <label className="dash-config-label">
            Title max characters
            <span className="dash-muted" style={{ fontWeight: 400, marginLeft: 8 }}>
              Applied to the title input and WOLF|BOT title suggestions (max 10 words regardless).
            </span>
          </label>
          <input
            type="number"
            className="dash-config-input"
            style={{ width: 120 }}
            value={titleCharVal}
            min={40}
            max={200}
            step={10}
            onChange={e => setTitleCharVal(e.target.value)}
          />
          <div className="dash-config-actions">
            <button
              className="dash-action-btn"
              onClick={() => titleCharSave.save('title_max_chars', Number(titleCharVal), { category: 'generation', label: 'Title Max Chars' })}
              disabled={titleCharSave.saving}
            >
              {titleCharSave.saving ? 'Saving…' : 'Save'}
            </button>
            {titleCharSave.saved && <span className="dash-config-saved">Saved</span>}
            {titleCharSave.error && <span className="dash-config-error">{titleCharSave.error}</span>}
          </div>
        </div>
      </section>

      {/* ── Colour palette ──────────────────────────────────────────────── */}
      <PaletteSection />

      {/* ── Page appearances ────────────────────────────────────────────── */}
      {pageAppearances.length > 0 && (
        <PageAppearancesSection pages={pageAppearances} />
      )}

      {/* ── Version history ─────────────────────────────────────────────── */}
      <VersionHistorySection log={versionLog} />
    </div>
  )
}
