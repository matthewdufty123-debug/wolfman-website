'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  scaleName: string
  value: number
  labels: [string, string, string, string, string, string]  // labels for values 1–6
  color: string
  statsLink?: string
}

export default function MorningScaleBar({ scaleName, value, labels, color, statsLink = '/morning-stats' }: Props) {
  const [open, setOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const containerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.disconnect() } },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const activeLabel = labels[value - 1]

  return (
    <>
      <button
        ref={containerRef}
        onClick={() => setOpen(true)}
        style={{
          display: 'block',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
        }}
        aria-label={`${scaleName}: ${activeLabel}. Tap to see details.`}
      >
        {/* Pip bar */}
        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
          {labels.map((_, i) => {
            const isActive = revealed && i === value - 1
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 10,
                  borderRadius: 5,
                  background: isActive ? color : '#e8e8e8',
                  transition: `background 0.4s ease ${0.1 + i * 0.06}s`,
                }}
              />
            )
          })}
        </div>

        {/* Description word */}
        <div style={{
          textAlign: 'center',
          marginTop: 6,
          fontSize: '0.78rem',
          fontWeight: 600,
          color: color,
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.4s ease 0.5s, transform 0.4s ease 0.5s',
          letterSpacing: '0.02em',
        }}>
          {activeLabel}
        </div>
      </button>

      {/* Popup */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.35)',
              animation: 'ms-fade-in 0.15s ease',
            }}
          />

          {/* Card */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={scaleName}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 61,
              background: 'var(--bg, #fff)',
              borderRadius: 16,
              padding: '2rem 1.5rem 1.5rem',
              width: 'min(320px, calc(100vw - 2rem))',
              boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
              animation: 'ms-pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              cursor: 'pointer',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                position: 'absolute', top: '0.75rem', right: '0.75rem',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1rem', color: 'var(--body-text)', opacity: 0.45,
                padding: '0.25rem', lineHeight: 1,
              }}
            >✕</button>

            {/* Scale name */}
            <p style={{
              margin: '0 0 1.25rem',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--heading, #193343)',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            }}>{scaleName}</p>

            {/* Labelled values */}
            <div
              onClick={e => e.stopPropagation()}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}
            >
              {labels.map((label, i) => {
                const n = i + 1
                const active = n === value
                return (
                  <div key={n} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.45rem 0.75rem',
                    borderRadius: 8,
                    background: active ? `${color}18` : 'transparent',
                    border: `1.5px solid ${active ? color : 'transparent'}`,
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: active ? color : '#e8e8e8',
                      color: active ? '#fff' : '#999',
                      fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    }}>{n}</span>
                    <span style={{
                      fontSize: '0.88rem',
                      color: active ? color : 'var(--body-text)',
                      fontWeight: active ? 700 : 400,
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    }}>{label}</span>
                  </div>
                )
              })}
            </div>

            {/* Stats link */}
            <Link
              href={statsLink}
              onClick={e => e.stopPropagation()}
              style={{
                display: 'block',
                textAlign: 'center',
                background: '#214459',
                color: '#fff',
                borderRadius: 8,
                padding: '0.7rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              View morning stats →
            </Link>
          </div>
        </>
      )}

      <style>{`
        @keyframes ms-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ms-pop-in  { from { opacity: 0; transform: translate(-50%,-50%) scale(0.92) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
      `}</style>
    </>
  )
}
