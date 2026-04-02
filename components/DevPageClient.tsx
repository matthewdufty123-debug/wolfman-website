'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  GITHUB_REPO, GITHUB_API, cachedFetch, isBetaFeedback,
  type GitHubIssue,
} from '@/lib/github'

type VersionEntry = {
  id: number
  version: string
  releasePhase: string
  releaseName: string
  summary: string
  changes: string[]
  deployedAt: string
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

// ── ReleaseNotes ────────────────────────────────────────────────────────────

function ReleaseNotes({ entries }: { entries: VersionEntry[] }) {
  if (!entries.length) {
    return <p className="dev-empty">No version entries logged yet.</p>
  }

  return (
    <div className="dev-release-notes">
      {entries.map(entry => (
        <div key={entry.id} className="dev-release-entry">
          <div className="dev-release-header">
            <div className="dev-release-meta">
              <span className="dev-release-version">v{entry.version}</span>
              <span className="dev-release-name">{entry.releaseName}</span>
            </div>
            <span className="dev-release-date">
              {new Date(entry.deployedAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
              {' '}
              <span className="dev-release-time">
                {new Date(entry.deployedAt).toLocaleTimeString('en-GB', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </span>
          </div>
          <p className="dev-release-summary">{entry.summary}</p>
          {Array.isArray(entry.changes) && entry.changes.length > 0 && (
            <ul className="dev-release-changes">
              {entry.changes.map((change, i) => (
                <li key={i}>{change}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function DevPageClient() {
  const [openIssues, setOpenIssues] = useState<GitHubIssue[] | null>(null)
  const [closedIssues, setClosedIssues] = useState<GitHubIssue[] | null>(null)
  const [versionEntries, setVersionEntries] = useState<VersionEntry[] | null>(null)
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    cachedFetch<GitHubIssue[]>(`${GITHUB_API}/issues?state=open&per_page=100`, 'wm_gh_open')
      .then(setOpenIssues).catch(() => setOpenIssues([]))
    cachedFetch<GitHubIssue[]>(`${GITHUB_API}/issues?state=closed&per_page=100`, 'wm_gh_closed')
      .then(setClosedIssues).catch(() => setClosedIssues([]))
    fetch('/api/version-history')
      .then(r => r.json())
      .then(setVersionEntries)
      .catch(() => setVersionEntries([]))
  }, [])

  return (
    <main className="dev-main">

      {/* Stats — top */}
      {openIssues && closedIssues && (
        <section className="dev-section">
          <StatsRow openIssues={openIssues} closedIssues={closedIssues} />
        </section>
      )}

      {/* Header + description */}
      <section className="dev-section">
        <h1 className="dev-page-title">wolfman.blog / development</h1>

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
            wolfman.blog is built in the open, in real-time collaboration with Claude Code.
            Every feature starts as a GitHub Issue. Every release is a named milestone.
            What you see below is the actual deployment history — every version logged, every change listed.
            No spin. Just the build.
          </p>
        </div>

        <div className="dev-links">
          <a href={`https://github.com/${GITHUB_REPO}`} className="dev-link" target="_blank" rel="noopener noreferrer">
            See the code on GitHub →
          </a>
          <Link href="/features" className="dev-link">Product roadmap →</Link>
          {isAdmin && (
            <Link href="/admin" className="dev-link">Admin panel →</Link>
          )}
        </div>
      </section>

      {/* Release notes */}
      <section className="dev-section">
        <h2 className="dev-section-title">// release notes</h2>
        {versionEntries === null ? (
          <p className="dev-loading">Loading…</p>
        ) : (
          <ReleaseNotes entries={versionEntries} />
        )}
      </section>

      {/* How we build */}
      <section className="dev-section">
        <h2 className="dev-section-title">// how we build</h2>
        <div className="dev-workflow">
          <div className="dev-workflow-step">
            <span className="dev-workflow-label">01 — Issues</span>
            <p className="dev-workflow-desc">
              Every feature, bug, and idea starts as a GitHub Issue. Issues are labelled,
              milestoned, and prioritised before any code is written.
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
              Features ship in named releases (Closed Alpha through Release 0.9 — Legal).
              Merging to main triggers an automatic production deploy to wolfman.blog.
              Every deployment is logged above with version number and change list.
            </p>
          </div>
          <div className="dev-workflow-step">
            <span className="dev-workflow-label">04 — Versioning</span>
            <p className="dev-workflow-desc">
              Version numbers follow a four-part format:{' '}
              <code>[site state].[release].[feature].[minor update]</code>.{' '}
              The second decimal tracks the current release phase (0.1 = Closed Alpha),
              the third counts feature deploys, and the fourth counts minor fixes.
            </p>
          </div>
          <div className="dev-workflow-step">
            <span className="dev-workflow-label">05 — Feedback loop</span>
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
