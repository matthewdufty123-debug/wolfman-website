'use client'

import type { SkillSummary } from '@/lib/career'

const THEME_COLOURS: Record<string, { bg: string; text: string; label: string }> = {
  'change-management': { bg: 'bg-[#3AB87A]/10', text: 'text-[#3AB87A]', label: 'Change Mgmt' },
  'data-analytics':    { bg: 'bg-[#2A6AB0]/10', text: 'text-[#2A6AB0]', label: 'Data & Analytics' },
  operational:         { bg: 'bg-[#C8B020]/10', text: 'text-[#C8B020]', label: 'Operational' },
}

interface Props {
  skills: SkillSummary[]
}

export default function SkillsSummary({ skills }: Props) {
  if (skills.length === 0) {
    return <p className="text-sm py-8" style={{ color: 'var(--body-text)', opacity: 0.5 }}>No skills found.</p>
  }

  return (
    <div className="grid gap-2">
      {skills.map(skill => {
        const tc = THEME_COLOURS[skill.theme] ?? THEME_COLOURS.operational
        return (
          <div
            key={`${skill.name}-${skill.source}`}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 rounded-lg"
            style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)' }}
          >
            {/* Name */}
            <span className="font-[family-name:var(--font-inter)] font-medium text-sm"
                  style={{ color: 'var(--heading)' }}>
              {skill.name}
            </span>

            {/* Theme badge */}
            <span className={`font-[family-name:var(--font-jetbrains)] text-[10px] font-bold uppercase tracking-wider
              px-2 py-0.5 rounded ${tc.bg} ${tc.text}`}>
              {tc.label}
            </span>

            {/* Source badge */}
            <span className={`font-[family-name:var(--font-jetbrains)] text-[10px] font-medium uppercase tracking-wider
              px-2 py-0.5 rounded ${
                skill.source === 'derived'
                  ? 'bg-[#4A7FA5]/10 text-[#4A7FA5]'
                  : 'bg-[#A0622A]/10 text-[#A0622A]'
              }`}>
              {skill.source}
            </span>

            {/* Spacer on desktop */}
            <span className="hidden sm:block flex-1" />

            {/* Duration */}
            {skill.duration && (
              <span className="font-[family-name:var(--font-jetbrains)] text-xs"
                    style={{ color: 'var(--body-text)', opacity: 0.45 }}>
                {skill.duration}
              </span>
            )}

            {/* Linked achievements count */}
            {skill.linkedAchievements > 0 && (
              <span className="font-[family-name:var(--font-jetbrains)] text-[10px]"
                    style={{ color: 'var(--body-text)', opacity: 0.45 }}>
                {skill.linkedAchievements} ref{skill.linkedAchievements !== 1 ? 's' : ''}
              </span>
            )}

            {/* WOLF|BOT comment */}
            {skill.wolfbotComment && (
              <p className="w-full font-[family-name:var(--font-jetbrains)] text-xs text-[#A0622A] italic mt-1" style={{ opacity: 0.7 }}>
                {skill.wolfbotComment}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
