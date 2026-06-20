'use client'

import { useState, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Role {
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
}

interface Achievement {
  id: string
  roleId: string
  theme: string
  description: string
  skillTags: string[] | null
  sortOrder: number
  wolfbotComment: string | null
  createdAt: string
}

interface Skill {
  id: string
  name: string
  theme: string
  source: string
  firstUsedDate: string | null
  description: string | null
  wolfbotComment: string | null
  createdAt: string
}

interface Props {
  initialData: {
    roles: Role[]
    achievements: Achievement[]
    skills: Skill[]
  }
}

type Tab = 'jobs' | 'achievements' | 'skills'

const THEMES = [
  { value: 'change-management', label: 'Change Management' },
  { value: 'data-analytics', label: 'Data & Analytics' },
  { value: 'operational', label: 'Operational' },
]

// ── Main component ──────────────────────────────────────────────────────────

export default function CareerAdminTabs({ initialData }: Props) {
  const [tab, setTab] = useState<Tab>('jobs')
  const [roles, setRoles] = useState(initialData.roles)
  const [achievements, setAchievements] = useState(initialData.achievements)
  const [skills, setSkills] = useState(initialData.skills)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [reviewSummary, setReviewSummary] = useState('')

  const flash = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 5000)
  }, [])

  const reload = useCallback(async () => {
    const res = await fetch('/api/admin/career')
    if (res.ok) {
      const data = await res.json()
      setRoles(data.roles)
      setAchievements(data.achievements)
      setSkills(data.skills)
    }
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-[#4A4A4A] font-[family-name:var(--font-inter)]">
          Career Admin
        </h1>
        <button
          onClick={async () => {
            setReviewing(true)
            setReviewSummary('')
            try {
              const res = await fetch('/api/admin/career-review', { method: 'POST' })
              const data = await res.json()
              if (res.ok) {
                setReviewSummary(data.summary)
                await reload()
                flash(`WOLF|BOT reviewed ${data.updatedCount} items (${data.inputTokens}→${data.outputTokens} tokens)`)
              } else {
                flash(`Error: ${data.error}`)
              }
            } catch {
              flash('Failed to reach WOLF|BOT')
            }
            setReviewing(false)
          }}
          disabled={reviewing}
          className="text-sm px-4 py-2 rounded bg-[#A0622A] text-white hover:bg-[#A0622A]/90 disabled:opacity-50 font-[family-name:var(--font-jetbrains)]"
        >
          {reviewing ? 'WOLF|BOT reviewing...' : 'Generate WOLF|BOT Review'}
        </button>
      </div>

      {/* WOLF|BOT summary */}
      {reviewSummary && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-[#A0622A]/5 border border-[#A0622A]/20">
          <p className="text-xs font-bold text-[#A0622A] uppercase tracking-wider font-[family-name:var(--font-jetbrains)] mb-1">
            WOLF|BOT Career Summary
          </p>
          <p className="text-sm text-[#4A4A4A] font-[family-name:var(--font-jetbrains)] leading-relaxed">
            {reviewSummary}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#e8e3de]">
        {([['jobs', 'Jobs'], ['achievements', 'Achievements'], ['skills', 'Manual Skills']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
              ${tab === key
                ? 'border-[#A0622A] text-[#A0622A]'
                : 'border-transparent text-[#909090] hover:text-[#4A4A4A]'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Flash message */}
      {message && (
        <div className="mb-4 px-3 py-2 rounded bg-[#3AB87A]/10 text-[#3AB87A] text-sm font-medium">
          {message}
        </div>
      )}

      {tab === 'jobs' && (
        <JobsTab roles={roles} saving={saving} setSaving={setSaving} flash={flash} reload={reload} />
      )}
      {tab === 'achievements' && (
        <AchievementsTab roles={roles} achievements={achievements} saving={saving} setSaving={setSaving} flash={flash} reload={reload} />
      )}
      {tab === 'skills' && (
        <SkillsTab skills={skills} saving={saving} setSaving={setSaving} flash={flash} reload={reload} />
      )}
    </div>
  )
}

// ── Jobs Tab ─────────────────────────────────────────────────────────────────

function JobsTab({ roles, saving, setSaving, flash, reload }: {
  roles: Role[]; saving: boolean; setSaving: (v: boolean) => void; flash: (m: string) => void; reload: () => Promise<void>
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Role>>({})
  const [adding, setAdding] = useState(false)

  const startEdit = (r: Role) => { setEditing(r.id); setForm(r); setAdding(false) }
  const startAdd = () => { setAdding(true); setEditing(null); setForm({ employmentType: 'employed', isCurrent: false, sortOrder: 0 }) }
  const cancel = () => { setEditing(null); setAdding(false); setForm({}) }

  const save = async () => {
    setSaving(true)
    const method = adding ? 'POST' : 'PUT'
    const body = adding
      ? { type: 'role', ...form }
      : { type: 'role', id: editing, ...form }
    const res = await fetch('/api/admin/career', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) { await reload(); cancel(); flash(adding ? 'Role created' : 'Role updated') }
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this role and all its achievements?')) return
    setSaving(true)
    await fetch(`/api/admin/career?type=role&id=${id}`, { method: 'DELETE' })
    await reload()
    flash('Role deleted')
    setSaving(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[#909090]">{roles.length} roles</p>
        <button onClick={startAdd} className="text-sm px-3 py-1.5 rounded bg-[#214459] text-white hover:bg-[#214459]/90">
          + Add Role
        </button>
      </div>

      {(adding || editing) && (
        <RoleForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} isNew={adding} />
      )}

      <div className="space-y-2">
        {roles.map(r => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#faf8f5] border border-[#f0ebe6]">
            <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#909090] w-6 text-right">
              {r.sortOrder}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#4A4A4A] truncate">{r.title} <span className="text-[#909090] font-normal">at {r.company}</span></p>
              <p className="text-xs text-[#909090] font-[family-name:var(--font-jetbrains)]">
                {r.startDate} → {r.endDate ?? 'present'} · {r.employmentType}
              </p>
            </div>
            <button onClick={() => startEdit(r)} className="text-xs text-[#4A7FA5] hover:underline">Edit</button>
            <button onClick={() => remove(r.id)} className="text-xs text-[#A82020] hover:underline">Del</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Role Form ────────────────────────────────────────────────────────────────

function RoleForm({ form, setForm, onSave, onCancel, saving, isNew }: {
  form: Partial<Role>; setForm: (f: Partial<Role>) => void
  onSave: () => void; onCancel: () => void; saving: boolean; isNew: boolean
}) {
  const f = (key: keyof Role) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value })

  return (
    <div className="mb-6 p-4 rounded-lg border border-[#A0622A]/30 bg-white space-y-3">
      <p className="text-sm font-semibold text-[#A0622A]">{isNew ? 'New Role' : 'Edit Role'}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Title" value={form.title ?? ''} onChange={f('title')} />
        <Input label="Company" value={form.company ?? ''} onChange={f('company')} />
        <Select label="Employment Type" value={form.employmentType ?? 'employed'} onChange={f('employmentType')}
          options={[{ value: 'employed', label: 'Employed' }, { value: 'self-employed', label: 'Self-Employed' }]} />
        <Input label="Sort Order" value={String(form.sortOrder ?? 0)} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} type="number" />
        <Input label="Start Date (YYYY-MM)" value={form.startDate ?? ''} onChange={f('startDate')} placeholder="2023-12" />
        <Input label="End Date (YYYY-MM)" value={form.endDate ?? ''} onChange={f('endDate')} placeholder="blank = current" />
      </div>
      <TextArea label="Summary" value={form.summary ?? ''} onChange={f('summary')} />
      <label className="flex items-center gap-2 text-sm text-[#4A4A4A]">
        <input type="checkbox" checked={form.isCurrent ?? false} onChange={e => setForm({ ...form, isCurrent: e.target.checked })} />
        Current role
      </label>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving} className="text-sm px-4 py-2 rounded bg-[#214459] text-white hover:bg-[#214459]/90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="text-sm px-4 py-2 rounded border border-[#e8e3de] text-[#909090] hover:text-[#4A4A4A]">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Achievements Tab ─────────────────────────────────────────────────────────

function AchievementsTab({ roles, achievements, saving, setSaving, flash, reload }: {
  roles: Role[]; achievements: Achievement[]; saving: boolean; setSaving: (v: boolean) => void
  flash: (m: string) => void; reload: () => Promise<void>
}) {
  const [selectedRole, setSelectedRole] = useState(roles[0]?.id ?? '')
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Achievement & { skillTagsStr: string }>>({})
  const [adding, setAdding] = useState(false)

  const filtered = achievements.filter(a => a.roleId === selectedRole)
  const role = roles.find(r => r.id === selectedRole)

  const startEdit = (a: Achievement) => {
    setEditing(a.id)
    setForm({ ...a, skillTagsStr: a.skillTags?.join(', ') ?? '' })
    setAdding(false)
  }
  const startAdd = () => {
    setAdding(true); setEditing(null)
    setForm({ roleId: selectedRole, theme: 'data-analytics', sortOrder: filtered.length + 1, skillTagsStr: '' })
  }
  const cancel = () => { setEditing(null); setAdding(false); setForm({}) }

  const save = async () => {
    setSaving(true)
    const skillTags = (form.skillTagsStr ?? '').split(',').map(s => s.trim()).filter(Boolean)
    const method = adding ? 'POST' : 'PUT'
    const body = adding
      ? { type: 'achievement', roleId: selectedRole, theme: form.theme, description: form.description, skillTags, sortOrder: form.sortOrder }
      : { type: 'achievement', id: editing, roleId: form.roleId, theme: form.theme, description: form.description, skillTags, sortOrder: form.sortOrder }
    const res = await fetch('/api/admin/career', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) { await reload(); cancel(); flash(adding ? 'Achievement created' : 'Achievement updated') }
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this achievement?')) return
    setSaving(true)
    await fetch(`/api/admin/career?type=achievement&id=${id}`, { method: 'DELETE' })
    await reload()
    flash('Achievement deleted')
    setSaving(false)
  }

  return (
    <div>
      {/* Role selector */}
      <div className="mb-4">
        <label className="text-xs text-[#909090] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider block mb-1">
          Select Role
        </label>
        <select
          value={selectedRole}
          onChange={e => { setSelectedRole(e.target.value); cancel() }}
          className="w-full px-3 py-2 rounded border border-[#e8e3de] text-sm text-[#4A4A4A] bg-white"
        >
          {roles.map(r => (
            <option key={r.id} value={r.id}>{r.sortOrder}. {r.title} at {r.company}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[#909090]">
          {filtered.length} achievements for {role?.title ?? ''}
        </p>
        <button onClick={startAdd} className="text-sm px-3 py-1.5 rounded bg-[#214459] text-white hover:bg-[#214459]/90">
          + Add Achievement
        </button>
      </div>

      {(adding || editing) && (
        <AchievementForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} isNew={adding} />
      )}

      <div className="space-y-2">
        {filtered.map(a => (
          <div key={a.id} className="px-4 py-3 rounded-lg bg-[#faf8f5] border border-[#f0ebe6]">
            <div className="flex items-start gap-3">
              <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#909090] w-6 text-right shrink-0 pt-0.5">
                {a.sortOrder}
              </span>
              <div className="flex-1 min-w-0">
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-1
                  font-[family-name:var(--font-jetbrains)]
                  ${a.theme === 'change-management' ? 'bg-[#3AB87A]/10 text-[#3AB87A]' :
                    a.theme === 'data-analytics' ? 'bg-[#2A6AB0]/10 text-[#2A6AB0]' :
                    'bg-[#C8B020]/10 text-[#C8B020]'}`}>
                  {THEMES.find(t => t.value === a.theme)?.label}
                </span>
                <p className="text-sm text-[#4A4A4A]">{a.description}</p>
                {a.skillTags && a.skillTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {a.skillTags.map(t => (
                      <span key={t} className="text-[10px] text-[#909090] bg-[#f0ebe6] px-1.5 py-0.5 rounded font-[family-name:var(--font-jetbrains)]">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => startEdit(a)} className="text-xs text-[#4A7FA5] hover:underline shrink-0">Edit</button>
              <button onClick={() => remove(a.id)} className="text-xs text-[#A82020] hover:underline shrink-0">Del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Achievement Form ─────────────────────────────────────────────────────────

function AchievementForm({ form, setForm, onSave, onCancel, saving, isNew }: {
  form: Partial<Achievement & { skillTagsStr: string }>; setForm: (f: typeof form) => void
  onSave: () => void; onCancel: () => void; saving: boolean; isNew: boolean
}) {
  return (
    <div className="mb-6 p-4 rounded-lg border border-[#A0622A]/30 bg-white space-y-3">
      <p className="text-sm font-semibold text-[#A0622A]">{isNew ? 'New Achievement' : 'Edit Achievement'}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Theme" value={form.theme ?? 'data-analytics'} onChange={e => setForm({ ...form, theme: e.target.value })}
          options={THEMES} />
        <Input label="Sort Order" value={String(form.sortOrder ?? 0)} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} type="number" />
      </div>
      <TextArea label="Description" value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} />
      <Input label="Skill Tags (comma-separated)" value={form.skillTagsStr ?? ''} onChange={e => setForm({ ...form, skillTagsStr: e.target.value })}
        placeholder="SQL, Power BI, Stakeholder Management" />
      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving} className="text-sm px-4 py-2 rounded bg-[#214459] text-white hover:bg-[#214459]/90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="text-sm px-4 py-2 rounded border border-[#e8e3de] text-[#909090] hover:text-[#4A4A4A]">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Skills Tab ───────────────────────────────────────────────────────────────

function SkillsTab({ skills, saving, setSaving, flash, reload }: {
  skills: Skill[]; saving: boolean; setSaving: (v: boolean) => void
  flash: (m: string) => void; reload: () => Promise<void>
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Skill>>({})
  const [adding, setAdding] = useState(false)

  const startEdit = (s: Skill) => { setEditing(s.id); setForm(s); setAdding(false) }
  const startAdd = () => { setAdding(true); setEditing(null); setForm({ theme: 'data-analytics' }) }
  const cancel = () => { setEditing(null); setAdding(false); setForm({}) }

  const save = async () => {
    setSaving(true)
    const method = adding ? 'POST' : 'PUT'
    const body = adding
      ? { type: 'skill', ...form }
      : { type: 'skill', id: editing, ...form }
    const res = await fetch('/api/admin/career', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) { await reload(); cancel(); flash(adding ? 'Skill created' : 'Skill updated') }
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this skill?')) return
    setSaving(true)
    await fetch(`/api/admin/career?type=skill&id=${id}`, { method: 'DELETE' })
    await reload()
    flash('Skill deleted')
    setSaving(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[#909090]">{skills.length} manual skills</p>
        <button onClick={startAdd} className="text-sm px-3 py-1.5 rounded bg-[#214459] text-white hover:bg-[#214459]/90">
          + Add Skill
        </button>
      </div>

      {(adding || editing) && (
        <SkillForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} isNew={adding} />
      )}

      {skills.length === 0 ? (
        <p className="text-sm text-[#909090] py-8 text-center">No manual skills yet. Derived skills come from achievement tags.</p>
      ) : (
        <div className="space-y-2">
          {skills.map(s => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#faf8f5] border border-[#f0ebe6]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#4A4A4A]">{s.name}</p>
                <p className="text-xs text-[#909090] font-[family-name:var(--font-jetbrains)]">
                  {THEMES.find(t => t.value === s.theme)?.label} · {s.firstUsedDate ?? 'no date'}
                </p>
              </div>
              <button onClick={() => startEdit(s)} className="text-xs text-[#4A7FA5] hover:underline">Edit</button>
              <button onClick={() => remove(s.id)} className="text-xs text-[#A82020] hover:underline">Del</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Skill Form ───────────────────────────────────────────────────────────────

function SkillForm({ form, setForm, onSave, onCancel, saving, isNew }: {
  form: Partial<Skill>; setForm: (f: Partial<Skill>) => void
  onSave: () => void; onCancel: () => void; saving: boolean; isNew: boolean
}) {
  return (
    <div className="mb-6 p-4 rounded-lg border border-[#A0622A]/30 bg-white space-y-3">
      <p className="text-sm font-semibold text-[#A0622A]">{isNew ? 'New Manual Skill' : 'Edit Skill'}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Skill Name" value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} />
        <Select label="Theme" value={form.theme ?? 'data-analytics'} onChange={e => setForm({ ...form, theme: e.target.value })}
          options={THEMES} />
        <Input label="First Used (YYYY-MM)" value={form.firstUsedDate ?? ''} onChange={e => setForm({ ...form, firstUsedDate: e.target.value })}
          placeholder="2002-11" />
      </div>
      <TextArea label="Description (optional)" value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} />
      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving} className="text-sm px-4 py-2 rounded bg-[#214459] text-white hover:bg-[#214459]/90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="text-sm px-4 py-2 rounded border border-[#e8e3de] text-[#909090] hover:text-[#4A4A4A]">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Shared primitives ────────────────────────────────────────────────────────

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs text-[#909090] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">{label}</span>
      <input {...props} className="mt-1 w-full px-3 py-2 rounded border border-[#e8e3de] text-sm text-[#4A4A4A] bg-white focus:outline-none focus:border-[#A0622A]" />
    </label>
  )
}

function TextArea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="text-xs text-[#909090] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">{label}</span>
      <textarea {...props} rows={3} className="mt-1 w-full px-3 py-2 rounded border border-[#e8e3de] text-sm text-[#4A4A4A] bg-white resize-y focus:outline-none focus:border-[#A0622A]" />
    </label>
  )
}

function Select({ label, options, ...props }: { label: string; options: { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="text-xs text-[#909090] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">{label}</span>
      <select {...props} className="mt-1 w-full px-3 py-2 rounded border border-[#e8e3de] text-sm text-[#4A4A4A] bg-white focus:outline-none focus:border-[#A0622A]">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}
