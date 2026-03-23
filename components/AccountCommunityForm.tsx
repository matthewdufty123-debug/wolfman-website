'use client'

import { useState } from 'react'

interface Props {
  communityEnabled: boolean
  defaultPublic: boolean
}

export default function AccountCommunityForm({ communityEnabled: initial, defaultPublic: initialDefault }: Props) {
  const [communityEnabled, setCommunityEnabled] = useState(initial)
  const [defaultPublic, setDefaultPublic] = useState(initialDefault)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function save(nextEnabled: boolean, nextDefault: boolean) {
    setSaving(true)
    setSaved(false)
    setError('')

    try {
      const res = await fetch('/api/user/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityEnabled: nextEnabled, defaultPublic: nextDefault }),
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

  function handleCommunityChange(value: boolean) {
    const nextDefault = value ? defaultPublic : false
    setCommunityEnabled(value)
    if (!value) setDefaultPublic(false)
    save(value, nextDefault)
  }

  function handleDefaultChange(value: boolean) {
    setDefaultPublic(value)
    save(communityEnabled, value)
  }

  return (
    <div className="community-form">
      <label className="community-toggle-row">
        <span className="community-toggle-label">
          Share my journals with the community
        </span>
        <button
          type="button"
          className={`community-toggle${communityEnabled ? ' is-on' : ''}`}
          onClick={() => handleCommunityChange(!communityEnabled)}
          disabled={saving}
          aria-pressed={communityEnabled}
        >
          <span className="community-toggle-knob" />
        </button>
      </label>

      {communityEnabled && (
        <label className="community-toggle-row community-toggle-row--sub">
          <span className="community-toggle-label">
            New journals are public by default
          </span>
          <button
            type="button"
            className={`community-toggle${defaultPublic ? ' is-on' : ''}`}
            onClick={() => handleDefaultChange(!defaultPublic)}
            disabled={saving}
            aria-pressed={defaultPublic}
          >
            <span className="community-toggle-knob" />
          </button>
        </label>
      )}

      {saved && <p className="community-saved">Saved.</p>}
      {error && <p className="community-error">{error}</p>}
    </div>
  )
}
