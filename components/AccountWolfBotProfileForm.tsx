'use client'

import { useState } from 'react'

interface Props {
  profession: string
  humourSource: string
}

export default function AccountWolfBotProfileForm({ profession: initial, humourSource: initialHumour }: Props) {
  const [profession, setProfession] = useState(initial)
  const [humourSource, setHumourSource] = useState(initialHumour)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profession, humourSource }),
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

  return (
    <form className="account-wolfbot-form" onSubmit={handleSubmit}>
      <div className="account-field">
        <label className="account-field-label" htmlFor="wb-profession">Profession</label>
        <input
          id="wb-profession"
          type="text"
          className="account-field-input"
          value={profession}
          onChange={e => setProfession(e.target.value)}
          placeholder="e.g. software engineer, teacher, nurse…"
          maxLength={120}
        />
      </div>
      <div className="account-field">
        <label className="account-field-label" htmlFor="wb-humour">Where you find humour</label>
        <input
          id="wb-humour"
          type="text"
          className="account-field-input"
          value={humourSource}
          onChange={e => setHumourSource(e.target.value)}
          placeholder="e.g. dry sarcasm, absurdist comedy, dad jokes…"
          maxLength={120}
        />
      </div>
      {saved && <p className="community-saved">Saved.</p>}
      {error && <p className="community-error">{error}</p>}
      <button type="submit" className="account-save-btn" disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
