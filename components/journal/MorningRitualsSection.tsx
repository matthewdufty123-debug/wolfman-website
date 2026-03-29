'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ROUTINE_ICON_MAP } from '@/components/RoutineIcons'

interface Props {
  checklist: Record<string, boolean>
}

export default function MorningRitualsSection({ checklist }: Props) {
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

  const items = Object.entries(ROUTINE_ICON_MAP).filter(([key]) => Boolean(checklist[key]))
  const active = activeKey ? ROUTINE_ICON_MAP[activeKey] : null

  const SIZE = 48

  return (
    <section id="morning-rituals" className="journal-section">
      <h2 className="journal-section-title">Morning Rituals</h2>

      {items.length === 0 ? (
        <p className="journal-section-empty">No morning rituals recorded.</p>
      ) : (
        <>
          <div ref={wrapRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, width: '100%' }}>
            {items.map(([key, { label, Icon, color }], i) => (
              <button
                key={key}
                onClick={() => setActiveKey(key)}
                aria-label={label}
                style={{
                  width: SIZE + 10,
                  height: SIZE + 10,
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
                  // Enter from right (positive translateX → 0)
                  transform: visible ? 'none' : 'translateX(40px)',
                  transition: 'opacity 1.6s ease, transform 1.6s ease',
                  transitionDelay: `${i * 55}ms`,
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <Icon size={SIZE} color={color} />
              </button>
            ))}
          </div>

          {/* Popup */}
          {activeKey && active && (
            <>
              <div
                onClick={() => setActiveKey(null)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 60,
                  background: 'rgba(0,0,0,0.35)',
                  animation: 'ritual-fade-in 0.15s ease',
                }}
              />
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
                  animation: 'ritual-pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  cursor: 'pointer',
                }}
              >
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

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.875rem' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${active.color}22`,
                    border: `2px solid ${active.color}`,
                  }}>
                    <active.Icon size={36} color={active.color} />
                  </div>
                </div>

                <p style={{ margin: '0 0 0.3rem', textAlign: 'center', fontWeight: 700, fontSize: '1rem', color: 'var(--heading, #193343)', fontFamily: 'var(--font-inter)' }}>{active.label}</p>
                <p style={{ margin: '0 0 0.875rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: active.color, fontFamily: 'var(--font-inter)' }}>✓ Completed this morning</p>
                <p style={{ margin: '0 0 1.25rem', textAlign: 'center', fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--body-text)', fontFamily: 'var(--font-lora)' }}>{active.description}</p>

                <Link
                  href={`/morning-ritual/${activeKey}`}
                  onClick={e => e.stopPropagation()}
                  style={{ display: 'block', textAlign: 'center', background: '#214459', color: '#fff', borderRadius: 8, padding: '0.7rem 1rem', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-inter)' }}
                >
                  See all journals with this ritual →
                </Link>
              </div>
            </>
          )}

          <style>{`
            @keyframes ritual-fade-in { from { opacity: 0 } to { opacity: 1 } }
            @keyframes ritual-pop-in  { from { opacity: 0; transform: translate(-50%,-50%) scale(0.92) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
          `}</style>
        </>
      )}
    </section>
  )
}
