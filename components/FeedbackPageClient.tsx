'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import BetaCountdown from '@/components/BetaCountdown'

const CATEGORIES = ['Bug', 'Idea', 'Question']
const TOPICS = ['Journal', 'Stats', 'Design', 'Performance', 'SEO', 'Shop', 'Auth', 'Mobile', 'Admin']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export default function FeedbackPageClient() {
  const [category, setCategory] = useState('Idea')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotError, setScreenshotError] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function toggleTopic(t: string) {
    setSelectedTopics(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setScreenshotError('')
    if (!file) { setScreenshot(null); return }
    if (file.size > MAX_SIZE) {
      setScreenshotError('Screenshot must be under 5MB.')
      setScreenshot(null)
      e.target.value = ''
      return
    }
    setScreenshot(file)
  }

  function clearScreenshot() {
    setScreenshot(null)
    setScreenshotError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('submitting')
    setErrorMsg('')

    const form = new FormData()
    form.append('category', category)
    form.append('message', message)
    form.append('anonymous', String(anonymous))
    form.append('pageUrl', window.location.href)
    form.append('topics', selectedTopics.join(','))
    if (screenshot) form.append('screenshot', screenshot)

    try {
      const res = await fetch('/api/feedback', { method: 'POST', body: form })

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
      setSelectedTopics([])
      setShowAdvanced(false)
      setAnonymous(false)
      clearScreenshot()
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
            <button className="feedback-again-btn" onClick={() => setStatus('idle')}>
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

            {/* Topic area (optional, multi-select) */}
            <div className="feedback-field">
              <p className="feedback-label">
                Topic area <span className="feedback-label-optional">(optional)</span>
              </p>
              <div className="feedback-topics">
                {TOPICS.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`feedback-topic-pill${selectedTopics.includes(t) ? ' is-active' : ''}`}
                    onClick={() => toggleTopic(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="feedback-advanced-toggle">
                <button
                  type="button"
                  className="feedback-advanced-btn"
                  onClick={() => setShowAdvanced(o => !o)}
                >
                  {showAdvanced ? '− Less options' : '+ More options'}
                </button>
              </div>
              {showAdvanced && (
                <div className="feedback-advanced">
                  <p className="feedback-advanced-note">
                    Topic tags help us triage your feedback into the right area of the backlog.
                    Matthew reads everything regardless.
                  </p>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="feedback-field">
              <label htmlFor="feedback-message" className="feedback-label">Your message</label>
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

            {/* Screenshot */}
            <div className="feedback-field">
              <p className="feedback-label">Screenshot <span className="feedback-label-optional">(optional, max 5MB)</span></p>
              {screenshot ? (
                <div className="feedback-screenshot-selected">
                  <span className="feedback-screenshot-name">{screenshot.name}</span>
                  <button type="button" className="feedback-screenshot-clear" onClick={clearScreenshot}>
                    Remove
                  </button>
                </div>
              ) : (
                <label className="feedback-screenshot-upload">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="feedback-screenshot-input"
                  />
                  Choose image
                </label>
              )}
              {screenshotError && <p className="feedback-error">{screenshotError}</p>}
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
      <div className="feedback-dev-link">
        <Link href="/dev" className="feedback-dev-anchor">
          See what&apos;s in the pipeline →
        </Link>
      </div>
    </div>
    </main>
  )
}
