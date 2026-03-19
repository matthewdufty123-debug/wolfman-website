'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Props {
  postId: string
}

export default function EveningReflection({ postId }: Props) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [reflection, setReflection] = useState('')
  const [wentToPlan, setWentToPlan] = useState<boolean | null>(null)
  const [dayRating, setDayRating] = useState(3)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [hasExisting, setHasExisting] = useState(false)

  const isAdmin = session?.user?.role === 'admin'

  // Load existing reflection when panel opens
  useEffect(() => {
    if (!open || !isAdmin) return
    fetch(`/api/admin/evening-reflection?postId=${postId}`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          setReflection(data.reflection ?? '')
          setWentToPlan(data.wentToPlan ?? null)
          setDayRating(data.dayRating ?? 3)
          setHasExisting(true)
        }
      })
      .catch(() => {})
  }, [open, postId, isAdmin])

  if (!isAdmin) return null

  async function handleSubmit() {
    if (!reflection.trim()) { setError('Write something first.'); return }
    if (wentToPlan === null) { setError('Did it go to plan?'); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/evening-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, reflection: reflection.trim(), wentToPlan, dayRating }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setHasExisting(true)
      setTimeout(() => { setSaved(false); setOpen(false) }, 1800)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Add evening reflection"
        style={{
          position: 'fixed',
          bottom: '5.5rem',
          right: '1.25rem',
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#214459',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          zIndex: 40,
          transition: 'transform 0.15s ease, background 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        title={hasExisting ? 'Edit evening reflection' : 'Add evening reflection'}
      >
        {hasExisting ? '✏️' : '🌙'}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 50,
            animation: 'er-fade-in 0.2s ease',
          }}
        />
      )}

      {/* Slide-up panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Evening reflection"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg, #fff)',
          borderRadius: '16px 16px 0 0',
          padding: '1.5rem 1.25rem 2.5rem',
          zIndex: 51,
          maxHeight: '85vh',
          overflowY: 'auto',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#ccc', margin: '0 auto 1.5rem' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--heading, #222)', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
            🌙 Evening Reflection
          </h2>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--body-text)', padding: '0.25rem' }}
            aria-label="Close"
          >✕</button>
        </div>

        <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

          {/* Reflection textarea */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--body-text)', marginBottom: '0.4rem' }}>
              How did the day actually go?
            </label>
            <textarea
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="What happened? What surprised you? What stayed with you?"
              rows={5}
              style={{
                width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #ccc',
                borderRadius: 6, fontSize: '0.95rem', lineHeight: 1.6,
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                resize: 'vertical', boxSizing: 'border-box',
                background: '#fff', color: '#222',
              }}
            />
          </div>

          {/* Went to plan */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--body-text)', marginBottom: '0.5rem' }}>
              Did it go to plan?
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {([true, false] as const).map(val => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setWentToPlan(val)}
                  style={{
                    flex: 1, padding: '0.6rem',
                    borderRadius: 8,
                    border: `2px solid ${wentToPlan === val ? (val ? '#3AB87A' : '#A82020') : '#ccc'}`,
                    background: wentToPlan === val ? (val ? '#e8f6ee' : '#fbeaea') : 'var(--admin-card-bg, #f8f8f8)',
                    color: wentToPlan === val ? (val ? '#1e5c38' : '#7a2020') : 'var(--body-text)',
                    fontWeight: wentToPlan === val ? 600 : 400,
                    fontSize: '0.9rem', cursor: 'pointer',
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    transition: 'all 0.15s ease',
                  }}
                >
                  {val ? '✓  Yes' : '✕  Not quite'}
                </button>
              ))}
            </div>
          </div>

          {/* Day rating */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--body-text)', marginBottom: '0.5rem' }}>
              Day rating
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDayRating(n)}
                  style={{
                    flex: 1, height: 40, borderRadius: 8,
                    border: `2px solid ${dayRating === n ? '#214459' : '#ccc'}`,
                    background: dayRating === n ? '#214459' : 'var(--admin-card-bg, #f8f8f8)',
                    color: dayRating === n ? '#fff' : 'var(--body-text)',
                    fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    transition: 'all 0.15s ease',
                  }}
                >{n}</button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--body-text)', opacity: 0.6 }}>Tough</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--body-text)', opacity: 0.6 }}>Brilliant</span>
            </div>
          </div>

          {error && (
            <p style={{ color: '#7a2020', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving || saved}
            style={{
              width: '100%', padding: '0.85rem',
              background: saved ? '#3AB87A' : '#214459',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: '1rem', fontWeight: 600, cursor: saving || saved ? 'default' : 'pointer',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              transition: 'background 0.2s ease',
            }}
          >
            {saved ? '✓ Saved' : saving ? 'Saving…' : hasExisting ? 'Update Reflection' : 'Save Reflection'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes er-fade-in { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  )
}
