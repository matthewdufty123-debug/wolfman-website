'use client'

import { useState, useEffect } from 'react'

export default function TelegramPromptSettings() {
  const [enabled, setEnabled] = useState(false)
  const [morningTime, setMorningTime] = useState('07:00')
  const [middayEnabled, setMiddayEnabled] = useState(true)
  const [eveningEnabled, setEveningEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/user/telegram-prompts')
      .then(r => r.json())
      .then(data => {
        setEnabled(data.enabled ?? false)
        setMorningTime(data.morningTime ?? '07:00')
        setMiddayEnabled(data.middayEnabled ?? true)
        setEveningEnabled(data.eveningEnabled ?? true)
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
      const res = await fetch('/api/user/telegram-prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, morningTime, middayEnabled, eveningEnabled }),
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
        <label className="reminder-toggle-label" htmlFor="tg-prompts-enabled">
          Telegram check-ins
        </label>
        <button
          id="tg-prompts-enabled"
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
            <label className="auth-label" htmlFor="tg-morning-time">Morning prompt at</label>
            <input
              id="tg-morning-time"
              type="time"
              className="auth-input"
              value={morningTime}
              onChange={e => setMorningTime(e.target.value)}
              required
            />
          </div>

          <div className="reminder-toggle-row" style={{ marginTop: '0.75rem' }}>
            <label className="reminder-toggle-label" htmlFor="tg-midday">
              Midday check-in (13:00)
            </label>
            <button
              id="tg-midday"
              type="button"
              role="switch"
              aria-checked={middayEnabled}
              className={`reminder-toggle${middayEnabled ? ' reminder-toggle--on' : ''}`}
              onClick={() => setMiddayEnabled(v => !v)}
            >
              <span className="reminder-toggle-thumb" />
            </button>
          </div>

          <div className="reminder-toggle-row" style={{ marginTop: '0.5rem' }}>
            <label className="reminder-toggle-label" htmlFor="tg-evening">
              Evening reflection (20:00)
            </label>
            <button
              id="tg-evening"
              type="button"
              role="switch"
              aria-checked={eveningEnabled}
              className={`reminder-toggle${eveningEnabled ? ' reminder-toggle--on' : ''}`}
              onClick={() => setEveningEnabled(v => !v)}
            >
              <span className="reminder-toggle-thumb" />
            </button>
          </div>

          <p className="settings-reminder-note">
            Uses your timezone setting. The bot sends a personalised prompt at each time — tap a button to log your response.
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
