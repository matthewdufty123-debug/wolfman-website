'use client'

import { useState, useEffect } from 'react'

// Common IANA timezones for the dropdown — covers the majority of users
const TIMEZONES = [
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Warsaw',
  'Europe/Lisbon',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Athens',
  'Europe/Bucharest',
  'Europe/Istanbul',
  'Europe/Moscow',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Lima',
  'America/Halifax',
  'Atlantic/Reykjavik',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Karachi',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
  'Pacific/Honolulu',
]

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'Europe/London'
  }
}

export default function ReminderSettings() {
  const [enabled, setEnabled] = useState(false)
  const [time, setTime] = useState('07:00')
  const [timezone, setTimezone] = useState('')
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
        setTimezone(data.morningReminderTimezone ?? detectTimezone())
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
        body: JSON.stringify({ enabled, time: enabled ? time : null, timezone: enabled ? timezone : null }),
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
          <div className="auth-field">
            <label className="auth-label" htmlFor="reminder-tz">Timezone</label>
            <select
              id="reminder-tz"
              className="auth-input auth-select"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              required
            >
              {!TIMEZONES.includes(timezone) && timezone && (
                <option value={timezone}>{timezone}</option>
              )}
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <p className="settings-reminder-note">
            You'll receive a single email each morning if you haven't journalled yet that day.
            No reminder is sent on days you've already posted.
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
