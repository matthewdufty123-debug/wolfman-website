'use client'

import { useState } from 'react'
import Link from 'next/link'

type Source = 'beta-page' | 'login-page' | 'register-page'
type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function BetaInterestForm({ source }: { source: Source }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consented, setConsented] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isDuplicate, setIsDuplicate] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/beta-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), source, website: honeypot }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setIsDuplicate(data.duplicate ?? false)
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="interest-success">
        <span className="interest-success-tick" aria-hidden="true">✓</span>
        <p className="interest-success-headline">
          {isDuplicate ? "You're already on the list." : "We'll be in touch when registration opens."}
        </p>
      </div>
    )
  }

  return (
    <form className="interest-form" onSubmit={handleSubmit} noValidate>
      {status === 'error' && (
        <p className="interest-error" role="alert">{errorMsg}</p>
      )}

      {/* Honeypot — hidden from humans, filled by bots */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={e => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="interest-field">
        <label htmlFor="interest-name" className="interest-label">Your name</label>
        <input
          id="interest-name"
          type="text"
          className="interest-input"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          autoComplete="name"
          disabled={status === 'submitting'}
        />
      </div>

      <div className="interest-field">
        <label htmlFor="interest-email" className="interest-label">Email address</label>
        <input
          id="interest-email"
          type="email"
          className="interest-input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={status === 'submitting'}
        />
      </div>

      <div className="interest-consent">
        <label className="interest-consent-label">
          <input
            type="checkbox"
            className="interest-consent-checkbox"
            checked={consented}
            onChange={e => setConsented(e.target.checked)}
            required
          />
          <span>
            I agree to be contacted when registration opens.
            My email won&apos;t be used for anything else.{' '}
            <Link href="/terms" className="interest-consent-link">Terms</Link>
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="interest-submit"
        disabled={status === 'submitting' || !name.trim() || !email.trim() || !consented}
      >
        {status === 'submitting' ? 'Please wait…' : 'Register my interest'}
      </button>
    </form>
  )
}
