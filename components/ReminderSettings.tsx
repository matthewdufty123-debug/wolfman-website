'use client'

import { useState, useEffect } from 'react'

export default function ReminderSettings() {
  const [enabled, setEnabled] = useState(false)
  const [time, setTime] = useState('07:00')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/user/reminders')
      .then(r => r.json())
      .then(data => {
        setEnabled(data.morningReminderEnabled ?? false)
        setTime(data.morningReminderTime ?? '07:00')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const res = await fetch('/api/user/reminders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, time: enabled ? time : null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Something went wrong.')
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <form className="account-form" onSubmit={handleSave}>
      <div className="reminder-toggle-row">
        <label className="reminder-toggle-label" htmlFor="reminder-enabled">
          Morning reminder email
        </label>
        <button
          id="reminder-enabled"
          type="button"
          role="switch"
          aria-checked={enabled}
          className={`reminder-toggle${enabled ? ' reminder-toggle--on' : ''}`}
          onClick={() => setEnabled(v => !v)}
        >
          <span className="reminder-toggle-thumb" />
        </button>
      </div>

      {enabled && (
        <>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reminder-time">Send at</label>
            <input
              id="reminder-time"
              type="time"
              className="auth-input"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
            />
          </div>
          <p className="settings-reminder-note">
            Uses your timezone setting above. You&apos;ll receive a single email each morning
            if you haven&apos;t journalled yet that day.
          </p>
        </>
      )}

      {saved && <p className="auth-success">Saved.</p>}
      {error && <p className="auth-error">{error}</p>}

      <button type="submit" className="auth-submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
