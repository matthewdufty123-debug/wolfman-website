'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ROUTINE_ICON_MAP } from '@/components/RoutineIcons'

interface Props {
  checklist: Record<string, boolean>
  size?: number
}

export default function MorningRitualIconBar({ checklist, size = 20 }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const items = Object.entries(ROUTINE_ICON_MAP)
  const active = activeKey ? ROUTINE_ICON_MAP[activeKey] : null
  const isDone = activeKey ? Boolean(checklist[activeKey]) : false

  return (
    <>
      {/* Icon row */}
      <div style={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
        {items.map(([key, { label, Icon, color }]) => {
          const done = Boolean(checklist[key])
          return (
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
                background: done ? `${color}22` : 'transparent',
                border: `1.5px solid ${done ? color : '#ddd'}`,
                flexShrink: 0,
                opacity: done ? 1 : 0.25,
                cursor: 'pointer',
                padding: 0,
                transition: 'opacity 0.15s ease, transform 0.1s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = done ? '0.85' : '0.45')}
              onMouseLeave={e => (e.currentTarget.style.opacity = done ? '1' : '0.25')}
            >
              <Icon size={size} color={done ? color : '#999'} />
            </button>
          )
        })}
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
                background: isDone ? `${active.color}22` : 'transparent',
                border: `2px solid ${isDone ? active.color : '#ddd'}`,
                opacity: isDone ? 1 : 0.35,
              }}>
                <active.Icon size={34} color={isDone ? active.color : '#999'} />
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

            {/* Done/not status */}
            <p style={{
              margin: '0 0 0.875rem',
              textAlign: 'center',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: isDone ? active.color : 'var(--body-text)',
              opacity: isDone ? 0.9 : 0.4,
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            }}>
              {isDone ? '✓ Completed this morning' : 'Not completed this morning'}
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
