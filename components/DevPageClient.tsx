'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  GITHUB_REPO, GITHUB_API, ISSUES_URL, CACHE_TTL,
  cachedFetch, isBetaFeedback, formatDate, daysBetween, isoWeekLabel,
  labelBadges, milestoneOrder,
  type GitHubIssue, type GitHubMilestone, type GitHubPR,
} from '@/lib/github'

// re-export CACHE_TTL to silence unused-import lint if needed
void CACHE_TTL

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
    const milestones: Record<string, number[]> = {}
    closedIssues.filter(i => !isBetaFeedback(i) && i.closed_at).forEach(issue => {
      const ms = issue.milestone?.title
      if (!ms) return
      const days = daysBetween(issue.created_at, issue.closed_at!)
      if (!milestones[ms]) milestones[ms] = []
      milestones[ms].push(days)
    })
    return Object.entries(milestones)
      .filter(([, vals]) => vals.length >= 2)
      .sort(([a], [b]) => milestoneOrder(a) - milestoneOrder(b))
      .map(([ms, vals]) => ({
        milestone: ms.replace('Release ', 'v').replace(' — ', ' '),
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
              <p className="dev-chart-title">Avg days to close by release</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={resolutionData} barCategoryGap="35%">
                  <XAxis dataKey="milestone" tick={{ fontSize: 9, fill: '#909090' }} axisLine={false} tickLine={false} />
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

// ── Milestones ──────────────────────────────────────────────────────────────

function Milestones({ milestones }: { milestones: GitHubMilestone[] }) {
  const sorted = [...milestones].sort((a, b) => milestoneOrder(a.title) - milestoneOrder(b.title))

  if (!sorted.length) return <p className="dev-empty">No open milestones.</p>

  return (
    <div className="dev-milestones">
      {sorted.map(ms => {
        const total = ms.open_issues + ms.closed_issues
        const pct = total > 0 ? Math.round((ms.closed_issues / total) * 100) : 0
        const due = ms.due_on ? formatDate(ms.due_on) : null

        return (
          <div key={ms.number} className="dev-milestone-row">
            <div className="dev-milestone-header">
              <a href={ms.html_url} className="dev-milestone-title" target="_blank" rel="noopener noreferrer">
                {ms.title}
              </a>
              <div className="dev-milestone-meta">
                {due && <span className="dev-milestone-due">due {due}</span>}
                <span className="dev-milestone-counts">{ms.closed_issues}/{total} closed</span>
              </div>
            </div>
            <div className="dev-progress-bar">
              <div className="dev-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── OpenPRs ────────────────────────────────────────────────────────────────

function OpenPRs({ prs }: { prs: GitHubPR[] }) {
  if (!prs.length) return <p className="dev-empty">No open pull requests.</p>
  const now = new Date().toISOString()

  return (
    <div className="dev-table-wrap">
      <table className="dev-table dev-table--pipeline">
        <thead>
          <tr>
            <th className="dev-col-num">#</th>
            <th className="dev-col-title">Branch / Title</th>
            <th style={{ whiteSpace: 'nowrap' }}>Open for</th>
          </tr>
        </thead>
        <tbody>
          {prs.map(pr => (
            <tr key={pr.number} className="dev-row-main">
              <td className="dev-col-num dev-col-id">
                <a href={pr.html_url} target="_blank" rel="noopener noreferrer" className="dev-commit-link">
                  #{pr.number}
                </a>
              </td>
              <td className="dev-col-title">
                <span className="dev-pr-branch">{pr.head.ref}</span>
                <span className="dev-pr-title">{pr.title}</span>
              </td>
              <td style={{ color: '#8b949e', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                {Math.round(daysBetween(pr.created_at, now))}d
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
      const key = issue.milestone?.title ?? 'No milestone'
      if (!map[key]) map[key] = []
      map[key].push(issue)
    })
    return Object.entries(map).sort(([a], [b]) => milestoneOrder(a) - milestoneOrder(b))
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
      <div className="dev-table-wrap">
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
      </div>
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

export default function DevPageClient() {
  const [openIssues, setOpenIssues] = useState<GitHubIssue[] | null>(null)
  const [closedIssues, setClosedIssues] = useState<GitHubIssue[] | null>(null)
  const [milestones, setMilestones] = useState<GitHubMilestone[] | null>(null)
  const [prs, setPRs] = useState<GitHubPR[] | null>(null)
  const [openError, setOpenError] = useState(false)
  const [closedError, setClosedError] = useState(false)
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    cachedFetch<GitHubIssue[]>(`${GITHUB_API}/issues?state=open&per_page=100`, 'wm_gh_open')
      .then(setOpenIssues).catch(() => setOpenError(true))
    cachedFetch<GitHubIssue[]>(`${GITHUB_API}/issues?state=closed&per_page=100`, 'wm_gh_closed')
      .then(setClosedIssues).catch(() => setClosedError(true))
    cachedFetch<GitHubMilestone[]>(`${GITHUB_API}/milestones?state=open&per_page=50`, 'wm_gh_milestones')
      .then(setMilestones).catch(() => setMilestones([]))
    cachedFetch<GitHubPR[]>(`${GITHUB_API}/pulls?state=open&per_page=30`, 'wm_gh_prs')
      .then(setPRs).catch(() => setPRs([]))
  }, [])

  const ghLink = `https://github.com/${GITHUB_REPO}/issues`

  return (
    <main className="dev-main">

      <section className="dev-section">
        <h1 className="dev-page-title">wolfman.blog / development</h1>
        <p className="dev-subtitle">The live technical log of how this site is built. Every feature tracked as a GitHub issue, every release a milestone.</p>
        <div className="dev-links">
          <a href={`https://github.com/${GITHUB_REPO}`} className="dev-link" target="_blank" rel="noopener noreferrer">
            See the code on GitHub →
          </a>
          <Link href="/features" className="dev-link">Product roadmap →</Link>
          {isAdmin && (
            <Link href="/admin" className="dev-link">Admin panel →</Link>
          )}
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
            wolfman.blog is built in the open, in collaboration with Claude Code.
            Every feature starts as a GitHub Issue. Every release is a milestone.
            What you see here is the live view of the build — no spin, just the actual pipeline.
          </p>
          <Link href="/beta" className="dev-link dev-collab-jump">About the beta →</Link>
        </div>
      </section>

      {/* Stats + charts */}
      {openIssues && closedIssues && (
        <section className="dev-section">
          <StatsRow openIssues={openIssues} closedIssues={closedIssues} />
          <DevStats openIssues={openIssues} closedIssues={closedIssues} />
        </section>
      )}

      {/* Milestones */}
      <section className="dev-section">
        <h2 className="dev-section-title">// releases</h2>
        {milestones === null ? (
          <p className="dev-loading">Fetching milestones…</p>
        ) : (
          <Milestones milestones={milestones} />
        )}
      </section>

      {/* Open PRs */}
      <section className="dev-section">
        <h2 className="dev-section-title">// open branches</h2>
        {prs === null ? (
          <p className="dev-loading">Fetching branches…</p>
        ) : (
          <OpenPRs prs={prs} />
        )}
      </section>

      {/* Pipeline */}
      <section className="dev-section" id="pipeline">
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

      {/* Workflow */}
      <section className="dev-section">
        <h2 className="dev-section-title">// how we build</h2>
        <div className="dev-workflow">
          <div className="dev-workflow-step">
            <span className="dev-workflow-label">01 — Issues</span>
            <p className="dev-workflow-desc">
              Every feature, bug, and idea starts as a GitHub Issue. Issues are labelled,
              milestoned, and prioritised before any code is written. The pipeline above is the live view.
            </p>
          </div>
          <div className="dev-workflow-step">
            <span className="dev-workflow-label">02 — Branches</span>
            <p className="dev-workflow-desc">
              Work happens on feature branches named <code>feature/description</code>.
              Every branch pushed to GitHub gets an automatic Vercel preview URL —
              a live, isolated version of the site for testing before anything reaches production.
            </p>
          </div>
          <div className="dev-workflow-step">
            <span className="dev-workflow-label">03 — Releases</span>
            <p className="dev-workflow-desc">
              Features ship in named releases (v0.1 Journaling through v0.9 Legal).
              Merging to main triggers an automatic production deploy to wolfman.blog.
              Closing an issue with <code>closes #N</code> in the commit auto-closes it in GitHub.
            </p>
          </div>
          <div className="dev-workflow-step">
            <span className="dev-workflow-label">04 — Feedback loop</span>
            <p className="dev-workflow-desc">
              Beta users submit feedback via the{' '}
              <Link href="/feedback" className="dev-link">feedback form</Link>.
              Each submission becomes a GitHub Issue automatically, labelled{' '}
              <code>beta-feedback</code> and routed to the right milestone.
            </p>
          </div>
        </div>
      </section>

    </main>
  )
}
