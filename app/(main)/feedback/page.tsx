'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import BetaCountdown from '@/components/BetaCountdown'

const CATEGORIES = ['Bug', 'Idea', 'Question']

export default function FeedbackPage() {
  const pathname = usePathname()
  const [category, setCategory] = useState('Idea')
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message, anonymous, pageUrl: window.location.href }),
      })

      if (res.status === 401) {
        setStatus('error')
        setErrorMsg('You need to be signed in to leave feedback.')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStatus('error')
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setStatus('success')
      setMessage('')
      setCategory('Idea')
      setAnonymous(false)
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
  }

  return (
    <main className="feedback-page">
      <div className="feedback-card">
        <p className="beta-eyebrow">Beta Feedback</p>
        <h1 className="feedback-title">Tell Matthew what you think.</h1>

        <div className="feedback-countdown-row">
          <BetaCountdown className="feedback-countdown" />
        </div>

        {status === 'success' ? (
          <div className="feedback-success">
            <p className="feedback-success-headline">Thank you.</p>
            <p className="feedback-success-body">
              Your feedback has been sent directly to Matthew. He reads everything.
            </p>
            <button
              className="feedback-again-btn"
              onClick={() => setStatus('idle')}
            >
              Send more feedback
            </button>
          </div>
        ) : (
          <form className="feedback-form" onSubmit={handleSubmit}>
            {/* Category pills */}
            <div className="feedback-field">
              <p className="feedback-label">What kind of feedback is this?</p>
              <div className="feedback-categories">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`feedback-category-pill${category === c ? ' is-active' : ''}`}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="feedback-field">
              <label htmlFor="feedback-message" className="feedback-label">
                Your message
              </label>
              <textarea
                id="feedback-message"
                className="feedback-textarea"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={5}
                required
              />
            </div>

            {/* Anonymous toggle */}
            <label className="feedback-anon-label">
              <input
                type="checkbox"
                className="feedback-anon-checkbox"
                checked={anonymous}
                onChange={e => setAnonymous(e.target.checked)}
              />
              <span className="feedback-anon-text">
                Send anonymously — don&apos;t include my name or page URL
              </span>
            </label>

            {errorMsg && <p className="feedback-error">{errorMsg}</p>}

            <button
              type="submit"
              className="feedback-submit"
              disabled={status === 'submitting' || !message.trim()}
            >
              {status === 'submitting' ? 'Sending…' : 'Send feedback'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
