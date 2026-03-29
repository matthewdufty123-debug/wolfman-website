'use client'

import { useState, useEffect, useCallback } from 'react'

const SECTIONS = [
  { id: 'morning-rituals',    label: 'Morning Rituals' },
  { id: 'how-i-showed-up',   label: 'How I Showed Up' },
  { id: 'the-journal',       label: 'The Journal' },
  { id: 'wolfbot-review',    label: 'WOLF|BOT Review' },
  { id: 'post-information',  label: 'Post Information' },
  { id: 'evening-reflection', label: 'Evening Reflections' },
  { id: 'journal-photo',     label: 'Journal Photo' },
  { id: 'profile-information', label: 'About the Author' },
  { id: 'audit-log',         label: 'Audit Log' },
]

export default function OrbNav() {
  const [activeId, setActiveId] = useState<string | null>(null)

  // Track which section is in view via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    const thresholds = [0.4]

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id) },
        { threshold: thresholds, rootMargin: '-10% 0px -50% 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [])

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <nav className="orb-nav" aria-label="Journal sections">
      {SECTIONS.map(({ id, label }) => {
        const isActive = activeId === id
        return (
          <button
            key={id}
            className={`orb-nav-btn${isActive ? ' orb-nav-btn--active' : ''}`}
            aria-label={label}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => scrollTo(id)}
          />
        )
      })}
    </nav>
  )
}
