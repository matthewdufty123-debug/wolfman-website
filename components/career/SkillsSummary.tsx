'use client'

import type { SkillSummary } from '@/lib/career'

const THEME_COLOURS: Record<string, { hex: string; bg: string; short: string }> = {
  'change-management': { hex: '#3AB87A', bg: 'rgba(58,184,122,0.12)',  short: 'CHANGE' },
  'data-analytics':    { hex: '#2A6AB0', bg: 'rgba(42,106,176,0.12)',  short: 'DATA' },
  operational:         { hex: '#C8B020', bg: 'rgba(200,176,32,0.12)',  short: 'OPS' },
}

interface Props {
  skills: SkillSummary[]
}

export default function SkillsSummary({ skills }: Props) {
  if (skills.length === 0) {
    return (
      <p className="text-sm py-12 text-center" style={{ color: 'var(--body-text)', opacity: 0.4 }}>
        No skills found.
      </p>
    )
  }

  return (
    <div className="career-skills-grid">
      {skills.map(skill => {
        const tc = THEME_COLOURS[skill.theme] ?? THEME_COLOURS.operational
        return (
          <div key={`${skill.name}-${skill.source}`} className="career-skill-card">
            {/* Skill name */}
            <p className="font-[family-name:var(--font-inter)] font-semibold text-sm mb-2"
               style={{ color: 'var(--heading)' }}>
              {skill.name}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span
                className="font-[family-name:var(--font-jetbrains)] text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ color: tc.hex, background: tc.bg }}
              >
                {tc.short}
              </span>
              <span
                className="font-[family-name:var(--font-jetbrains)] text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  color: skill.source === 'derived' ? '#4A7FA5' : '#A0622A',
                  background: skill.source === 'derived' ? 'rgba(74,127,165,0.12)' : 'rgba(160,98,42,0.12)',
                }}
              >
                {skill.source}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 font-[family-name:var(--font-jetbrains)] text-[11px]"
                 style={{ color: 'var(--body-text)', opacity: 0.4 }}>
              {skill.duration && <span>{skill.duration}</span>}
              {skill.linkedAchievements > 0 && (
                <span>{skill.linkedAchievements} ref{skill.linkedAchievements !== 1 ? 's' : ''}</span>
              )}
            </div>

            {/* WOLF|BOT */}
            {skill.wolfbotComment && (
              <p className="font-[family-name:var(--font-jetbrains)] text-[11px] mt-2 italic text-[#A0622A]"
                 style={{ opacity: 0.7 }}>
                {skill.wolfbotComment}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
