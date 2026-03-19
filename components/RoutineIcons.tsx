import React from 'react'

// ── Individual SVG icons ──────────────────────────────────────────────────────
// Each drawn on an 18×18 viewBox. Clean, minimal, recognisable at small sizes.

function IconSunlight({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="9" r="3" />
      <line x1="9" y1="1.5" x2="9" y2="3.5" />
      <line x1="9" y1="14.5" x2="9" y2="16.5" />
      <line x1="1.5" y1="9" x2="3.5" y2="9" />
      <line x1="14.5" y1="9" x2="16.5" y2="9" />
      <line x1="3.4" y1="3.4" x2="4.8" y2="4.8" />
      <line x1="13.2" y1="13.2" x2="14.6" y2="14.6" />
      <line x1="14.6" y1="3.4" x2="13.2" y2="4.8" />
      <line x1="4.8" y1="13.2" x2="3.4" y2="14.6" />
    </svg>
  )
}

function IconBreathwork({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2 9 C4 5, 6 5, 8 9 S12 13, 14 9 S16 5, 16 7" />
      <path d="M9 14 C9 14, 9 12, 9 11" opacity="0.5" />
      <circle cx="9" cy="15" r="1" fill={color} stroke="none" />
    </svg>
  )
}

function IconCeremonialDrink({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M5 8 Q5 14 9 14 Q13 14 13 8 Z" />
      <line x1="5" y1="8" x2="13" y2="8" />
      <path d="M7 3 Q7 1.5 8.5 2 Q8.5 3.5 7 3" strokeWidth="1.2" />
      <path d="M10 4 Q10 2.5 11.5 3 Q11.5 4.5 10 4" strokeWidth="1.2" />
      <line x1="13" y1="10" x2="15" y2="10" strokeWidth="1.5" />
      <path d="M15 8.5 Q16.5 10 15 11.5" />
    </svg>
  )
}

function IconMeditation({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="3.5" r="1.5" />
      <path d="M6 14 Q9 12 12 14" />
      <path d="M4 10 Q6.5 7 9 8 Q11.5 7 14 10" />
      <line x1="4" y1="10" x2="3" y2="13" />
      <line x1="14" y1="10" x2="15" y2="13" />
      <line x1="9" y1="8" x2="9" y2="12" />
    </svg>
  )
}

function IconColdShower({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M4 4 L4 7 Q4 8 5 8 L13 8 Q14 8 14 7 L14 4" />
      <line x1="4" y1="4" x2="14" y2="4" />
      <line x1="7" y1="11" x2="7" y2="13" />
      <line x1="9" y1="11" x2="9" y2="13" />
      <line x1="11" y1="11" x2="11" y2="13" />
      <line x1="6" y1="14" x2="6" y2="16" />
      <line x1="9" y1="14.5" x2="9" y2="16.5" />
      <line x1="12" y1="14" x2="12" y2="16" />
    </svg>
  )
}

function IconWalk({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="3" r="1.5" />
      <path d="M9 5 L8 9 L5 11" />
      <path d="M9 5 L10 9 L13 11" />
      <path d="M8 9 L7 13 L5 15" />
      <path d="M10 9 L11 13 L13 15" />
    </svg>
  )
}

function IconAnimalLove({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill={color} stroke="none" aria-hidden="true">
      {/* Paw print — filled */}
      <ellipse cx="9" cy="12" rx="3.5" ry="2.5" />
      <ellipse cx="5.5" cy="9" rx="1.3" ry="1.6" />
      <ellipse cx="12.5" cy="9" rx="1.3" ry="1.6" />
      <ellipse cx="7" cy="7" rx="1.2" ry="1.4" />
      <ellipse cx="11" cy="7" rx="1.2" ry="1.4" />
    </svg>
  )
}

function IconCaffeine({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      {/* Mug body */}
      <path d="M3 8 L3 14 Q3 16 5 16 L12 16 Q14 16 14 14 L14 8" />
      <line x1="3" y1="8" x2="14" y2="8" />
      {/* Handle */}
      <path d="M14 9.5 Q17 9.5 17 12 Q17 14.5 14 14.5" />
      {/* Steam */}
      <path d="M7.5 5.5 Q7 4 8 3" />
      <path d="M10.5 5.5 Q10 4 11 3" />
    </svg>
  )
}

function IconYoga({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      {/* Head */}
      <circle cx="9" cy="3" r="1.5" />
      {/* Torso */}
      <line x1="9" y1="4.5" x2="9" y2="10" />
      {/* Arms spread wide — warrior II */}
      <line x1="9" y1="7" x2="2.5" y2="7" />
      <line x1="9" y1="7" x2="15.5" y2="7" />
      {/* Front leg bent */}
      <path d="M9 10 L6.5 13 L6 16" />
      {/* Back leg straight */}
      <line x1="9" y1="10" x2="13" y2="15.5" />
    </svg>
  )
}

function IconWorkout({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Bar */}
      <line x1="6" y1="9" x2="12" y2="9" strokeWidth="2.5" />
      {/* Left weight */}
      <rect x="1.5" y="6" width="4.5" height="6" rx="1.5" />
      {/* Right weight */}
      <rect x="12" y="6" width="4.5" height="6" rx="1.5" />
    </svg>
  )
}

// ── Icon registry ─────────────────────────────────────────────────────────────

export const ROUTINE_ICON_MAP: Record<string, {
  label: string
  description: string
  Icon: React.FC<{ size?: number; color?: string }>
  color: string
}> = {
  sunlight:        { label: 'Sunlight',          description: 'Natural light directly in the eyes to anchor your circadian rhythm',  Icon: IconSunlight,        color: '#C8B020' },
  breathwork:      { label: 'Breathwork',         description: 'Pranayama or Wim Hof — breathwork to regulate the nervous system',   Icon: IconBreathwork,      color: '#70C0C8' },
  cacao:           { label: 'Ceremonial Drink',   description: 'Cacao, Matcha or other mindful ceremonial morning drink',            Icon: IconCeremonialDrink, color: '#A0622A' },
  meditation:      { label: 'Still Meditation',   description: 'Sitting in stillness to observe the mind before the day',            Icon: IconMeditation,      color: '#4A7FA5' },
  coldShower:      { label: 'Cold Shower',        description: 'Cold exposure to activate presence and sharpen the body',            Icon: IconColdShower,      color: '#2A6AB0' },
  walk:            { label: 'Outside Walk',       description: 'Moving through nature to ground and clear the mind',                 Icon: IconWalk,            color: '#3AB87A' },
  animalLove:      { label: 'Animal Love',        description: 'Connecting with animals for a moment of pure presence',              Icon: IconAnimalLove,      color: '#C87840' },
  caffeine:        { label: 'Drink Caffeine',     description: 'Tea or Coffee — a mindful morning brew to awaken the senses',       Icon: IconCaffeine,        color: '#7A5030' },
  yoga:            { label: 'Yoga Movement',      description: 'Yoga movement to stretch, breathe and arrive in the body',          Icon: IconYoga,            color: '#8070B0' },
  workout:         { label: 'Workout',            description: 'Physical training to build strength and charge the day ahead',       Icon: IconWorkout,         color: '#C05828' },
}

// ── Composed components ───────────────────────────────────────────────────────

interface RoutineChecklistData {
  sunlight?: boolean
  breathwork?: boolean
  cacao?: boolean
  meditation?: boolean
  coldShower?: boolean
  walk?: boolean
  animalLove?: boolean
  caffeine?: boolean
  yoga?: boolean
  workout?: boolean
  [key: string]: boolean | undefined
}

interface RoutineIconSetProps {
  checklist: RoutineChecklistData
  size?: number
  // 'full' shows all 10 with greyed-out state; 'done-only' shows only completed
  mode?: 'full' | 'done-only'
  gap?: number
  // fullWidth: evenly spaces icons across the full container width
  fullWidth?: boolean
}

export function RoutineIconSet({ checklist, size = 20, mode = 'full', gap = 6, fullWidth = false }: RoutineIconSetProps) {
  const items = Object.entries(ROUTINE_ICON_MAP)
  const filtered = mode === 'done-only' ? items.filter(([key]) => checklist[key]) : items

  if (filtered.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: fullWidth ? 0 : gap,
      flexWrap: 'wrap',
      justifyContent: fullWidth ? 'space-evenly' : 'flex-start',
      width: fullWidth ? '100%' : undefined,
    }}>
      {filtered.map(([key, { label, Icon, color }]) => {
        const done = Boolean(checklist[key])
        return (
          <div
            key={key}
            title={label}
            style={{
              width: size + 8,
              height: size + 8,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: done ? `${color}22` : 'transparent',
              border: `1.5px solid ${done ? color : '#ddd'}`,
              transition: 'all 0.15s ease',
              flexShrink: 0,
              opacity: done ? 1 : 0.25,
            }}
          >
            <Icon size={size} color={done ? color : '#999'} />
          </div>
        )
      })}
    </div>
  )
}

// Compact version for the post listing — only shows completed items, smaller
export function RoutineIconBar({ checklist, size = 14 }: { checklist: RoutineChecklistData; size?: number }) {
  return <RoutineIconSet checklist={checklist} size={size} mode="done-only" gap={4} />
}
