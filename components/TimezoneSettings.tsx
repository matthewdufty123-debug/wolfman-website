'use client'

import { useState, useEffect } from 'react'
import { TIMEZONES, detectTimezone } from '@/lib/timezones'

export default function TimezoneSettings() {
  const [timezone, setTimezone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/user/timezone')
      .then(r => r.json())
      .then(data => {
        setTimezone(data.timezone ?? detectTimezone())
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
      const res = await fetch('/api/user/timezone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone }),
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
      <div className="auth-field">
        <label className="auth-label" htmlFor="user-tz">Your timezone</label>
        <select
          id="user-tz"
          className="auth-input auth-select"
          value={timezone}
          onChange={e => setTimezone(e.target.value)}
          required
        >
          {!TIMEZONES.includes(timezone) && timezone && (
            <option value={timezone}>{timezone.replace(/_/g, ' ')}</option>
          )}
          {TIMEZONES.map(tz => (
            <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {saved && <p className="auth-success">Saved.</p>}
      {error && <p className="auth-error">{error}</p>}

      <button type="submit" className="auth-submit" disabled={saving}>
        {saving ? 'Saving\u2026' : 'Save'}
      </button>
    </form>
  )
}
