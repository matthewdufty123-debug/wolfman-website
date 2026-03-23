'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO ?? 'matthewdufty123-debug/wolfman-website'
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`
const ISSUES_URL = `https://github.com/${GITHUB_REPO}/issues/`
const CACHE_TTL = 5 * 60 * 1000

interface GitHubLabel {
  name: string
  color: string
}

interface GitHubIssue {
  number: number
  title: string
  body: string | null
  labels: GitHubLabel[]
  milestone: { title: string } | null
  created_at: string
  closed_at: string | null
  html_url: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isBetaFeedback(issue: GitHubIssue) {
  return issue.labels.some(l => l.name === 'beta-feedback')
}

function stageLabel(issue: GitHubIssue): string | null {
  const label = issue.labels.find(l => /^P\dS\d/i.test(l.name))
  return label ? label.name.toUpperCase() : null
}

function stageOrder(s: string): number {
  const m = s.match(/P(\d)S(\d)/i)
  if (!m) return 999
  return parseInt(m[1]) * 10 + parseInt(m[2])
}

function isoWeekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  // Simple ISO week approximation
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `w${week}`
}

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000
}

const LABEL_CLASSES: Record<string, string> = {
  'planned':     'dev-badge--planned',
  'in-progress': 'dev-badge--in-progress',
  'bug':         'dev-badge--bug',
  'enhancement': 'dev-badge--enhancement',
}

function labelBadges(labels: GitHubLabel[]) {
  const visible = labels.filter(l => !/^(P\dS\d|beta-feedback)$/i.test(l.name))
  return visible.length
    ? visible.map(l => (
        <span key={l.name} className={`dev-badge ${LABEL_CLASSES[l.name] ?? 'dev-badge--default'}`}>
          {l.name}
        </span>
      ))
    : null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function cachedFetch<T>(url: string, cacheKey: string): Promise<T> {
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

// ── StatsRow ───────────────────────────────────────────────────────────────

function StatsRow({ openIssues, closedIssues }: { openIssues: GitHubIssue[], closedIssues: GitHubIssue[] }) {
  const openCount = openIssues.filter(i => !isBetaFeedback(i)).length
  const closedCount = closedIssues.filter(i => !isBetaFeedback(i)).length
  const feedbackCount = openIssues.filter(isBetaFeedback).length

  return (
    <div className="dev-stats-row">
      <div className="dev-stats-pill">
        <span className="dev-stats-num">{openCount}</span>
        <span className="dev-stats-label">in pipeline</span>
      </div>
      <div className="dev-stats-pill">
        <span className="dev-stats-num">{closedCount}</span>
        <span className="dev-stats-label">built</span>
      </div>
      <div className="dev-stats-pill">
        <span className="dev-stats-num">{feedbackCount}</span>
        <span className="dev-stats-label">feedback</span>
      </div>
    </div>
  )
}

// ── DevStats (charts) ──────────────────────────────────────────────────────

function DevStats({ openIssues, closedIssues }: { openIssues: GitHubIssue[], closedIssues: GitHubIssue[] }) {
  const [open, setOpen] = useState(false)
  const now = new Date().toISOString()

  const velocityData = useMemo(() => {
    const weeks: Record<string, { week: string, opened: number, closed: number }> = {}
    const allWeeks: string[] = []

    // Build last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)
      const w = isoWeekLabel(d.toISOString())
      if (!weeks[w]) { weeks[w] = { week: w, opened: 0, closed: 0 }; allWeeks.push(w) }
    }

    openIssues.forEach(issue => {
      const w = isoWeekLabel(issue.created_at)
      if (weeks[w]) weeks[w].opened++
    })
    closedIssues.forEach(issue => {
      if (!issue.closed_at) return
      const w = isoWeekLabel(issue.closed_at)
      if (weeks[w]) weeks[w].closed++
    })

    return allWeeks.map(w => weeks[w])
  }, [openIssues, closedIssues])

  const ageData = useMemo(() => {
    const buckets = [
      { label: '< 1w', min: 0, max: 7, count: 0 },
      { label: '1–2w', min: 7, max: 14, count: 0 },
      { label: '2–4w', min: 14, max: 28, count: 0 },
      { label: '1–3m', min: 28, max: 90, count: 0 },
      { label: '> 3m', min: 90, max: Infinity, count: 0 },
    ]
    openIssues.filter(i => !isBetaFeedback(i)).forEach(issue => {
      const age = daysBetween(issue.created_at, now)
      const bucket = buckets.find(b => age >= b.min && age < b.max)
      if (bucket) bucket.count++
    })
    return buckets.map(b => ({ label: b.label, count: b.count }))
  }, [openIssues, now])

  const resolutionData = useMemo(() => {
    const stages: Record<string, number[]> = {}
    closedIssues.filter(i => !isBetaFeedback(i) && i.closed_at).forEach(issue => {
      const stage = stageLabel(issue)
      if (!stage) return
      const days = daysBetween(issue.created_at, issue.closed_at!)
      if (!stages[stage]) stages[stage] = []
      stages[stage].push(days)
    })
    return Object.entries(stages)
      .filter(([, vals]) => vals.length >= 2)
      .sort(([a], [b]) => stageOrder(a) - stageOrder(b))
      .map(([stage, vals]) => ({
        stage,
        avg: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
      }))
  }, [closedIssues])

  return (
    <div className="dev-stats-section">
      <button className="dev-group-header dev-stats-toggle" onClick={() => setOpen(o => !o)}>
        <span className="dev-section-title" style={{ margin: 0 }}>// stats</span>
        <span className="dev-group-expand">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="dev-stats-charts">
          <div className="dev-chart-block">
            <p className="dev-chart-title">Weekly velocity — opened vs closed</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={velocityData} barGap={2} barCategoryGap="30%">
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#909090' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#909090' }} axisLine={false} tickLine={false} width={20} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="opened" fill="#A0622A" name="opened" radius={[2,2,0,0]} />
                <Bar dataKey="closed" fill="#4A7FA5" name="closed" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="dev-chart-block">
            <p className="dev-chart-title">Open issue age</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={ageData} barCategoryGap="35%">
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#909090' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#909090' }} axisLine={false} tickLine={false} width={20} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="#C8B020" name="issues" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {resolutionData.length >= 2 && (
            <div className="dev-chart-block">
              <p className="dev-chart-title">Avg days to close by stage</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={resolutionData} barCategoryGap="35%">
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#909090' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#909090' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="avg" fill="#4A7FA5" name="avg days" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Pipeline ───────────────────────────────────────────────────────────────

function Pipeline({ issues }: { issues: GitHubIssue[] }) {
  const filtered = issues.filter(i => !isBetaFeedback(i))
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  const grouped = useMemo(() => {
    const map: Record<string, GitHubIssue[]> = {}
    filtered.forEach(issue => {
      const key = stageLabel(issue) ?? 'Other'
      if (!map[key]) map[key] = []
      map[key].push(issue)
    })
    return Object.entries(map).sort(([a], [b]) => stageOrder(a) - stageOrder(b))
  }, [filtered])

  if (!grouped.length) return <p className="dev-empty">Pipeline is clear.</p>

  function toggle(key: string) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <>
      {grouped.map(([key, groupIssues]) => {
        const isOpen = openGroups.has(key)
        return (
          <div key={key} className="dev-group">
            <button className="dev-group-header" onClick={() => toggle(key)}>
              <span className="dev-group-name">{key}</span>
              <span className="dev-group-count">{groupIssues.length} issue{groupIssues.length !== 1 ? 's' : ''}</span>
              <span className="dev-group-expand">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <table className="dev-table dev-table--pipeline">
                <tbody>
                  {groupIssues.map(issue => (
                    <tr key={issue.number} className="dev-row-main">
                      <td className="dev-col-num dev-col-id">
                        <a href={`${ISSUES_URL}${issue.number}`} target="_blank" rel="noopener noreferrer" className="dev-commit-link">
                          #{issue.number}
                        </a>
                      </td>
                      <td className="dev-col-title">{issue.title}</td>
                      <td className="dev-col-labels">{labelBadges(issue.labels)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </>
  )
}

// ── ClosedWork ─────────────────────────────────────────────────────────────

function ClosedWork({ issues }: { issues: GitHubIssue[] }) {
  const [expanded, setExpanded] = useState(false)
  const filtered = issues.filter(i => !isBetaFeedback(i))
  if (!filtered.length) return <p className="dev-empty">Nothing closed yet.</p>

  const SHOW = 10
  const visible = expanded ? filtered : filtered.slice(0, SHOW)
  const hasMore = filtered.length > SHOW

  return (
    <>
      <table className="dev-table dev-table--completed">
        <thead>
          <tr>
            <th className="dev-col-num">#</th>
            <th className="dev-col-title">Title</th>
            <th className="dev-col-labels">Labels</th>
            <th style={{ whiteSpace: 'nowrap' }}>Closed</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(issue => (
            <tr key={issue.number} className="dev-row-main">
              <td className="dev-col-num dev-col-id">
                <a href={`${ISSUES_URL}${issue.number}`} target="_blank" rel="noopener noreferrer" className="dev-commit-link">
                  #{issue.number}
                </a>
              </td>
              <td className="dev-col-title">{issue.title}</td>
              <td className="dev-col-labels">{labelBadges(issue.labels)}</td>
              <td style={{ color: '#8b949e', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                {issue.closed_at ? formatDate(issue.closed_at) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <p className="dev-log-action">
          <a href="#" className="dev-link" onClick={e => { e.preventDefault(); setExpanded(x => !x) }}>
            {expanded ? 'Hide ↑' : `Show ${filtered.length - SHOW} more →`}
          </a>
        </p>
      )}
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface DevOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export default function DevOverlay({ isOpen, onClose }: DevOverlayProps) {
  const [openIssues, setOpenIssues] = useState<GitHubIssue[] | null>(null)
  const [closedIssues, setClosedIssues] = useState<GitHubIssue[] | null>(null)
  const [openError, setOpenError] = useState(false)
  const [closedError, setClosedError] = useState(false)
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    if (!isOpen) return
    cachedFetch<GitHubIssue[]>(`${GITHUB_API}/issues?state=open&per_page=100`, 'wm_gh_open')
      .then(setOpenIssues).catch(() => setOpenError(true))
    cachedFetch<GitHubIssue[]>(`${GITHUB_API}/issues?state=closed&per_page=100`, 'wm_gh_closed')
      .then(setClosedIssues).catch(() => setClosedError(true))
  }, [isOpen])

  const ghLink = `https://github.com/${GITHUB_REPO}/issues`

  return (
    <div className={`dev-overlay${isOpen ? ' is-open' : ''}`} aria-hidden={!isOpen}>
      <div className="dev-overlay-inner">

        {/* Header */}
        <div className="dev-overlay-header">
          {isAdmin && (
            <Link href="/admin" className="dev-raise-btn" onClick={onClose}>
              Admin Panel
            </Link>
          )}
        </div>

        <h1 className="dev-page-title">wolfman.blog / development</h1>

        {/* Intro */}
        <div className="dev-collab">
          <div className="dev-collab-logos">
            <Image
              src="/images/site_images/White Bronze LogoAsset 12300.png"
              className="dev-collab-logo"
              alt="Wolfman"
              width={40}
              height={40}
              unoptimized
            />
            <Image
              src="/images/site_images/claudecode-color.png"
              className="dev-collab-logo"
              alt="Claude Code"
              width={40}
              height={40}
              unoptimized
            />
          </div>
          <p className="dev-collab-caption">
            wolfman.blog is an open beta for a mindful morning journalling app, built in
            collaboration with Claude Code. Every feature, fix, and improvement is tracked
            as a GitHub Issue — this log is the live view.
          </p>
          <Link href="/beta" className="dev-link dev-collab-jump" onClick={onClose}>
            Learn about the beta →
          </Link>
        </div>

        {/* Stats + charts */}
        {openIssues && closedIssues && (
          <>
            <StatsRow openIssues={openIssues} closedIssues={closedIssues} />
            <DevStats openIssues={openIssues} closedIssues={closedIssues} />
          </>
        )}

        {/* Pipeline */}
        <section className="dev-section" id="dev-pipeline">
          <h2 className="dev-section-title">// pipeline</h2>
          {openError ? (
            <p className="dev-error">
              Could not load data from GitHub.{' '}
              <a href={ghLink} className="dev-link" target="_blank" rel="noopener noreferrer">View on GitHub →</a>
            </p>
          ) : openIssues === null ? (
            <p className="dev-loading">Fetching pipeline…</p>
          ) : (
            <Pipeline issues={openIssues} />
          )}
        </section>

        {/* Completed */}
        <section className="dev-section">
          <h2 className="dev-section-title">// completed work</h2>
          {closedError ? (
            <p className="dev-error">
              Could not load data from GitHub.{' '}
              <a href={ghLink} className="dev-link" target="_blank" rel="noopener noreferrer">View on GitHub →</a>
            </p>
          ) : closedIssues === null ? (
            <p className="dev-loading">Fetching completed issues…</p>
          ) : (
            <ClosedWork issues={closedIssues} />
          )}
        </section>

      </div>

      <button className="dev-overlay-close" aria-label="Close development overlay" onClick={onClose}>
        &times;
      </button>
    </div>
  )
}
