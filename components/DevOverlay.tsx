'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO ?? 'matthewdufty123-debug/wolfman-website'
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`
const ISSUES_URL = `https://github.com/${GITHUB_REPO}/issues/`
const MILESTONES_URL = `https://github.com/${GITHUB_REPO}/milestone/`
const CACHE_TTL = 5 * 60 * 1000

interface GitHubLabel {
  name: string
  color: string
}

interface GitHubMilestone {
  id: number
  number: number
  title: string
  open_issues: number
  closed_issues: number
}

interface GitHubIssue {
  number: number
  title: string
  body: string | null
  labels: GitHubLabel[]
  milestone: GitHubMilestone | null
  closed_at: string | null
  html_url: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

const LABEL_CLASSES: Record<string, string> = {
  'planned':     'dev-badge--planned',
  'in-progress': 'dev-badge--in-progress',
  'bug':         'dev-badge--bug',
  'enhancement': 'dev-badge--enhancement',
}

function labelBadge(label: GitHubLabel) {
  const cls = LABEL_CLASSES[label.name] ?? 'dev-badge--default'
  return <span key={label.name} className={`dev-badge ${cls}`}>{label.name}</span>
}

function labelBadges(labels: GitHubLabel[]) {
  const visible = labels.filter((l) => !/^Milestone-/i.test(l.name))
  return visible.length ? visible.map(labelBadge) : <span>—</span>
}

function milestoneName(issue: GitHubIssue): string {
  if (issue.milestone?.title) return issue.milestone.title
  const ml = issue.labels.find((l) => /^Milestone-/i.test(l.name))
  return ml ? ml.name : 'Unassigned'
}

function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const key = fn(item)
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function truncate(text: string | null, len = 250): string {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '…' : text
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
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json() as Promise<T>
    })
    .then((data) => {
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data })) } catch { /* ignore */ }
      return data
    })
}

// ── Sub-components ─────────────────────────────────────────────────────────

function OverallProgressBar({ milestones }: { milestones: GitHubMilestone[] }) {
  const totalClosed = milestones.reduce((s, ms) => s + ms.closed_issues, 0)
  const totalOpen   = milestones.reduce((s, ms) => s + ms.open_issues, 0)
  const total = totalClosed + totalOpen
  if (!total) return null
  const pct = Math.round((totalClosed / total) * 100)

  return (
    <div className="dev-progress-wrap">
      <div className="dev-progress-bar">
        <div className="dev-progress-closed" style={{ width: `${pct}%` }} />
        <div className="dev-progress-open"   style={{ width: `${100 - pct}%` }} />
      </div>
      <div className="dev-progress-legend">
        <span className="dev-progress-legend-closed">{totalClosed} closed</span>
        <span className="dev-progress-legend-pct">{pct}% complete</span>
        <span className="dev-progress-legend-open">{totalOpen} open</span>
      </div>
    </div>
  )
}

function MilestoneStats({ milestones }: { milestones: GitHubMilestone[] }) {
  if (!milestones.length) return null
  const sorted = [...milestones].sort((a, b) => {
    const na = parseInt(a.title.replace(/\D+/g, '')) || 999
    const nb = parseInt(b.title.replace(/\D+/g, '')) || 999
    return na - nb
  })
  return (
    <>
      <OverallProgressBar milestones={sorted} />
      <table className="dev-table dev-stats-table">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Open</th>
            <th>Closed</th>
            <th>% Complete</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((ms) => {
            const total = ms.open_issues + ms.closed_issues
            const pct = total ? Math.round((ms.closed_issues / total) * 100) : 0
            return (
              <tr key={ms.id}>
                <td>
                  <a
                    href={`${MILESTONES_URL}${ms.number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dev-commit-link"
                  >
                    {ms.title}
                  </a>
                </td>
                <td>{ms.open_issues}</td>
                <td>{ms.closed_issues}</td>
                <td>{pct}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}

function Pipeline({ issues }: { issues: GitHubIssue[] }) {
  if (!issues.length) return <p className="dev-empty">No open issues.</p>

  const grouped = groupBy(issues, milestoneName)
  const keys = Object.keys(grouped).sort((a, b) => {
    const na = parseInt(a.replace(/\D+/g, '')) || 999
    const nb = parseInt(b.replace(/\D+/g, '')) || 999
    return na - nb
  })

  return (
    <>
      {keys.map((ms) => (
        <div key={ms} className="dev-milestone">
          <h3 className="dev-milestone-title">{ms}</h3>
          <table className="dev-table dev-table--pipeline">
            <thead>
              <tr>
                <th className="dev-col-num">#</th>
                <th className="dev-col-title">Title</th>
                <th className="dev-col-labels">Labels</th>
              </tr>
            </thead>
            <tbody>
              {grouped[ms].map((issue) => (
                <React.Fragment key={issue.number}>
                  <tr className="dev-row-main">
                    <td className="dev-col-num dev-col-id">
                      <a
                        href={`${ISSUES_URL}${issue.number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dev-commit-link"
                      >
                        #{issue.number}
                      </a>
                    </td>
                    <td className="dev-col-title">{issue.title}</td>
                    <td className="dev-col-labels">{labelBadges(issue.labels)}</td>
                  </tr>
                  {issue.body && (
                    <tr className="dev-desc-row">
                      <td colSpan={3}>{truncate(issue.body)}</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  )
}

function ClosedWork({ issues }: { issues: GitHubIssue[] }) {
  const [expanded, setExpanded] = useState(false)
  if (!issues.length) return <p className="dev-empty">Nothing closed yet.</p>

  const SHOW = 5
  const visible = expanded ? issues : issues.slice(0, SHOW)
  const hasMore = issues.length > SHOW

  return (
    <>
      <table className="dev-table dev-table--completed">
        <thead>
          <tr>
            <th className="dev-col-num">#</th>
            <th className="dev-col-title">Title</th>
            <th className="dev-col-labels">Labels</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((issue) => (
            <React.Fragment key={issue.number}>
              <tr className="dev-row-main">
                <td className="dev-col-num dev-col-id">
                  <a
                    href={`${ISSUES_URL}${issue.number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dev-commit-link"
                  >
                    #{issue.number}
                  </a>
                </td>
                <td className="dev-col-title">{issue.title}</td>
                <td className="dev-col-labels">{labelBadges(issue.labels)}</td>
              </tr>
              <tr className="dev-desc-row">
                <td className="dev-col-num" />
                <td>{truncate(issue.body)}</td>
                <td style={{ textAlign: 'right', fontStyle: 'normal', color: '#8b949e', whiteSpace: 'nowrap' }}>
                  {issue.closed_at ? formatDate(issue.closed_at) : '—'}
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <p className="dev-log-action">
          <a
            href="#"
            className="dev-link"
            onClick={(e) => { e.preventDefault(); setExpanded((x) => !x) }}
          >
            {expanded ? 'Hide ↑' : `Show ${issues.length - SHOW} more →`}
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
  const [milestones, setMilestones] = useState<GitHubMilestone[] | null>(null)
  const [openError, setOpenError] = useState(false)
  const [closedError, setClosedError] = useState(false)
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    if (!isOpen) return
    cachedFetch<GitHubIssue[]>(
      `${GITHUB_API}/issues?state=open&per_page=100`,
      'wm_gh_open'
    )
      .then(setOpenIssues)
      .catch(() => setOpenError(true))

    cachedFetch<GitHubIssue[]>(
      `${GITHUB_API}/issues?state=closed&per_page=100`,
      'wm_gh_closed'
    )
      .then(setClosedIssues)
      .catch(() => setClosedError(true))

    cachedFetch<GitHubMilestone[]>(
      `${GITHUB_API}/milestones?state=all&per_page=100`,
      'wm_gh_milestones'
    )
      .then(setMilestones)
      .catch(() => { /* non-critical */ })
  }, [isOpen])

  const ghLink = `https://github.com/${GITHUB_REPO}/issues`

  return (
    <div className={`dev-overlay${isOpen ? ' is-open' : ''}`} aria-hidden={!isOpen}>
      <div className="dev-overlay-inner">

        {/* Header row */}
        <div className="dev-overlay-header">
          <a
            href={`https://github.com/${GITHUB_REPO}/issues/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="dev-raise-btn"
          >
            Raise an Issue
          </a>
          {isAdmin && (
            <Link href="/admin" className="dev-raise-btn" onClick={onClose}>
              Admin Panel
            </Link>
          )}
        </div>
        <h1 className="dev-page-title">wolfman.blog / development</h1>

        <p className="dev-subtitle">An open log of how this site is built and where it&apos;s going.</p>

        {/* Collab section */}
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
            I am collaborating with Claude Code to build this website from the ground up.
            Our development area details what changes we have committed to so far and what
            changes we plan to make. GitHub Issues is our single source of truth — every
            planned feature, bug, and improvement lives there.
          </p>

          {/* Milestone stats */}
          {milestones && milestones.length > 0 && (
            <div style={{ margin: '1.5rem 0' }}>
              <MilestoneStats milestones={milestones} />
            </div>
          )}

          <a href="#dev-pipeline" className="dev-link dev-collab-jump">Jump to pipeline →</a>
        </div>

        {/* Completed work */}
        <section className="dev-section">
          <h2 className="dev-section-title">// completed work</h2>
          {closedError ? (
            <p className="dev-error">
              Could not load data from GitHub.{' '}
              <a href={ghLink} className="dev-link" target="_blank" rel="noopener noreferrer">
                View on GitHub →
              </a>
            </p>
          ) : closedIssues === null ? (
            <p className="dev-loading">Fetching completed issues…</p>
          ) : (
            <ClosedWork issues={closedIssues} />
          )}
        </section>

        {/* Pipeline */}
        <section className="dev-section" id="dev-pipeline">
          <h2 className="dev-section-title">// pipeline</h2>
          {openError ? (
            <p className="dev-error">
              Could not load data from GitHub.{' '}
              <a href={ghLink} className="dev-link" target="_blank" rel="noopener noreferrer">
                View on GitHub →
              </a>
            </p>
          ) : openIssues === null ? (
            <p className="dev-loading">Fetching pipeline…</p>
          ) : (
            <Pipeline issues={openIssues} />
          )}
        </section>

      </div>

      {/* Close button */}
      <button
        className="dev-overlay-close"
        aria-label="Close development overlay"
        onClick={onClose}
      >
        &times;
      </button>
    </div>
  )
}
