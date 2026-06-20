import type { Metadata } from 'next'
import Link from 'next/link'
import { siteMetadata } from '@/lib/metadata'

export const metadata: Metadata = siteMetadata({
  title: 'About Matthew Wolfman',
  description: 'Matthew Wolfman — data engineer with twenty-five years of experience building things with data. Career timeline, skills, and achievements.',
  path: '/about',
})

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">

      {/* Intro */}
      <p className="font-[family-name:var(--font-jetbrains)] text-xs tracking-widest uppercase text-[#A0622A] mb-4">
        About
      </p>
      <h1 className="font-[family-name:var(--font-inter)] text-3xl sm:text-4xl font-semibold text-[#4A4A4A] tracking-tight mb-6">
        Matthew Wolfman
      </h1>
      <p className="text-[#4A4A4A] leading-relaxed mb-4">
        I am a data engineer, mountain biker, photographer, and wood carver based in the UK.
        I have spent twenty-five years building things with data — from wiring control panels
        to schematics at seventeen, through six years of PRINCE2 project management in the
        energy sector, to designing the SQL Server database that powers all Aldi GB and Ireland
        supply chain reporting today.
      </p>
      <p className="text-[#4A4A4A] leading-relaxed mb-4">
        Along the way I ran my own eBay business, started an environmental services company,
        freelanced in digital marketing, and taught myself Databricks, PySpark, and medallion
        architecture from the ground up. I have always been drawn to the space where data meets
        decisions — and I have never stopped learning.
      </p>
      <p className="text-[#4A4A4A] leading-relaxed mb-10">
        This site is my personal space. I write a{' '}
        <Link href="/feed" className="text-[#A0622A] underline underline-offset-2">morning journal</Link>{' '}
        every day, run a{' '}
        <Link href="/shop" className="text-[#A0622A] underline underline-offset-2">photography shop</Link>,
        and I am building out a full career timeline below — every role, every skill, every
        achievement, traced like data lineage.
      </p>

      {/* Career timeline placeholder */}
      <section className="border border-[#f0ebe6] rounded-lg p-8 text-center">
        <p className="font-[family-name:var(--font-jetbrains)] text-xs tracking-widest uppercase text-[#A0622A] mb-3">
          Coming soon
        </p>
        <h2 className="font-[family-name:var(--font-inter)] text-xl font-semibold text-[#4A4A4A] mb-3">
          Career Timeline
        </h2>
        <p className="text-sm text-[#909090] leading-relaxed max-w-md mx-auto">
          Sixteen roles across twenty-five years — searchable by skill, filterable by theme,
          and reviewed by WOLF|BOT. The full interactive timeline is being built now.
        </p>
      </section>

    </main>
  )
}
