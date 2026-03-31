'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

// ─── Section definitions ──────────────────────────────────────────────────────

const DISCOVER_PAGES = [
  { href: '/about',         label: 'About Wolfman' },
  { href: '/investment',    label: 'Investment Case' },
  { href: '/features',      label: 'Features & Roadmap' },
  { href: '/journaling',    label: 'The Journalling Practice' },
  { href: '/scores',        label: 'Morning Scores' },
  { href: '/rituals',       label: 'Rituals' },
  { href: '/achievements',  label: 'Achievements' },
]

const BETA_PAGES = [
  { href: '/beta',     label: 'About the Beta' },
  { href: '/feedback', label: 'Give Feedback' },
  { href: '/dev',      label: 'Dev Log' },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  section: 'discover' | 'beta'
  current: string
}

export default function SectionHeader({ section, current }: SectionHeaderProps) {
  const router = useRouter()
  const pages = section === 'discover' ? DISCOVER_PAGES : BETA_PAGES
  const title = section === 'discover' ? 'ABOUT THIS PROJECT' : 'ABOUT THE BETA'

  return (
    <div className="section-hdr">
      {/* Logo banner — grey in light mode, white-inverted in dark mode via CSS */}
      <div className="section-hdr-logo-wrap">
        <Image
          src="/images/site_images/Grey No LogoAsset 91000.png"
          alt="Wolfman"
          width={1000}
          height={300}
          className="section-hdr-logo"
          priority
          unoptimized
        />
      </div>

      {/* Section title + dropdown nav */}
      <div className="section-hdr-nav">
        <p className="section-hdr-title">{title}</p>
        <div className="section-hdr-select-wrap">
          <select
            className="section-hdr-select"
            value={current}
            onChange={e => router.push(e.target.value)}
            aria-label={`Navigate within ${title}`}
          >
            {pages.map(p => (
              <option key={p.href} value={p.href}>{p.label}</option>
            ))}
          </select>
          {/* Custom chevron — CSS can't reliably style native select arrows cross-browser */}
          <span className="section-hdr-chevron" aria-hidden="true">▾</span>
        </div>
      </div>
    </div>
  )
}
