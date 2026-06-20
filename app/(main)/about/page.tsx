import type { Metadata } from 'next'
import Link from 'next/link'
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
  const [roles, skills] = await Promise.all([
    getAllCareerData(),
    getAllSkills(),
  ])

  // Serialize dates for client component
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

      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Intro */}
        <p className="font-[family-name:var(--font-jetbrains)] text-xs tracking-widest uppercase text-[#A0622A] mb-4">
          About
        </p>
        <h1 className="font-[family-name:var(--font-inter)] text-3xl sm:text-4xl font-semibold tracking-tight mb-6"
            style={{ color: 'var(--heading)' }}>
          Matthew Wolfman
        </h1>
        <p className="leading-relaxed mb-4" style={{ color: 'var(--body-text)' }}>
          I am a data engineer, mountain biker, photographer, and wood carver based in the UK.
          I have spent twenty-five years building things with data — from wiring control panels
          to schematics at seventeen, through six years of PRINCE2 project management in the
          energy sector, to designing the SQL Server database that powers all Aldi GB and Ireland
          supply chain reporting today.
        </p>
        <p className="leading-relaxed mb-4" style={{ color: 'var(--body-text)' }}>
          Along the way I ran my own eBay business, started an environmental services company,
          freelanced in digital marketing, and taught myself Databricks, PySpark, and medallion
          architecture from the ground up. I have always been drawn to the space where data meets
          decisions — and I have never stopped learning.
        </p>
        <p className="leading-relaxed mb-10" style={{ color: 'var(--body-text)' }}>
          This site is my personal space. I write a{' '}
          <Link href="/feed" className="text-[#A0622A] underline underline-offset-2">morning journal</Link>{' '}
          every day, run a{' '}
          <Link href="/shop" className="text-[#A0622A] underline underline-offset-2">photography shop</Link>,
          and below is my full career timeline — every role, every skill, every
          achievement, traced like data lineage.
        </p>

        {/* Career timeline */}
        <section>
          <h2 className="font-[family-name:var(--font-inter)] text-xl font-semibold mb-2"
              style={{ color: 'var(--heading)' }}>
            Career Timeline
          </h2>
          <p className="font-[family-name:var(--font-jetbrains)] text-xs tracking-wide mb-6"
             style={{ color: 'var(--body-text)', opacity: 0.5 }}>
            1997 → present · {roles.length} roles · {roles.reduce((s, r) => s + r.achievements.length, 0)} achievements
          </p>
          <CareerTimeline roles={serializedRoles} skills={skills} />
        </section>
      </main>
    </>
  )
}
