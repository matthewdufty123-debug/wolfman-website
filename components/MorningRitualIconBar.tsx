'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ROUTINE_ICON_MAP } from '@/components/RoutineIcons'

interface Props {
  checklist: Record<string, boolean>
  size?: number
}

export default function MorningRitualIconBar({ checklist, size = 30 }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Only show completed rituals
  const items = Object.entries(ROUTINE_ICON_MAP).filter(([key]) => Boolean(checklist[key]))
  const active = activeKey ? ROUTINE_ICON_MAP[activeKey] : null

  if (items.length === 0) return null

  return (
    <>
      {/* Icon row — completed only */}
      <div ref={wrapRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }}>
        {items.map(([key, { label, Icon, color }], i) => (
          <button
            key={key}
            onClick={() => setActiveKey(key)}
            aria-label={label}
            style={{
              width: size + 8,
              height: size + 8,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${color}22`,
              border: `1.5px solid ${color}`,
              flexShrink: 0,
              cursor: 'pointer',
              padding: 0,
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateX(-14px)',
              transition: 'opacity 2.3s ease, transform 2.3s ease',
              transitionDelay: `${i * 40}ms`,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Icon size={size} color={color} />
          </button>
        ))}
      </div>

      {/* Popup */}
      {activeKey && active && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setActiveKey(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.35)',
              animation: 'mr-fade-in 0.15s ease',
            }}
          />

          {/* Card */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={active.label}
            onClick={() => setActiveKey(null)}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 61,
              background: 'var(--bg, #fff)',
              borderRadius: 16,
              padding: '2rem 1.5rem 1.5rem',
              width: 'min(300px, calc(100vw - 2rem))',
              boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
              animation: 'mr-pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              cursor: 'pointer',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setActiveKey(null)}
              aria-label="Close"
              style={{
                position: 'absolute', top: '0.75rem', right: '0.75rem',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1rem', color: 'var(--body-text)', opacity: 0.45,
                padding: '0.25rem', lineHeight: 1,
              }}
            >✕</button>

            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.875rem' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${active.color}22`,
                border: `2px solid ${active.color}`,
              }}>
                <active.Icon size={34} color={active.color} />
              </div>
            </div>

            {/* Label */}
            <p style={{
              margin: '0 0 0.3rem',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--heading, #193343)',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            }}>{active.label}</p>

            {/* Done status */}
            <p style={{
              margin: '0 0 0.875rem',
              textAlign: 'center',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: active.color,
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            }}>
              ✓ Completed this morning
            </p>

            {/* Description */}
            <p style={{
              margin: '0 0 1.25rem',
              textAlign: 'center',
              fontSize: '0.88rem',
              lineHeight: 1.65,
              color: 'var(--body-text)',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            }}>{active.description}</p>

            {/* Filter page link */}
            <Link
              href={`/morning-ritual/${activeKey}`}
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
              See all posts with this ritual →
            </Link>
          </div>
        </>
      )}

      <style>{`
        @keyframes mr-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mr-pop-in  { from { opacity: 0; transform: translate(-50%,-50%) scale(0.92) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
      `}</style>
    </>
  )
}
