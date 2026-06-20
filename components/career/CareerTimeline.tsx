'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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

// ── Era definitions ─────────────────────────────────────────────────────────

const ERAS = [
  { id: 'III', name: 'The canopy',    accent: '#C8B020', meta: '2023 → now · Engineering at scale',  range: [15, 99] as const },
  { id: 'II',  name: 'Branching out', accent: '#909090', meta: '2013 → 2023 · Ventures & analytics', range: [8, 14]  as const },
  { id: 'I',   name: 'The roots',     accent: '#A0622A', meta: '1997 → 2013 · Foundations',           range: [1, 7]   as const },
]

// ── Colour maps ─────────────────────────────────────────────────────────────

const EMPLOYMENT_COLOURS: Record<string, { bg: string; text: string }> = {
  employed:        { bg: 'bg-[#4A7FA5]/10', text: 'text-[#4A7FA5]' },
  'self-employed': { bg: 'bg-[#A0622A]/10', text: 'text-[#A0622A]' },
}

const THEME_COLOURS: Record<string, { bg: string; text: string; dot: string; label: string; short: string }> = {
  'change-management': { bg: 'bg-[#3AB87A]/10', text: 'text-[#3AB87A]', dot: 'bg-[#3AB87A]', label: 'Change Management', short: 'CHANGE' },
  'data-analytics':    { bg: 'bg-[#2A6AB0]/10', text: 'text-[#2A6AB0]', dot: 'bg-[#2A6AB0]', label: 'Data & Analytics',  short: 'DATA' },
  operational:         { bg: 'bg-[#C8B020]/10', text: 'text-[#C8B020]', dot: 'bg-[#C8B020]', label: 'Operational',        short: 'OPS' },
}

const THEMES_LIST = [
  { value: 'change-management', label: 'Change Management' },
  { value: 'data-analytics', label: 'Data & Analytics' },
  { value: 'operational', label: 'Operational' },
]

type ThemeFilter = 'all' | 'change-management' | 'data-analytics' | 'operational'
type ViewFilter = 'timeline' | 'skills'

interface Props {
  roles: SerializedRole[]
  skills: SkillSummary[]
  isAdmin?: boolean
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

  // Group roles into eras
  const eraGroups = useMemo(() => {
    return ERAS.map(era => ({
      ...era,
      roles: filtered
        .filter(r => r.sortOrder >= era.range[0] && r.sortOrder <= era.range[1])
        .sort((a, b) => b.sortOrder - a.sortOrder),
    })).filter(eg => eg.roles.length > 0)
  }, [filtered])

  return (
    <div>
      {/* ── Search ── */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search roles, achievements, skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0622A]/30
                     font-[family-name:var(--font-inter)]"
          style={{
            background: 'var(--admin-card-bg)',
            border: '1px solid var(--admin-border)',
            color: 'var(--body-text)',
          }}
        />
      </div>

      {/* ── Filter pills ── */}
      <div className="flex flex-wrap gap-2 mb-8">
        {/* View toggle */}
        {(['timeline', 'skills'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-4 py-2 rounded-full text-xs font-semibold font-[family-name:var(--font-jetbrains)] tracking-wide
                       transition-all duration-200"
            style={view === v
              ? { background: 'var(--contrast-bg)', color: 'var(--contrast-text)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
              : { background: 'var(--admin-card-bg)', color: 'var(--body-text)', opacity: 0.6, border: '1px solid var(--admin-border)' }
            }
          >
            {v === 'timeline' ? 'Timeline' : 'Skills'}
          </button>
        ))}

        <span className="w-px h-8 self-center mx-1" style={{ background: 'var(--admin-border)' }} />

        {/* Theme filters */}
        {(['all', 'change-management', 'data-analytics', 'operational'] as const).map(t => {
          const isActive = themeFilter === t
          const tc = t !== 'all' ? THEME_COLOURS[t] : null
          return (
            <button
              key={t}
              onClick={() => setThemeFilter(t)}
              className="px-4 py-2 rounded-full text-xs font-semibold font-[family-name:var(--font-jetbrains)] tracking-wide
                         transition-all duration-200 flex items-center gap-1.5"
              style={isActive
                ? { background: 'var(--contrast-bg)', color: 'var(--contrast-text)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                : { background: 'var(--admin-card-bg)', color: 'var(--body-text)', opacity: 0.6, border: '1px solid var(--admin-border)' }
              }
            >
              {tc && !isActive && <span className={`w-2 h-2 rounded-full ${tc.dot}`} />}
              {t === 'all' ? 'All Branches' : tc!.short}
            </button>
          )
        })}
      </div>

      {/* ── Content ── */}
      {view === 'skills' ? (
        <SkillsSummary skills={filteredSkills} />
      ) : (
        <div>
          {eraGroups.length === 0 ? (
            <p className="text-sm py-8" style={{ color: 'var(--body-text)', opacity: 0.5 }}>No results found.</p>
          ) : (
            <div className="space-y-2">
              {eraGroups.map((era, eraIdx) => (
                <EraGroup key={era.id} era={era} eraIdx={eraIdx} isAdmin={isAdmin} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Era group ───────────────────────────────────────────────────────────────

interface EraGroupData {
  id: string
  name: string
  accent: string
  meta: string
  roles: SerializedRole[]
}

function EraGroup({ era, eraIdx, isAdmin }: { era: EraGroupData; eraIdx: number; isAdmin: boolean }) {
  return (
    <div className="mb-8">
      {/* Era band header */}
      <div
        className="flex items-center gap-4 px-5 py-3 rounded-lg mb-4"
        style={{
          background: `${era.accent}10`,
          border: `1px solid ${era.accent}25`,
        }}
      >
        <span
          className="font-[family-name:var(--font-jetbrains)] text-lg font-bold tracking-tight"
          style={{ color: era.accent }}
        >
          {era.id}
        </span>
        <div className="flex-1 min-w-0">
          <span
            className="font-[family-name:var(--font-inter)] text-sm font-semibold"
            style={{ color: 'var(--heading)' }}
          >
            {era.name}
          </span>
          <span
            className="font-[family-name:var(--font-jetbrains)] text-xs ml-3"
            style={{ color: 'var(--body-text)', opacity: 0.45 }}
          >
            {era.meta}
          </span>
        </div>
        <span
          className="font-[family-name:var(--font-jetbrains)] text-[10px] tracking-wider uppercase"
          style={{ color: era.accent, opacity: 0.6 }}
        >
          {era.roles.length} role{era.roles.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Roles with vertical rail */}
      <div className="relative ml-2 sm:ml-4">
        {/* Continuous vertical rail */}
        <div
          className="absolute left-[18px] top-0 bottom-0 w-[2px] sm:left-[22px]"
          style={{ background: `${era.accent}30` }}
        />

        {era.roles.map((role, roleIdx) => (
          <RoleCard
            key={role.id}
            role={role}
            accent={era.accent}
            roleIdx={roleIdx}
            eraIdx={eraIdx}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  )
}

// ── Role card ───────────────────────────────────────────────────────────────

function RoleCard({ role, accent, roleIdx, eraIdx, isAdmin }: {
  role: SerializedRole; accent: string; roleIdx: number; eraIdx: number; isAdmin: boolean
}) {
  const router = useRouter()
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [editingRole, setEditingRole] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState<string | null>(null)
  const [addingAchievement, setAddingAchievement] = useState(false)

  const emp = EMPLOYMENT_COLOURS[role.employmentType] ?? EMPLOYMENT_COLOURS.employed

  // Scroll-reveal
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { setVisible(true); return }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const delay = eraIdx * 120 + roleIdx * 80

  return (
    <article
      ref={ref}
      className="relative grid grid-cols-[40px_1fr] gap-x-3 sm:grid-cols-[48px_1fr] sm:gap-x-4 pb-8 last:pb-2 group/role"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {/* Dot + ref number */}
      <div className="relative flex flex-col items-center pt-1">
        {/* Dot */}
        <span
          className="w-[15px] h-[15px] rounded-full z-10 shrink-0"
          style={role.isCurrent
            ? { background: accent, boxShadow: `0 0 0 4px ${accent}20` }
            : { background: 'var(--bg)', border: `2px solid ${accent}` }
          }
        />
        {/* Ref number */}
        <span
          className="font-[family-name:var(--font-jetbrains)] text-[10px] font-bold mt-1.5 px-1.5 py-0.5 rounded hidden sm:block"
          style={{ color: accent, border: `1px solid ${accent}40` }}
        >
          {role.sortOrder}
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0">
        {/* Header */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="font-[family-name:var(--font-inter)] font-semibold text-base sm:text-lg leading-tight"
              style={{ color: 'var(--heading)' }}>
            {role.title}
          </h3>
          <span className="text-sm" style={{ color: 'var(--body-text)', opacity: 0.4 }}>at</span>
          <span className="font-[family-name:var(--font-inter)] font-semibold text-base sm:text-lg"
                style={{ color: 'var(--heading)' }}>
            {role.company}
          </span>
          {role.isCurrent && (
            <span
              className="font-[family-name:var(--font-jetbrains)] text-[10px] tracking-widest uppercase
                         px-2.5 py-0.5 rounded-full font-bold text-white"
              style={{ background: accent }}
            >
              Now
            </span>
          )}
          {isAdmin && (
            <button
              onClick={() => setEditingRole(!editingRole)}
              className="opacity-0 group-hover/role:opacity-60 hover:!opacity-100 transition-opacity ml-1"
              title="Edit role"
            >
              <PencilIcon size={13} />
            </button>
          )}
        </div>

        {/* Meta */}
        <p className="font-[family-name:var(--font-jetbrains)] text-xs mt-0.5"
           style={{ color: 'var(--body-text)', opacity: 0.45 }}>
          {formatDateRange(role.startDate, role.endDate)}
          <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${emp.bg} ${emp.text}`}>
            {role.employmentType === 'self-employed' ? 'Self-Employed' : 'Employed'}
          </span>
        </p>

        {/* Summary */}
        <p className="text-sm leading-relaxed mt-2 max-w-prose" style={{ color: 'var(--body-text)' }}>
          {role.summary}
        </p>

        {/* Inline role edit form */}
        {isAdmin && editingRole && (
          <InlineRoleEditForm
            role={role}
            onClose={() => setEditingRole(false)}
            onSaved={() => { setEditingRole(false); router.refresh() }}
          />
        )}

        {/* Achievement branch */}
        {role.achievements.length > 0 && (
          <div className="mt-4 relative ml-2">
            {/* Achievement sub-rail */}
            <div
              className="absolute left-[6px] top-0 bottom-0 w-px"
              style={{ background: `${accent}25` }}
            />

            <div className="space-y-3">
              {role.achievements.map((a, aIdx) => (
                <AchievementItem
                  key={a.id}
                  achievement={a}
                  roleSort={role.sortOrder}
                  accent={accent}
                  aIdx={aIdx}
                  isAdmin={isAdmin}
                  isEditing={editingAchievement === a.id}
                  onEdit={() => setEditingAchievement(editingAchievement === a.id ? null : a.id)}
                  onSaved={() => { setEditingAchievement(null); router.refresh() }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Admin: Add achievement button */}
        {isAdmin && (
          <div className="mt-3 ml-2">
            {addingAchievement ? (
              <InlineAchievementEditForm
                roleId={role.id}
                roleSort={role.sortOrder}
                nextSort={role.achievements.length + 1}
                onClose={() => setAddingAchievement(false)}
                onSaved={() => { setAddingAchievement(false); router.refresh() }}
              />
            ) : (
              <button
                onClick={() => setAddingAchievement(true)}
                className="opacity-0 group-hover/role:opacity-60 hover:!opacity-100 transition-opacity
                           font-[family-name:var(--font-jetbrains)] text-[10px] tracking-wider uppercase
                           px-2.5 py-1 rounded"
                style={{ color: accent, border: `1px dashed ${accent}40` }}
              >
                + Add Achievement
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

// ── Achievement item ────────────────────────────────────────────────────────

function AchievementItem({ achievement: a, roleSort, accent, aIdx, isAdmin, isEditing, onEdit, onSaved }: {
  achievement: SerializedAchievement; roleSort: number; accent: string; aIdx: number
  isAdmin: boolean; isEditing: boolean; onEdit: () => void; onSaved: () => void
}) {
  const tc = THEME_COLOURS[a.theme] ?? THEME_COLOURS.operational

  return (
    <div className="relative pl-5 group/ach">
      {/* Horizontal connector */}
      <div
        className="absolute left-[6px] top-[10px] w-3 h-px"
        style={{ background: `${accent}35` }}
      />
      {/* Junction dot */}
      <div
        className="absolute left-[3px] top-[7px] w-[7px] h-[7px] rounded-full"
        style={{ background: `${accent}50` }}
      />

      {/* Ref number + theme badge row */}
      <div className="flex items-center gap-2 mb-0.5">
        <span
          className="font-[family-name:var(--font-jetbrains)] text-[10px] hidden sm:inline"
          style={{ color: 'var(--body-text)', opacity: 0.35 }}
        >
          {roleSort}.{a.sortOrder}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
          font-[family-name:var(--font-jetbrains)] ${tc.bg} ${tc.text}`}
          style={{ border: `1px solid ${tc.dot.replace('bg-[', '').replace(']', '')}20` }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
          {tc.short}
        </span>

        {isAdmin && (
          <button
            onClick={onEdit}
            className="opacity-0 group-hover/ach:opacity-60 hover:!opacity-100 transition-opacity"
            title="Edit achievement"
          >
            <PencilIcon size={11} />
          </button>
        )}
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
        {a.description}
      </p>

      {/* Skill tags */}
      {a.skillTags && a.skillTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {a.skillTags.map(tag => (
            <span key={tag} className="font-[family-name:var(--font-jetbrains)] text-[10px] px-2 py-0.5 rounded"
                  style={{ background: 'var(--admin-card-bg)', color: 'var(--body-text)', opacity: 0.6 }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* WOLF|BOT comment */}
      {a.wolfbotComment && (
        <p className="font-[family-name:var(--font-jetbrains)] text-xs text-[#A0622A] mt-1.5 italic" style={{ opacity: 0.7 }}>
          {a.wolfbotComment}
        </p>
      )}

      {/* Inline edit form */}
      {isAdmin && isEditing && (
        <InlineAchievementEditForm
          achievement={a}
          roleId={a.roleId}
          roleSort={roleSort}
          onClose={onEdit}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

// ── Inline role edit form ───────────────────────────────────────────────────

function InlineRoleEditForm({ role, onClose, onSaved }: {
  role: SerializedRole; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({
    title: role.title,
    company: role.company,
    employmentType: role.employmentType,
    startDate: role.startDate,
    endDate: role.endDate ?? '',
    summary: role.summary,
    sortOrder: role.sortOrder,
    isCurrent: role.isCurrent,
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/career', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'role', id: role.id, ...form, endDate: form.endDate || null }),
    })
    if (res.ok) onSaved()
    setSaving(false)
  }

  const remove = async () => {
    if (!confirm('Delete this role and all its achievements?')) return
    setSaving(true)
    await fetch(`/api/admin/career?type=role&id=${role.id}`, { method: 'DELETE' })
    onSaved()
  }

  return (
    <div className="mt-3 p-4 rounded-lg space-y-3" style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)' }}>
      <p className="font-[family-name:var(--font-jetbrains)] text-[10px] font-bold uppercase tracking-wider text-[#A0622A]">Edit Role</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormInput label="Title" value={form.title} onChange={v => setForm({ ...form, title: v })} />
        <FormInput label="Company" value={form.company} onChange={v => setForm({ ...form, company: v })} />
        <FormSelect label="Employment" value={form.employmentType} onChange={v => setForm({ ...form, employmentType: v })}
          options={[{ value: 'employed', label: 'Employed' }, { value: 'self-employed', label: 'Self-Employed' }]} />
        <FormInput label="Sort Order" value={String(form.sortOrder)} onChange={v => setForm({ ...form, sortOrder: parseInt(v) || 0 })} type="number" />
        <FormInput label="Start Date" value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} placeholder="YYYY-MM" />
        <FormInput label="End Date" value={form.endDate} onChange={v => setForm({ ...form, endDate: v })} placeholder="blank = current" />
      </div>
      <FormTextArea label="Summary" value={form.summary} onChange={v => setForm({ ...form, summary: v })} />
      <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--body-text)' }}>
        <input type="checkbox" checked={form.isCurrent} onChange={e => setForm({ ...form, isCurrent: e.target.checked })} />
        Current role
      </label>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="text-xs px-4 py-2 rounded bg-[#214459] text-white hover:bg-[#214459]/90 disabled:opacity-50 font-[family-name:var(--font-jetbrains)]">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onClose} className="text-xs px-4 py-2 rounded font-[family-name:var(--font-jetbrains)]"
          style={{ border: '1px solid var(--admin-border)', color: 'var(--body-text)' }}>
          Cancel
        </button>
        <button onClick={remove} disabled={saving} className="text-xs px-4 py-2 rounded text-[#A82020] hover:bg-[#A82020]/10 font-[family-name:var(--font-jetbrains)] ml-auto">
          Delete
        </button>
      </div>
    </div>
  )
}

// ── Inline achievement edit form ────────────────────────────────────────────

function InlineAchievementEditForm({ achievement, roleId, roleSort, nextSort, onClose, onSaved }: {
  achievement?: SerializedAchievement; roleId: string; roleSort: number; nextSort?: number
  onClose: () => void; onSaved: () => void
}) {
  const isNew = !achievement
  const [form, setForm] = useState({
    theme: achievement?.theme ?? 'data-analytics',
    description: achievement?.description ?? '',
    skillTagsStr: achievement?.skillTags?.join(', ') ?? '',
    sortOrder: achievement?.sortOrder ?? nextSort ?? 1,
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const skillTags = form.skillTagsStr.split(',').map(s => s.trim()).filter(Boolean)
    const method = isNew ? 'POST' : 'PUT'
    const body = isNew
      ? { type: 'achievement', roleId, theme: form.theme, description: form.description, skillTags, sortOrder: form.sortOrder }
      : { type: 'achievement', id: achievement!.id, roleId, theme: form.theme, description: form.description, skillTags, sortOrder: form.sortOrder }
    const res = await fetch('/api/admin/career', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) onSaved()
    setSaving(false)
  }

  const remove = async () => {
    if (!achievement || !confirm('Delete this achievement?')) return
    setSaving(true)
    await fetch(`/api/admin/career?type=achievement&id=${achievement.id}`, { method: 'DELETE' })
    onSaved()
  }

  return (
    <div className="mt-3 p-4 rounded-lg space-y-3" style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)' }}>
      <p className="font-[family-name:var(--font-jetbrains)] text-[10px] font-bold uppercase tracking-wider text-[#A0622A]">
        {isNew ? 'New Achievement' : 'Edit Achievement'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormSelect label="Theme" value={form.theme} onChange={v => setForm({ ...form, theme: v })}
          options={THEMES_LIST} />
        <FormInput label="Sort Order" value={String(form.sortOrder)} onChange={v => setForm({ ...form, sortOrder: parseInt(v) || 0 })} type="number" />
      </div>
      <FormTextArea label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} />
      <FormInput label="Skill Tags (comma-separated)" value={form.skillTagsStr} onChange={v => setForm({ ...form, skillTagsStr: v })}
        placeholder="SQL, Power BI, Stakeholder Management" />
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="text-xs px-4 py-2 rounded bg-[#214459] text-white hover:bg-[#214459]/90 disabled:opacity-50 font-[family-name:var(--font-jetbrains)]">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onClose} className="text-xs px-4 py-2 rounded font-[family-name:var(--font-jetbrains)]"
          style={{ border: '1px solid var(--admin-border)', color: 'var(--body-text)' }}>
          Cancel
        </button>
        {!isNew && (
          <button onClick={remove} disabled={saving} className="text-xs px-4 py-2 rounded text-[#A82020] hover:bg-[#A82020]/10 font-[family-name:var(--font-jetbrains)] ml-auto">
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

// ── Shared form primitives (theme-aware) ────────────────────────────────────

function FormInput({ label, value, onChange, ...props }: {
  label: string; value: string; onChange: (v: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="block">
      <span className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider" style={{ color: 'var(--body-text)', opacity: 0.5 }}>{label}</span>
      <input
        {...props}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#A0622A]/30"
        style={{ background: 'var(--bg)', border: '1px solid var(--admin-border)', color: 'var(--body-text)' }}
      />
    </label>
  )
}

function FormTextArea({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider" style={{ color: 'var(--body-text)', opacity: 0.5 }}>{label}</span>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className="mt-1 w-full px-3 py-2 rounded text-sm resize-y focus:outline-none focus:ring-1 focus:ring-[#A0622A]/30"
        style={{ background: 'var(--bg)', border: '1px solid var(--admin-border)', color: 'var(--body-text)' }}
      />
    </label>
  )
}

function FormSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider" style={{ color: 'var(--body-text)', opacity: 0.5 }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#A0622A]/30"
        style={{ background: 'var(--bg)', border: '1px solid var(--admin-border)', color: 'var(--body-text)' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

// ── Icons ───────────────────────────────────────────────────────────────────

function PencilIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
         style={{ color: 'var(--body-text)' }}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
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
