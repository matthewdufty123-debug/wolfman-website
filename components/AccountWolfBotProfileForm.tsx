'use client'

import { useState } from 'react'

const PROFESSIONS = [
  'Data & Analytics',
  'Software Engineering',
  'Product & Design',
  'Marketing & Communications',
  'Healthcare & Medicine',
  'Education & Teaching',
  'Entrepreneur / Founder',
  'Finance & Accounting',
  'Legal & Compliance',
  'Creative (Writing, Art, Music)',
  'Operations & Management',
  'Sales & Business Development',
  'Engineering (Civil, Mechanical, Electrical)',
  'Trades & Skilled Work',
  'Retired / Between roles',
  'Other',
]

const HUMOUR_STYLES = [
  'Dry & deadpan',
  'Self-deprecating',
  'Absurdist & surreal',
  'Sarcastic & witty',
  'Warm & wholesome',
  'Other',
]

interface Props {
  profession: string
  humourSource: string
}

export default function AccountWolfBotProfileForm({ profession: initial, humourSource: initialHumour }: Props) {
  const [profession, setProfession] = useState(PROFESSIONS.includes(initial) ? initial : '')
  const [humourSource, setHumourSource] = useState(HUMOUR_STYLES.includes(initialHumour) ? initialHumour : '')
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
    <form className="account-form" onSubmit={handleSubmit}>
      <div className="auth-field">
        <label className="auth-label" htmlFor="wb-profession">Profession</label>
        <select
          id="wb-profession"
          className="auth-input auth-select"
          value={profession}
          onChange={e => setProfession(e.target.value)}
        >
          <option value="">Select your profession</option>
          {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="wb-humour">Where you find humour</label>
        <select
          id="wb-humour"
          className="auth-input auth-select"
          value={humourSource}
          onChange={e => setHumourSource(e.target.value)}
        >
          <option value="">Select your humour style</option>
          {HUMOUR_STYLES.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
      {saved && <p className="auth-success">Saved.</p>}
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="auth-submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
