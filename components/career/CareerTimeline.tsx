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
  { id: 'III', name: 'The canopy',    accent: [200,176,32],  meta: '2023 → now · Engineering at scale',  range: [15, 99] as const },
  { id: 'II',  name: 'Branching out', accent: [144,144,144], meta: '2013 → 2023 · Ventures & analytics', range: [8, 14]  as const },
  { id: 'I',   name: 'The roots',     accent: [160,98,42],   meta: '1997 → 2013 · Foundations',           range: [1, 7]   as const },
]

// ── Colour helpers ──────────────────────────────────────────────────────────

function rgba(rgb: number[], a: number) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`
}

function hex(rgb: number[]) {
  return `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`
}

// ── Theme colour maps ───────────────────────────────────────────────────────

const THEME_COLOURS: Record<string, { rgb: number[]; label: string; short: string }> = {
  'change-management': { rgb: [58,184,122],  label: 'Change Management', short: 'CHANGE' },
  'data-analytics':    { rgb: [42,106,176],  label: 'Data & Analytics',  short: 'DATA' },
  operational:         { rgb: [200,176,32],  label: 'Operational',        short: 'OPS' },
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
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search roles, achievements, skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2
                     font-[family-name:var(--font-inter)]"
          style={{
            background: 'var(--admin-card-bg)',
            border: '1px solid var(--admin-border)',
            color: 'var(--body-text)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
          }}
        />
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4 font-[family-name:var(--font-jetbrains)] text-[11px]"
           style={{ color: 'var(--body-text)', opacity: 0.5 }}>
        {ERAS.map(era => (
          <span key={era.id} className="flex items-center gap-2">
            <span className="w-[10px] h-[10px] rounded-full" style={{ background: hex(era.accent) }} />
            {era.name}
          </span>
        ))}
        <span style={{ opacity: 0.7 }}>ref = role · ref.n = branch</span>
      </div>

      {/* ── Filter pills ── */}
      <div className="flex flex-wrap gap-2 mb-8 pt-4"
           style={{ borderTop: '1px solid var(--admin-border)' }}>
        {/* View toggle */}
        {(['timeline', 'skills'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className="px-4 py-2 rounded-full text-xs font-medium font-[family-name:var(--font-jetbrains)] tracking-wide
                       transition-all duration-200"
            style={view === v
              ? { background: 'var(--contrast-bg)', color: 'var(--contrast-text)' }
              : { background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--body-text)', opacity: 0.6 }
            }
          >
            {v === 'timeline' ? 'Timeline' : 'Skills'}
          </button>
        ))}

        <span className="w-px h-7 self-center mx-1" style={{ background: 'var(--admin-border)' }} />

        {/* Theme filters */}
        {(['all', 'change-management', 'data-analytics', 'operational'] as const).map(t => {
          const isActive = themeFilter === t
          const tc = t !== 'all' ? THEME_COLOURS[t] : null
          return (
            <button
              key={t}
              onClick={() => setThemeFilter(t)}
              aria-pressed={isActive}
              className="px-4 py-2 rounded-full text-xs font-medium font-[family-name:var(--font-jetbrains)] tracking-wide
                         transition-all duration-200 flex items-center gap-1.5"
              style={isActive
                ? { background: 'var(--contrast-bg)', color: 'var(--contrast-text)' }
                : { background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--body-text)', opacity: 0.6 }
              }
            >
              {tc && !isActive && (
                <span className="w-2 h-2 rounded-full" style={{ background: hex(tc.rgb) }} />
              )}
              {t === 'all' ? 'All branches' : tc!.short}
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
            <div>
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
  accent: number[]
  meta: string
  roles: SerializedRole[]
}

function EraGroup({ era, eraIdx, isAdmin }: { era: EraGroupData; eraIdx: number; isAdmin: boolean }) {
  const accentHex = hex(era.accent)

  return (
    <div style={{ marginBottom: '48px' }}>
      {/* Era band header */}
      <div
        className="flex items-baseline gap-3 sm:gap-4"
        style={{ margin: eraIdx === 0 ? '0 0 24px' : '48px 0 24px' }}
      >
        <span
          className="font-[family-name:var(--font-jetbrains)] text-xs font-medium tracking-widest"
          style={{ color: accentHex }}
        >
          {era.id}
        </span>
        <span
          className="font-[family-name:var(--font-inter)] text-lg sm:text-xl font-semibold tracking-tight"
          style={{ color: 'var(--heading)' }}
        >
          {era.name}
        </span>
        <span
          className="font-[family-name:var(--font-jetbrains)] text-xs ml-auto text-right hidden sm:block"
          style={{ color: 'var(--body-text)', opacity: 0.35 }}
        >
          {era.meta}
        </span>
      </div>

      {/* Roles with vertical rail */}
      <div className="relative">
        {era.roles.map((role, roleIdx) => (
          <RoleCard
            key={role.id}
            role={role}
            accent={era.accent}
            roleIdx={roleIdx}
            eraIdx={eraIdx}
            isLast={roleIdx === era.roles.length - 1}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  )
}

// ── Role card ───────────────────────────────────────────────────────────────

function RoleCard({ role, accent, roleIdx, eraIdx, isLast, isAdmin }: {
  role: SerializedRole; accent: number[]; roleIdx: number; eraIdx: number; isLast: boolean; isAdmin: boolean
}) {
  const router = useRouter()
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [editingRole, setEditingRole] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState<string | null>(null)
  const [addingAchievement, setAddingAchievement] = useState(false)

  const accentHex = hex(accent)

  // Scroll-reveal
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const delay = eraIdx * 100 + roleIdx * 80

  return (
    <article
      ref={ref}
      className="relative grid group/role"
      style={{
        gridTemplateColumns: '44px 1fr',
        columnGap: 'clamp(10px, 2.5vw, 22px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(10px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {/* ── Rail column ── */}
      <div className="relative">
        {/* Vertical rail line */}
        <div
          className="absolute top-0 w-[2px]"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: isLast ? 'auto' : '-2px',
            height: isLast ? '34px' : undefined,
            background: 'var(--admin-border)',
          }}
        />
        {/* Dot */}
        <div
          className="absolute w-[15px] h-[15px] rounded-full z-10"
          style={{
            left: '50%',
            top: '6px',
            transform: 'translateX(-50%)',
            ...(role.isCurrent
              ? { background: accentHex, boxShadow: `0 0 0 5px ${rgba(accent, 0.16)}` }
              : { background: 'var(--bg)', border: `2.5px solid ${accentHex}` }
            ),
          }}
        />
      </div>

      {/* ── Main content column ── */}
      <div style={{ paddingBottom: isLast ? '6px' : '30px', minWidth: 0 }}>
        {/* Role header row */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {/* Ref badge */}
          <span
            className="font-[family-name:var(--font-jetbrains)] text-xs font-medium tracking-wide hidden sm:inline-block"
            style={{
              color: accentHex,
              border: `1px solid ${rgba(accent, 0.35)}`,
              borderRadius: '5px',
              padding: '1px 7px',
            }}
          >
            {role.sortOrder}
          </span>

          <span className="font-[family-name:var(--font-inter)] font-semibold text-base sm:text-lg tracking-tight"
                style={{ color: 'var(--heading)' }}>
            {role.title}
          </span>
          <span className="text-sm" style={{ color: 'var(--body-text)', opacity: 0.35 }}>at</span>
          <span className="font-[family-name:var(--font-inter)] font-semibold text-base sm:text-lg"
                style={{ color: 'var(--heading)' }}>
            {role.company}
          </span>
          {role.isCurrent && (
            <span
              className="font-[family-name:var(--font-jetbrains)] text-[10px] tracking-widest uppercase
                         px-2.5 py-0.5 rounded-full font-bold text-white self-center"
              style={{ background: accentHex }}
            >
              Now
            </span>
          )}
          {isAdmin && (
            <button
              onClick={() => setEditingRole(!editingRole)}
              className="opacity-0 group-hover/role:opacity-50 hover:!opacity-100 transition-opacity"
              title="Edit role"
            >
              <PencilIcon size={13} />
            </button>
          )}
        </div>

        {/* Meta line */}
        <p className="font-[family-name:var(--font-jetbrains)] text-xs mt-1"
           style={{ color: 'var(--body-text)', opacity: 0.35 }}>
          {formatDateRange(role.startDate, role.endDate)}
          {' · '}
          {role.employmentType === 'self-employed' ? 'Self-Employed' : 'Employed'}
        </p>

        {/* Summary */}
        <p className="text-[15px] leading-relaxed mt-2" style={{ color: 'var(--body-text)', opacity: 0.7, maxWidth: '62ch' }}>
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

        {/* ── Achievement branches ── */}
        {role.achievements.length > 0 && (
          <div
            className="relative mt-4"
            style={{ paddingLeft: '20px' }}
          >
            {/* Branch sub-rail */}
            <div
              className="absolute top-[2px] w-[1.5px]"
              style={{
                left: '3px',
                bottom: '13px',
                background: rgba(accent, 0.25),
              }}
            />

            {role.achievements.map(a => (
              <AchievementItem
                key={a.id}
                achievement={a}
                roleSort={role.sortOrder}
                accent={accent}
                isAdmin={isAdmin}
                isEditing={editingAchievement === a.id}
                onEdit={() => setEditingAchievement(editingAchievement === a.id ? null : a.id)}
                onSaved={() => { setEditingAchievement(null); router.refresh() }}
              />
            ))}
          </div>
        )}

        {/* Admin: Add achievement */}
        {isAdmin && (
          <div className="mt-3" style={{ marginLeft: '20px' }}>
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
                className="opacity-0 group-hover/role:opacity-50 hover:!opacity-100 transition-opacity
                           font-[family-name:var(--font-jetbrains)] text-[10px] tracking-wider uppercase
                           px-2.5 py-1 rounded"
                style={{ color: accentHex, border: `1px dashed ${rgba(accent, 0.35)}` }}
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

function AchievementItem({ achievement: a, roleSort, accent, isAdmin, isEditing, onEdit, onSaved }: {
  achievement: SerializedAchievement; roleSort: number; accent: number[]
  isAdmin: boolean; isEditing: boolean; onEdit: () => void; onSaved: () => void
}) {
  const tc = THEME_COLOURS[a.theme] ?? THEME_COLOURS.operational

  return (
    <div
      className="relative group/ach"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr',
        alignItems: 'start',
        gap: '10px',
        padding: '7px 0',
      }}
    >
      {/* Horizontal connector (pseudo-element replacement) */}
      <div
        className="absolute"
        style={{
          left: '-17px',
          top: '15px',
          width: '15px',
          height: '1.5px',
          background: rgba(accent, 0.25),
        }}
      />

      {/* Ref number */}
      <span
        className="font-[family-name:var(--font-jetbrains)] text-[11px] pt-[1px] whitespace-nowrap hidden sm:block"
        style={{ color: 'var(--body-text)', opacity: 0.3 }}
      >
        {roleSort}.{a.sortOrder}
      </span>

      {/* Theme badge */}
      <span
        className="font-[family-name:var(--font-jetbrains)] text-[10px] font-bold tracking-widest uppercase
                   whitespace-nowrap mt-[1px] px-2 py-0.5 rounded"
        style={{
          color: hex(tc.rgb),
          background: rgba(tc.rgb, 0.12),
        }}
      >
        {tc.short}
      </span>

      {/* Description + tags + wolfbot */}
      <div style={{ maxWidth: '62ch' }}>
        <p className="text-[15px] leading-relaxed" style={{ color: 'var(--body-text)' }}>
          {a.description}
          {isAdmin && (
            <button
              onClick={onEdit}
              className="opacity-0 group-hover/ach:opacity-50 hover:!opacity-100 transition-opacity ml-2 align-middle"
              title="Edit achievement"
            >
              <PencilIcon size={11} />
            </button>
          )}
        </p>

        {/* Skill tags */}
        {a.skillTags && a.skillTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {a.skillTags.map(tag => (
              <span key={tag}
                className="font-[family-name:var(--font-jetbrains)] text-[10px] px-2 py-0.5 rounded"
                style={{ background: 'var(--admin-card-bg)', color: 'var(--body-text)', opacity: 0.55 }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* WOLF|BOT comment */}
        {a.wolfbotComment && (
          <p className="font-[family-name:var(--font-jetbrains)] text-xs mt-2 italic"
             style={{ color: '#A0622A', opacity: 0.7 }}>
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

// ── Shared form primitives ──────────────────────────────────────────────────

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
