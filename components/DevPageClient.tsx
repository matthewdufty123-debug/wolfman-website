'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO ?? 'matthewdufty123-debug/wolfman-website'
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`
const ISSUES_URL = `https://github.com/${GITHUB_REPO}/issues/`
const CACHE_TTL = 5 * 60 * 1000

interface GitHubLabel {
  name: string
  color: string
}

interface GitHubMilestone {
  title: string
}

interface GitHubIssue {
  number: number
  title: string
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
          <table className="dev-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Labels</th>
              </tr>
            </thead>
            <tbody>
              {grouped[ms].map((issue) => (
                <tr key={issue.number} className="dev-row-main">
                  <td className="dev-col-id">
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
                  <td>{labelBadges(issue.labels)}</td>
                </tr>
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
      <table className="dev-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Labels</th>
            <th>Closed</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((issue) => (
            <tr key={issue.number} className="dev-row-main">
              <td className="dev-col-id">
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
              <td>{labelBadges(issue.labels)}</td>
              <td>{issue.closed_at ? formatDate(issue.closed_at) : '—'}</td>
            </tr>
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
            {expanded
              ? 'Hide ↑'
              : `Show ${issues.length - SHOW} more →`}
          </a>
        </p>
      )}
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function DevPageClient() {
  const [openIssues, setOpenIssues] = useState<GitHubIssue[] | null>(null)
  const [closedIssues, setClosedIssues] = useState<GitHubIssue[] | null>(null)
  const [openError, setOpenError] = useState(false)
  const [closedError, setClosedError] = useState(false)

  useEffect(() => {
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
  }, [])

  const ghLink = `https://github.com/${GITHUB_REPO}/issues`

  return (
    <main className="dev-main">

      {/* Section 1: Profile */}
      <section className="dev-section">
        <h1 className="dev-page-title">wolfman.blog / development</h1>
        <p className="dev-subtitle">An open log of how this site is built and where it&apos;s going.</p>
        <div className="dev-links">
          <a
            href="https://github.com/matthewdufty123-debug"
            className="dev-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            See my work on GitHub →
          </a>
        </div>

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
          <a href="#pipeline" className="dev-link dev-collab-jump">Jump to pipeline →</a>
        </div>
      </section>

      {/* Section 2: Completed work */}
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

      {/* Section 3: Pipeline */}
      <section className="dev-section" id="pipeline">
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

    </main>
  )
}
