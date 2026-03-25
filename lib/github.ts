import React from 'react'

export const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO ?? 'matthewdufty123-debug/wolfman-website'
export const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`
export const ISSUES_URL = `https://github.com/${GITHUB_REPO}/issues/`
export const CACHE_TTL = 5 * 60 * 1000

export interface GitHubLabel {
  name: string
  color: string
}

export interface GitHubIssue {
  number: number
  title: string
  body: string | null
  labels: GitHubLabel[]
  milestone: { number: number; title: string } | null
  created_at: string
  closed_at: string | null
  html_url: string
}

export interface GitHubMilestone {
  number: number
  title: string
  description: string | null
  open_issues: number
  closed_issues: number
  due_on: string | null
  html_url: string
}

export interface GitHubPR {
  number: number
  title: string
  head: { ref: string }
  html_url: string
  created_at: string
  milestone: { title: string } | null
}

export const LABEL_CLASSES: Record<string, string> = {
  'planned':     'dev-badge--planned',
  'in-progress': 'dev-badge--in-progress',
  'bug':         'dev-badge--bug',
  'enhancement': 'dev-badge--enhancement',
}

export function cachedFetch<T>(url: string, cacheKey: string): Promise<T> {
  try {
    const raw = sessionStorage.getItem(cacheKey)
    if (raw) {
      const cached = JSON.parse(raw) as { ts: number; data: T }
      if (Date.now() - cached.ts < CACHE_TTL) return Promise.resolve(cached.data)
    }
  } catch { /* ignore */ }

  return fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<T> })
    .then(data => {
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data })) } catch { /* ignore */ }
      return data
    })
}

export function isBetaFeedback(issue: GitHubIssue): boolean {
  return issue.labels.some(l => l.name === 'beta-feedback')
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000
}

export function isoWeekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `w${week}`
}

export function labelBadges(labels: GitHubLabel[]): React.ReactNode {
  const visible = labels.filter(l => !/^(beta-feedback)$/i.test(l.name))
  return visible.length
    ? visible.map(l => (
        React.createElement('span', {
          key: l.name,
          className: `dev-badge ${LABEL_CLASSES[l.name] ?? 'dev-badge--default'}`,
        }, l.name)
      ))
    : null
}

// Milestone display order — matches the release roadmap
const MILESTONE_ORDER: Record<string, number> = {
  'Closed Alpha Development': 0,
  'Phase 1 — Public Alpha': 1,
  'Release 0.1 — Journaling': 2,
  'Release 0.2 — WOLF|BOT': 3,
  'Release 0.3 — Communities': 4,
  'Release 0.4 — Rituals': 5,
  'Release 0.5 — Statistics': 6,
  'Release 0.6 — Achievements': 7,
  'Release 0.7 — Shop': 8,
  'Release 0.8 — Subscriptions': 9,
  'Release 0.9 - Legal': 10,
}

export function milestoneOrder(title: string): number {
  return MILESTONE_ORDER[title] ?? 99
}
