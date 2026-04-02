'use client'

import { useState } from 'react'
import type { SiteConfig, SiteStatus } from '@/lib/site-config'

const STATUS_LABELS: Record<SiteStatus, string> = {
  closed_alpha: 'Closed Alpha — no new registrations',
  closed_beta:  'Closed Beta — coming soon, shows countdown',
  open_beta:    'Open Beta — registrations open up to cap',
  live:         'Live — fully open (cap still applies if set)',
}

const RELEASE_OPTIONS = [
  { value: 'closed_alpha_dev',   label: 'Closed Alpha Development' },
  { value: 'release_0_1',        label: 'Release 0.1 — Journaling' },
  { value: 'release_0_2',        label: 'Release 0.2 — WOLF|BOT' },
  { value: 'release_0_3',        label: 'Release 0.3 — Communities' },
  { value: 'release_0_4',        label: 'Release 0.4 — Rituals' },
  { value: 'release_0_5',        label: 'Release 0.5 — Statistics' },
  { value: 'release_0_6',        label: 'Release 0.6 — Achievements' },
  { value: 'release_0_7',        label: 'Release 0.7 — Shop' },
  { value: 'release_0_8',        label: 'Release 0.8 — Subscriptions' },
  { value: 'release_0_9',        label: 'Release 0.9 — Legal' },
]

export default function SiteConfigPanel({ initial }: { initial: SiteConfig }) {
  const [status, setStatus] = useState<SiteStatus>(initial.status)
  const [userCap, setUserCap] = useState<string>(initial.userCap?.toString() ?? '')
  const [statusMessage, setStatusMessage] = useState(initial.statusMessage ?? '')
  const [currentRelease, setCurrentRelease] = useState(initial.currentRelease ?? 'closed_alpha_dev')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          userCap: userCap === '' ? null : Number(userCap),
          statusMessage: statusMessage || null,
          currentRelease,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Save failed')
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="dash-section">
      <h2 className="dash-section-title">Site status</h2>
      <form onSubmit={handleSave} className="dash-config-form">
        <div className="dash-config-row">
          <label className="dash-config-label">Status</label>
          <select
            className="dash-config-select"
            value={status}
            onChange={e => setStatus(e.target.value as SiteStatus)}
          >
            {(Object.entries(STATUS_LABELS) as [SiteStatus, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div className="dash-config-row">
          <label className="dash-config-label">User cap</label>
          <input
            type="number"
            className="dash-config-input"
            placeholder="e.g. 51 — leave blank for unlimited"
            value={userCap}
            onChange={e => setUserCap(e.target.value)}
            min={1}
          />
        </div>

        <div className="dash-config-row">
          <label className="dash-config-label">Active release</label>
          <select
            className="dash-config-select"
            value={currentRelease}
            onChange={e => setCurrentRelease(e.target.value)}
          >
            {RELEASE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="dash-config-row">
          <label className="dash-config-label">Custom message <span className="dash-config-hint">(optional — overrides default closed/full text)</span></label>
          <input
            type="text"
            className="dash-config-input"
            placeholder="Leave blank for default message"
            value={statusMessage}
            onChange={e => setStatusMessage(e.target.value)}
          />
        </div>

        <div className="dash-config-actions">
          <button type="submit" className="dash-action-btn" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="dash-config-saved">Saved</span>}
          {error && <span className="dash-config-error">{error}</span>}
        </div>
      </form>
    </section>
  )
}
