import type { Metadata } from 'next'
import { auth } from '@/auth'
import { siteMetadata } from '@/lib/metadata'
import { getAllCareerData, getAllSkills } from '@/lib/career'
import SectionHeader from '@/components/SectionHeader'
import CareerTimeline from '@/components/career/CareerTimeline'

export const metadata: Metadata = siteMetadata({
  title: 'About Matthew Wolfman',
  description: 'Matthew Wolfman — data engineer with twenty-five years of experience building things with data. Career timeline, skills, and achievements.',
  path: '/about',
})

export default async function AboutPage() {
  const [roles, skills, session] = await Promise.all([
    getAllCareerData(),
    getAllSkills(),
    auth(),
  ])

  const isAdmin = session?.user?.role === 'admin'

  const serializedRoles = roles.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    achievements: r.achievements.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  }))

  return (
    <>
      <SectionHeader section="discover" current="/about" />

      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-12">
        {/* Brief intro */}
        <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--body-text)', opacity: 0.6 }}>
          Twenty-five years building things with data — traced like data lineage.
          Search by skill, filter by theme, or scroll the timeline.
        </p>
        <p className="font-[family-name:var(--font-jetbrains)] text-[11px] tracking-wide mb-8"
           style={{ color: 'var(--body-text)', opacity: 0.3 }}>
          {roles.length} roles · {roles.reduce((s, r) => s + r.achievements.length, 0)} achievements · 1997 → present
        </p>

        <CareerTimeline roles={serializedRoles} skills={skills} isAdmin={isAdmin} />
      </main>
    </>
  )
}
