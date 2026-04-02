'use client'

import { useState } from 'react'

const RELEASE_OPTIONS = [
  { value: 'closed_alpha_dev',   label: 'Closed Alpha Development',    phase: 'closed_alpha' },
  { value: 'release_0_1',        label: 'Release 0.1 — Journaling',    phase: 'open_beta' },
  { value: 'release_0_2',        label: 'Release 0.2 — WOLF|BOT',      phase: 'open_beta' },
  { value: 'release_0_3',        label: 'Release 0.3 — Communities',   phase: 'open_beta' },
  { value: 'release_0_4',        label: 'Release 0.4 — Rituals',       phase: 'open_beta' },
  { value: 'release_0_5',        label: 'Release 0.5 — Statistics',    phase: 'open_beta' },
  { value: 'release_0_6',        label: 'Release 0.6 — Achievements',  phase: 'open_beta' },
  { value: 'release_0_7',        label: 'Release 0.7 — Shop',          phase: 'open_beta' },
  { value: 'release_0_8',        label: 'Release 0.8 — Subscriptions', phase: 'open_beta' },
  { value: 'release_0_9',        label: 'Release 0.9 — Legal',         phase: 'open_beta' },
]

// Format local datetime for the input default (no seconds, no Z)
function localDatetimeValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function VersionLogForm({ onSaved }: { onSaved?: () => void }) {
  const [open, setOpen] = useState(false)
  const [releaseKey, setReleaseKey] = useState('closed_alpha_dev')
  const [version, setVersion] = useState('')
  const [summary, setSummary] = useState('')
  const [changesText, setChangesText] = useState('')
  const [commitText, setCommitText] = useState('')
  const [deployedAt, setDeployedAt] = useState(localDatetimeValue(new Date()))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')

    const selected = RELEASE_OPTIONS.find(r => r.value === releaseKey)!
    const commitHashes = commitText
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
    const changes = changesText
      .split('\n')
      .map(s => s.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean)

    try {
      const res = await fetch('/api/admin/version-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          releasePhase: selected.phase,
          releaseName: selected.label,
          commitHashes,
          summary,
          changes,
          deployedAt: new Date(deployedAt).toISOString(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Save failed')
      } else {
        setSaved(true)
        setVersion('')
        setSummary('')
        setChangesText('')
        setCommitText('')
        setDeployedAt(localDatetimeValue(new Date()))
        setTimeout(() => setSaved(false), 3000)
        onSaved?.()
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="dash-section">
      <button className="dash-section-title dash-toggle-btn" onClick={() => setOpen(o => !o)}>
        Log version entry {open ? '−' : '+'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="dash-config-form" style={{ marginTop: '1rem' }}>
          <div className="dash-config-row">
            <label className="dash-config-label">Release</label>
            <select
              className="dash-config-select"
              value={releaseKey}
              onChange={e => setReleaseKey(e.target.value)}
            >
              {RELEASE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="dash-config-row">
            <label className="dash-config-label">Version number <span className="dash-config-hint">e.g. 0.1.1.0</span></label>
            <input
              type="text"
              className="dash-config-input"
              placeholder="0.1.0.0"
              value={version}
              onChange={e => setVersion(e.target.value)}
              required
            />
          </div>

          <div className="dash-config-row">
            <label className="dash-config-label">Summary <span className="dash-config-hint">one-line description</span></label>
            <input
              type="text"
              className="dash-config-input"
              placeholder="Added morning reminder email opt-in"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              required
            />
          </div>

          <div className="dash-config-row">
            <label className="dash-config-label">Changes <span className="dash-config-hint">one bullet per line</span></label>
            <textarea
              className="dash-config-textarea"
              placeholder={"Morning reminder toggle on /settings\nHMAC-signed unsubscribe link\nVercel cron every 15 min"}
              value={changesText}
              onChange={e => setChangesText(e.target.value)}
              rows={5}
            />
          </div>

          <div className="dash-config-row">
            <label className="dash-config-label">Commit hashes <span className="dash-config-hint">comma or newline separated, short or full</span></label>
            <textarea
              className="dash-config-textarea"
              placeholder={"4c3413b\n96499a5"}
              value={commitText}
              onChange={e => setCommitText(e.target.value)}
              rows={3}
            />
          </div>

          <div className="dash-config-row">
            <label className="dash-config-label">Deployed at</label>
            <input
              type="datetime-local"
              className="dash-config-input"
              value={deployedAt}
              onChange={e => setDeployedAt(e.target.value)}
              required
            />
          </div>

          <div className="dash-config-actions">
            <button type="submit" className="dash-action-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Log version'}
            </button>
            {saved && <span className="dash-config-saved">Logged</span>}
            {error && <span className="dash-config-error">{error}</span>}
          </div>
        </form>
      )}
    </section>
  )
}
