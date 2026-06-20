import { db } from '@/lib/db'
import { careerRoles, careerAchievements, careerSkills } from '@/lib/db/schema'
import { asc, desc, eq } from 'drizzle-orm'

// ── Types ────────────────────────────────────────────────────────────────────

export type CareerRole = typeof careerRoles.$inferSelect
export type CareerAchievement = typeof careerAchievements.$inferSelect
export type CareerSkill = typeof careerSkills.$inferSelect

export interface RoleWithAchievements extends CareerRole {
  achievements: CareerAchievement[]
}

export interface SkillSummary {
  name: string
  theme: string
  source: 'derived' | 'manual'
  firstUsedDate: string | null
  duration: string              // human-readable e.g. "4 years"
  linkedAchievements: number    // count of achievements referencing this skill
  wolfbotComment: string | null
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** Fetch all roles with their achievements, ordered newest → oldest */
export async function getAllCareerData(): Promise<RoleWithAchievements[]> {
  const roles = await db
    .select()
    .from(careerRoles)
    .orderBy(desc(careerRoles.sortOrder))

  const achievements = await db
    .select()
    .from(careerAchievements)
    .orderBy(asc(careerAchievements.sortOrder))

  // Group achievements by roleId
  const byRole = new Map<string, CareerAchievement[]>()
  for (const a of achievements) {
    const list = byRole.get(a.roleId) ?? []
    list.push(a)
    byRole.set(a.roleId, list)
  }

  return roles.map(r => ({
    ...r,
    achievements: byRole.get(r.id) ?? [],
  }))
}

/** Fetch manual skills */
export async function getManualSkills(): Promise<CareerSkill[]> {
  return db.select().from(careerSkills).orderBy(asc(careerSkills.name))
}

/** Build unified skills list from derived (achievement tags) + manual skills */
export async function getAllSkills(): Promise<SkillSummary[]> {
  const [roles, achievements, manual] = await Promise.all([
    db.select().from(careerRoles).orderBy(asc(careerRoles.sortOrder)),
    db.select().from(careerAchievements),
    db.select().from(careerSkills),
  ])

  const roleMap = new Map(roles.map(r => [r.id, r]))

  // Derived skills: group by skill name from achievement skillTags
  const derived = new Map<string, { theme: string; earliest: string; count: number }>()
  for (const a of achievements) {
    if (!a.skillTags) continue
    const role = roleMap.get(a.roleId)
    if (!role) continue
    for (const tag of a.skillTags) {
      const existing = derived.get(tag)
      if (!existing) {
        derived.set(tag, { theme: a.theme, earliest: role.startDate, count: 1 })
      } else {
        existing.count++
        if (role.startDate < existing.earliest) existing.earliest = role.startDate
      }
    }
  }

  const now = new Date()
  const nowYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const results: SkillSummary[] = []

  // Add derived skills
  for (const [name, info] of derived) {
    results.push({
      name,
      theme: info.theme,
      source: 'derived',
      firstUsedDate: info.earliest,
      duration: calcDuration(info.earliest, nowYM),
      linkedAchievements: info.count,
      wolfbotComment: null,
    })
  }

  // Add manual skills
  for (const s of manual) {
    results.push({
      name: s.name,
      theme: s.theme,
      source: 'manual',
      firstUsedDate: s.firstUsedDate,
      duration: s.firstUsedDate ? calcDuration(s.firstUsedDate, nowYM) : '',
      linkedAchievements: 0,
      wolfbotComment: s.wolfbotComment,
    })
  }

  // Sort alphabetically
  results.sort((a, b) => a.name.localeCompare(b.name))
  return results
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcDuration(fromYM: string, toYM: string): string {
  const [fy, fm] = fromYM.split('-').map(Number)
  const [ty, tm] = toYM.split('-').map(Number)
  const months = (ty - fy) * 12 + (tm - fm)
  if (months < 1) return '< 1 month'
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) return `${years} year${years === 1 ? '' : 's'}`
  return `${years}y ${rem}m`
}
