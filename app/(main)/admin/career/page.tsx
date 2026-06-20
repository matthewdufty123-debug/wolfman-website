import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { careerRoles, careerAchievements, careerSkills } from '@/lib/db/schema'
import { asc, desc } from 'drizzle-orm'
import CareerAdminTabs from '@/components/career/CareerAdminTabs'

export default async function AdminCareerPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') redirect('/')

  const [roles, achievements, skills] = await Promise.all([
    db.select().from(careerRoles).orderBy(desc(careerRoles.sortOrder)),
    db.select().from(careerAchievements).orderBy(asc(careerAchievements.sortOrder)),
    db.select().from(careerSkills).orderBy(asc(careerSkills.name)),
  ])

  // Serialize for client
  const data = {
    roles: roles.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })),
    achievements: achievements.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
    skills: skills.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })),
  }

  return (
    <main className="dash-main">
      <div className="dash-wrap">
        <CareerAdminTabs initialData={data} />
      </div>
    </main>
  )
}
