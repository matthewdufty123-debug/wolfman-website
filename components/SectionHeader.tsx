'use client'

import { useRouter } from 'next/navigation'

// ─── Section definitions ──────────────────────────────────────────────────────

const DISCOVER_PAGES = [
  { href: '/discover',      label: 'Discover — Overview' },
  { href: '/about',         label: 'About Wolfman' },
  { href: '/investment',    label: 'Investment Case' },
  { href: '/features',      label: 'Features & Roadmap' },
  { href: '/journaling',    label: 'The Journalling Practice' },
  { href: '/scores',        label: 'Morning Scores' },
  { href: '/wolfbot',       label: 'WOLF|BOT' },
  { href: '/rituals',       label: 'Rituals' },
  { href: '/achievements',  label: 'Achievements' },
]

const BETA_PAGES = [
  { href: '/beta',     label: 'About the Beta' },
  { href: '/feedback', label: 'Give Feedback' },
  { href: '/dev',      label: 'Dev Log' },
]

function personalPages(username: string) {
  return [
    { href: username ? `/${username}` : '/account', label: 'Profile' },
    { href: '/settings', label: 'Settings' },
    { href: '/account',  label: 'Account' },
  ]
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  section: 'discover' | 'beta' | 'personal'
  current: string
  username?: string
}

export default function SectionHeader({ section, current, username = '' }: SectionHeaderProps) {
  const router = useRouter()
  const pages =
    section === 'discover' ? DISCOVER_PAGES :
    section === 'beta'     ? BETA_PAGES :
                             personalPages(username)
  const title =
    section === 'discover' ? 'WHAT WOULD YOU LIKE TO LEARN ABOUT?' :
    section === 'beta'     ? 'ABOUT THE BETA' :
                             'YOUR SPACE'

  return (
    <div className="section-hdr">
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
