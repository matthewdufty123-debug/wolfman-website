'use client'

import { useRef, useEffect, useState } from 'react'
import { ROUTINE_ICON_MAP } from '@/components/RoutineIcons'

type RoutineChecklistData = Record<string, boolean>

export default function AnimatedRoutineIcons({
  checklist,
  size = 13,
}: {
  checklist: RoutineChecklistData
  size?: number
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const completedKeys = Object.entries(ROUTINE_ICON_MAP)
    .filter(([key]) => checklist[key])
    .map(([key, { Icon, color }]) => ({ key, Icon, color }))

  if (completedKeys.length === 0) return null

  return (
    <div ref={wrapRef} className="animated-icons-wrap">
      {completedKeys.map(({ key, Icon, color }, i) => (
        <div
          key={key}
          className={`animated-icon${visible ? ' is-visible' : ''}`}
          style={{ '--icon-index': i } as React.CSSProperties}
        >
          <Icon size={size} color={color} />
        </div>
      ))}
    </div>
  )
}
