'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { updateUsername } from '@/lib/actions/account'

type CheckState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function AccountUsernameForm({ currentUsername }: { currentUsername: string }) {
  const [state, formAction, pending] = useActionState(updateUsername, undefined)
  const [value, setValue] = useState(currentUsername)
  const [checkState, setCheckState] = useState<CheckState>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const trimmed = value.trim().toLowerCase()

    if (trimmed === currentUsername) {
      setCheckState('idle')
      return
    }

    if (!trimmed) {
      setCheckState('idle')
      return
    }

    setCheckState('checking')

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/username?u=${encodeURIComponent(trimmed)}`)
        const data = await res.json()
        if (data.reason === 'invalid') setCheckState('invalid')
        else setCheckState(data.available ? 'available' : 'taken')
      } catch {
        setCheckState('idle')
      }
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value, currentUsername])

  const unchanged = value.trim().toLowerCase() === currentUsername
  const canSubmit = !pending && !unchanged && checkState === 'available'

  const statusText = {
    idle: null,
    checking: { text: 'Checking…', color: 'var(--body-text)' },
    available: { text: '✓ Available', color: '#3AB87A' },
    taken: { text: '✗ Already taken', color: '#A82020' },
    invalid: { text: '✗ Letters, numbers and hyphens only (2–30 chars)', color: '#A82020' },
  }[checkState]

  return (
    <form action={formAction} className="account-form">
      {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
      {state?.success && <p className="auth-success">{state.success}</p>}

      <div className="auth-field">
        <label htmlFor="username" className="auth-label">Username</label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--body-text)',
            opacity: 0.45,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: '0.9rem',
            pointerEvents: 'none',
          }}>@</span>
          <input
            id="username"
            name="username"
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="auth-input"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            style={{ paddingLeft: '1.75rem' }}
          />
        </div>
        {statusText && (
          <p style={{
            margin: '0.35rem 0 0',
            fontSize: '0.8rem',
            color: statusText.color,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          }}>
            {statusText.text}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="auth-submit"
        disabled={!canSubmit}
      >
        {pending ? 'Saving…' : 'Save username'}
      </button>
    </form>
  )
}
