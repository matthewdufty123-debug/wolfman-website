'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { SkillSummary } from '@/lib/career'
import SkillsSummary from './SkillsSummary'

// ── Serialized types ────────────────────────────────────────────────────────

interface SerializedAchievement {
  id: string
  roleId: string
  theme: string
  description: string
  skillTags: string[] | null
  sortOrder: number
  wolfbotComment: string | null
  createdAt: string
}

interface SerializedRole {
  id: string
  title: string
  company: string
  employmentType: string
  startDate: string
  endDate: string | null
  summary: string
  sortOrder: number
  isCurrent: boolean
  createdAt: string
  updatedAt: string
  achievements: SerializedAchievement[]
}

// ── Theme colours ───────────────────────────────────────────────────────────

const THEME_COLOURS: Record<string, { hex: string; bg: string; short: string }> = {
  'change-management': { hex: '#3AB87A', bg: 'rgba(58,184,122,0.12)',  short: 'CHANGE' },
  'data-analytics':    { hex: '#2A6AB0', bg: 'rgba(42,106,176,0.12)',  short: 'DATA' },
  operational:         { hex: '#C8B020', bg: 'rgba(200,176,32,0.12)',  short: 'OPS' },
}

type ThemeFilter = 'all' | 'change-management' | 'data-analytics' | 'operational'
type ViewFilter = 'timeline' | 'skills'

interface Props {
  roles: SerializedRole[]
  skills: SkillSummary[]
  isAdmin?: boolean
}

// ── Scroll-reveal hook ──────────────────────────────────────────────────────

function useScrollReveal(ref: React.RefObject<HTMLElement | null>, threshold = 0.15) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, threshold])
  return visible
}

// ── Main component ──────────────────────────────────────────────────────────

export default function CareerTimeline({ roles, skills, isAdmin = false }: Props) {
  const [search, setSearch] = useState('')
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>('all')
  const [view, setView] = useState<ViewFilter>('timeline')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return roles
      .map(role => {
        const achievements = role.achievements.filter(a => {
          if (themeFilter !== 'all' && a.theme !== themeFilter) return false
          if (!q) return true
          return (
            a.description.toLowerCase().includes(q) ||
            a.skillTags?.some(t => t.toLowerCase().includes(q))
          )
        })
        const roleMatches = !q || (
          role.title.toLowerCase().includes(q) ||
          role.company.toLowerCase().includes(q) ||
          role.summary.toLowerCase().includes(q)
        )
        if (!roleMatches && achievements.length === 0) return null
        return { ...role, achievements }
      })
      .filter(Boolean) as SerializedRole[]
  }, [roles, search, themeFilter])

  const filteredSkills = useMemo(() => {
    const q = search.toLowerCase().trim()
    return skills.filter(s => {
      if (themeFilter !== 'all' && s.theme !== themeFilter) return false
      if (!q) return true
      return s.name.toLowerCase().includes(q)
    })
  }, [skills, search, themeFilter])

  return (
    <div>
      {/* Admin link */}
      {isAdmin && (
        <Link
          href="/admin/career"
          className="inline-block mb-4 font-[family-name:var(--font-jetbrains)] text-xs tracking-wide text-[#A0622A] hover:underline underline-offset-2"
        >
          Edit Career →
        </Link>
      )}

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search roles, achievements, skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0622A]/20
                     font-[family-name:var(--font-inter)]"
          style={{
            background: 'var(--admin-card-bg)',
            border: '1px solid var(--admin-border)',
            color: 'var(--body-text)',
          }}
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {(['timeline', 'skills'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-4 py-2 rounded-full text-xs font-medium font-[family-name:var(--font-jetbrains)] tracking-wide transition-all duration-200"
            style={view === v
              ? { background: 'var(--contrast-bg)', color: 'var(--contrast-text)' }
              : { background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--body-text)', opacity: 0.6 }
            }
          >
            {v === 'timeline' ? 'Timeline' : 'Skills'}
          </button>
        ))}

        <span className="w-px h-7 self-center mx-1" style={{ background: 'var(--admin-border)' }} />

        {(['all', 'change-management', 'data-analytics', 'operational'] as const).map(t => {
          const isActive = themeFilter === t
          const tc = t !== 'all' ? THEME_COLOURS[t] : null
          return (
            <button
              key={t}
              onClick={() => setThemeFilter(t)}
              className="px-4 py-2 rounded-full text-xs font-medium font-[family-name:var(--font-jetbrains)] tracking-wide transition-all duration-200 flex items-center gap-1.5"
              style={isActive
                ? { background: 'var(--contrast-bg)', color: 'var(--contrast-text)' }
                : { background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--body-text)', opacity: 0.6 }
              }
            >
              {tc && !isActive && <span className="w-2 h-2 rounded-full" style={{ background: tc.hex }} />}
              {t === 'all' ? 'All branches' : tc!.short}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {view === 'skills' ? (
        <SkillsSummary skills={filteredSkills} />
      ) : filtered.length === 0 ? (
        <p className="text-sm py-12 text-center" style={{ color: 'var(--body-text)', opacity: 0.4 }}>
          No results found.
        </p>
      ) : (
        <div className="career-timeline">
          <div className="career-spine" />
          {filtered.map((role, idx) => (
            <TimelineNode key={role.id} role={role} index={idx} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Timeline node ───────────────────────────────────────────────────────────

function TimelineNode({ role, index }: { role: SerializedRole; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useScrollReveal(ref)

  return (
    <div className="career-node">
      <div className="career-connector" />
      <div className={`career-dot ${role.isCurrent ? 'career-dot--current' : 'career-dot--past'}`} />

      <div
        ref={ref}
        className={`career-reveal career-card${visible ? ' is-visible' : ''}`}
        style={{ transitionDelay: `${index * 100}ms` }}
      >
        {/* Header */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1">
          <h3 className="font-[family-name:var(--font-inter)] font-semibold text-base leading-tight"
              style={{ color: 'var(--heading)' }}>
            {role.title}
          </h3>
          <span className="text-xs" style={{ color: 'var(--body-text)', opacity: 0.35 }}>at</span>
          <span className="font-[family-name:var(--font-inter)] font-semibold text-base"
                style={{ color: 'var(--heading)' }}>
            {role.company}
          </span>
          {role.isCurrent && (
            <span className="font-[family-name:var(--font-jetbrains)] text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full font-bold text-white bg-[#A0622A]">
              Now
            </span>
          )}
        </div>

        {/* Meta */}
        <p className="font-[family-name:var(--font-jetbrains)] text-[11px] mb-3"
           style={{ color: 'var(--body-text)', opacity: 0.35 }}>
          {formatDateRange(role.startDate, role.endDate)} · {role.employmentType === 'self-employed' ? 'Self-Employed' : 'Employed'}
        </p>

        {/* Summary */}
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--body-text)', opacity: 0.7 }}>
          {role.summary}
        </p>

        {/* Achievements */}
        {role.achievements.length > 0 && (
          <div className="space-y-2">
            {role.achievements.map(a => (
              <AchievementRow key={a.id} achievement={a} roleSort={role.sortOrder} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Achievement row ─────────────────────────────────────────────────────────

function AchievementRow({ achievement: a, roleSort }: { achievement: SerializedAchievement; roleSort: number }) {
  const tc = THEME_COLOURS[a.theme] ?? THEME_COLOURS.operational

  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{ borderLeft: `3px solid ${tc.hex}`, background: 'rgba(128,128,128,0.04)' }}
    >
      {/* Badge + ref */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className="font-[family-name:var(--font-jetbrains)] text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
          style={{ color: tc.hex, background: tc.bg }}
        >
          {tc.short}
        </span>
        <span className="font-[family-name:var(--font-jetbrains)] text-[10px]"
              style={{ color: 'var(--body-text)', opacity: 0.25 }}>
          {roleSort}.{a.sortOrder}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
        {a.description}
      </p>

      {/* Skill tags */}
      {a.skillTags && a.skillTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {a.skillTags.map(tag => (
            <span key={tag}
              className="font-[family-name:var(--font-jetbrains)] text-[10px] px-2 py-0.5 rounded"
              style={{ background: 'var(--bg)', border: '1px solid var(--admin-border)', color: 'var(--body-text)', opacity: 0.55 }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* WOLF|BOT */}
      {a.wolfbotComment && (
        <p className="font-[family-name:var(--font-jetbrains)] text-[11px] mt-2 italic text-[#A0622A]" style={{ opacity: 0.7 }}>
          {a.wolfbotComment}
        </p>
      )}
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string | null): string {
  const fmt = (ym: string) => {
    const [y, m] = ym.split('-')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${months[parseInt(m, 10) - 1]} ${y}`
  }
  return end ? `${fmt(start)} → ${fmt(end)}` : `${fmt(start)} → present`
}
