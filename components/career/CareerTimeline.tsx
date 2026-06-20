'use client'

import { useState, useMemo } from 'react'
import type { SkillSummary } from '@/lib/career'
import SkillsSummary from './SkillsSummary'

// ── Serialized types (dates as strings from server) ─────────────────────────

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

// ── Colour maps ──────────────────────────────────────────────────────────────

const EMPLOYMENT_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  employed:      { bg: 'bg-[#4A7FA5]/10', text: 'text-[#4A7FA5]', border: 'border-[#4A7FA5]/30' },
  'self-employed': { bg: 'bg-[#A0622A]/10', text: 'text-[#A0622A]', border: 'border-[#A0622A]/30' },
}

const THEME_COLOURS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  'change-management': { bg: 'bg-[#3AB87A]/10', text: 'text-[#3AB87A]', dot: 'bg-[#3AB87A]', label: 'Change Management' },
  'data-analytics':    { bg: 'bg-[#2A6AB0]/10', text: 'text-[#2A6AB0]', dot: 'bg-[#2A6AB0]', label: 'Data & Analytics' },
  operational:         { bg: 'bg-[#C8B020]/10', text: 'text-[#C8B020]', dot: 'bg-[#C8B020]', label: 'Operational' },
}

type ThemeFilter = 'all' | 'change-management' | 'data-analytics' | 'operational'
type ViewFilter = 'timeline' | 'skills'

interface Props {
  roles: SerializedRole[]
  skills: SkillSummary[]
}

export default function CareerTimeline({ roles, skills }: Props) {
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

        // Keep role if it matches search OR has matching achievements
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
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search roles, achievements, skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[#e8e3de] bg-white text-[#4A4A4A] text-sm
                     placeholder:text-[#909090] focus:outline-none focus:border-[#A0622A] focus:ring-1 focus:ring-[#A0622A]/20
                     font-[family-name:var(--font-inter)]"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {/* View toggle */}
        <button
          onClick={() => setView('timeline')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium font-[family-name:var(--font-jetbrains)] tracking-wide transition-colors
            ${view === 'timeline'
              ? 'bg-[#4A4A4A] text-white'
              : 'bg-[#f5f0eb] text-[#909090] hover:text-[#4A4A4A]'
            }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setView('skills')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium font-[family-name:var(--font-jetbrains)] tracking-wide transition-colors
            ${view === 'skills'
              ? 'bg-[#4A4A4A] text-white'
              : 'bg-[#f5f0eb] text-[#909090] hover:text-[#4A4A4A]'
            }`}
        >
          Skills
        </button>

        <span className="w-px h-6 bg-[#e8e3de] self-center mx-1" />

        {/* Theme filters */}
        {(['all', 'change-management', 'data-analytics', 'operational'] as const).map(t => (
          <button
            key={t}
            onClick={() => setThemeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium font-[family-name:var(--font-jetbrains)] tracking-wide transition-colors
              ${themeFilter === t
                ? 'bg-[#4A4A4A] text-white'
                : 'bg-[#f5f0eb] text-[#909090] hover:text-[#4A4A4A]'
              }`}
          >
            {t === 'all' ? 'All Themes' : THEME_COLOURS[t].label}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === 'skills' ? (
        <SkillsSummary skills={filteredSkills} />
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#e8e3de] sm:left-[11px]" />

          {filtered.length === 0 ? (
            <p className="text-sm text-[#909090] pl-8 py-8">No results found.</p>
          ) : (
            <div className="space-y-0">
              {filtered.map(role => (
                <RoleCard key={role.id} role={role} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Role card ────────────────────────────────────────────────────────────────

function RoleCard({ role }: { role: SerializedRole }) {
  const emp = EMPLOYMENT_COLOURS[role.employmentType] ?? EMPLOYMENT_COLOURS.employed
  const dotColour = role.isCurrent ? 'bg-[#A0622A]' : 'bg-white border-2 border-[#A0622A]'

  return (
    <article className="relative grid grid-cols-[16px_1fr] gap-x-3 sm:grid-cols-[24px_1fr] sm:gap-x-4 pb-8 last:pb-2">
      {/* Dot */}
      <div className="relative flex justify-center pt-1.5">
        <span className={`w-[15px] h-[15px] rounded-full ${dotColour} z-10 shrink-0
          ${role.isCurrent ? 'ring-4 ring-[#A0622A]/15' : ''}`}
        />
      </div>

      {/* Content */}
      <div className="min-w-0">
        {/* Header */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="font-[family-name:var(--font-inter)] font-semibold text-[#4A4A4A] text-base sm:text-lg leading-tight">
            {role.title}
          </h3>
          <span className="text-[#909090] text-sm">at</span>
          <span className="font-[family-name:var(--font-inter)] font-semibold text-[#4A4A4A] text-base sm:text-lg">
            {role.company}
          </span>
          {role.isCurrent && (
            <span className="font-[family-name:var(--font-jetbrains)] text-[10px] tracking-widest uppercase
                             bg-[#A0622A] text-white px-2 py-0.5 rounded-full font-bold">
              Now
            </span>
          )}
        </div>

        {/* Meta */}
        <p className="font-[family-name:var(--font-jetbrains)] text-xs text-[#909090] mt-0.5">
          {formatDateRange(role.startDate, role.endDate)}
          <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${emp.bg} ${emp.text}`}>
            {role.employmentType === 'self-employed' ? 'Self-Employed' : 'Employed'}
          </span>
        </p>

        {/* Summary */}
        <p className="text-[#4A4A4A] text-sm leading-relaxed mt-2 max-w-prose">
          {role.summary}
        </p>

        {/* Achievements */}
        {role.achievements.length > 0 && (
          <div className="mt-4 space-y-3">
            {role.achievements.map(a => {
              const tc = THEME_COLOURS[a.theme] ?? THEME_COLOURS.operational
              return (
                <div key={a.id} className="relative pl-4 border-l-2 border-[#f0ebe6]">
                  {/* Theme badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                    font-[family-name:var(--font-jetbrains)] ${tc.bg} ${tc.text} mb-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                    {tc.label}
                  </span>

                  <p className="text-sm text-[#4A4A4A] leading-relaxed">{a.description}</p>

                  {/* Skill tags */}
                  {a.skillTags && a.skillTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {a.skillTags.map(tag => (
                        <span key={tag} className="font-[family-name:var(--font-jetbrains)] text-[10px] text-[#909090]
                                                   bg-[#f5f0eb] px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* WOLF|BOT comment */}
                  {a.wolfbotComment && (
                    <p className="font-[family-name:var(--font-jetbrains)] text-xs text-[#A0622A]/70 mt-1.5 italic">
                      🐺 {a.wolfbotComment}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </article>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string | null): string {
  const fmt = (ym: string) => {
    const [y, m] = ym.split('-')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${months[parseInt(m, 10) - 1]} ${y}`
  }
  return end ? `${fmt(start)} → ${fmt(end)}` : `${fmt(start)} → present`
}
