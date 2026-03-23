'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  username: string | null
}

export default function OnboardingForm({ username }: Props) {
  const router = useRouter()
  const [communityEnabled, setCommunityEnabled] = useState(false)
  const [defaultPublic, setDefaultPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityEnabled, defaultPublic }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSaving(false)
        return
      }

      // Redirect to write page so they can start immediately
      router.push('/write')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <form className="onboarding-form" onSubmit={handleSubmit}>

      {/* Q1 — Community */}
      <div className="onboarding-question">
        <p className="onboarding-question-label">
          Would you like to share your journal with the Wolfman community?
        </p>
        <p className="onboarding-question-hint">
          Community members can read your morning intentions. You can always
          control visibility post-by-post and change this in your settings.
        </p>
        <div className="onboarding-options">
          <button
            type="button"
            className={`onboarding-option${communityEnabled ? ' is-active' : ''}`}
            onClick={() => { setCommunityEnabled(true); setDefaultPublic(true) }}
          >
            <span className="onboarding-option-icon">🌍</span>
            <span className="onboarding-option-label">Yes, share with the community</span>
          </button>
          <button
            type="button"
            className={`onboarding-option${!communityEnabled ? ' is-active' : ''}`}
            onClick={() => { setCommunityEnabled(false); setDefaultPublic(false) }}
          >
            <span className="onboarding-option-icon">🔒</span>
            <span className="onboarding-option-label">No, keep my journal private</span>
          </button>
        </div>
      </div>

      {/* Q2 — Default visibility (only if community enabled) */}
      {communityEnabled && (
        <div className="onboarding-question onboarding-question--sub">
          <p className="onboarding-question-label">
            What should the default be when you write a new entry?
          </p>
          <p className="onboarding-question-hint">
            You can always override this when writing.
          </p>
          <div className="onboarding-options">
            <button
              type="button"
              className={`onboarding-option${defaultPublic ? ' is-active' : ''}`}
              onClick={() => setDefaultPublic(true)}
            >
              <span className="onboarding-option-icon">✓</span>
              <span className="onboarding-option-label">Public by default</span>
            </button>
            <button
              type="button"
              className={`onboarding-option${!defaultPublic ? ' is-active' : ''}`}
              onClick={() => setDefaultPublic(false)}
            >
              <span className="onboarding-option-icon">—</span>
              <span className="onboarding-option-label">Private by default</span>
            </button>
          </div>
        </div>
      )}

      {error && <p className="onboarding-error">{error}</p>}

      <button
        type="submit"
        className="onboarding-submit"
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Start writing →'}
      </button>
    </form>
  )
}
