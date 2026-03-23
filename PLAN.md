# Implementation Plan — Issues #120, #121, #122, #123, #125, #128

## Overview

Five commits, sequenced from quickest to most complex.

---

## Commit 1 — #128: Remove "New Journal" button from admin header

**File:** `app/(main)/admin/page.tsx`

Remove the `<Link href="/write" className="dash-action-btn">+ New journal</Link>` from the `<header>` block (currently lines 37–39). The matching link in the Quick Links section (line 131) stays.

---

## Commit 2 — #120: Feedback form topic labels + advanced section

### `components/FeedbackPageClient.tsx`

Add a `TOPICS` constant:
```ts
const TOPICS = ['Journal', 'Stats', 'Design', 'Performance', 'SEO', 'Shop', 'Auth', 'Mobile', 'Admin']
```

Add state:
```ts
const [selectedTopics, setSelectedTopics] = useState<string[]>([])
const [showAdvanced, setShowAdvanced] = useState(false)
```

Toggle topic function:
```ts
function toggleTopic(t: string) {
  setSelectedTopics(prev =>
    prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
  )
}
```

In the form, after the category pills field, add:

```tsx
{/* Topic area (optional, multi-select) */}
<div className="feedback-field">
  <p className="feedback-label">
    Topic area <span className="feedback-label-optional">(optional)</span>
  </p>
  <div className="feedback-topics">
    {TOPICS.map(t => (
      <button
        key={t}
        type="button"
        className={`feedback-topic-pill${selectedTopics.includes(t) ? ' is-active' : ''}`}
        onClick={() => toggleTopic(t)}
      >
        {t}
      </button>
    ))}
  </div>
</div>

{/* Advanced toggle */}
<div className="feedback-advanced-toggle">
  <button
    type="button"
    className="feedback-advanced-btn"
    onClick={() => setShowAdvanced(o => !o)}
  >
    {showAdvanced ? '− Less options' : '+ More options'}
  </button>
</div>

{showAdvanced && (
  <div className="feedback-advanced">
    <p className="feedback-advanced-note">
      Topic tags help triage your feedback into the right area of the backlog.
      Matthew reviews everything regardless.
    </p>
  </div>
)}
```

In `handleSubmit`, append topics to FormData:
```ts
form.append('topics', selectedTopics.join(','))
```

Reset topics on success:
```ts
setSelectedTopics([])
setShowAdvanced(false)
```

### `app/api/feedback/route.ts`

Read topics from form data and build label array:
```ts
const topicsRaw = form.get('topics') as string | null
const topicLabels = topicsRaw
  ? topicsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
  : []

const labels = ['beta-feedback', category.toLowerCase(), ...topicLabels]
```

Pass `labels` to the GitHub API call (replacing the hardcoded `['beta-feedback']`).

---

## Commit 3 — #121: /dev page + feedback → dev log link

### New file: `app/(main)/dev/page.tsx`

```tsx
import type { Metadata } from 'next'
import { siteMetadata } from '@/lib/metadata'
import DevPageClient from '@/components/DevPageClient'

export const metadata: Metadata = siteMetadata({
  title: 'Development log',
  description: 'An open log of how wolfman.blog is built and where it\'s going.',
  path: '/dev',
})

export default function DevPage() {
  return <DevPageClient />
}
```

### `components/NavBar.tsx`

Add `'dev'` to `KNOWN_PREFIXES` (line 36) so `/dev` isn't treated as a post page.

### `components/FeedbackPageClient.tsx`

At the bottom of the feedback card (after the form/success block), add:
```tsx
<div className="feedback-dev-link">
  <Link href="/dev" className="feedback-dev-anchor">
    See what&apos;s in the pipeline →
  </Link>
</div>
```

---

## Commit 4 — #122 + #123: Dev panel rework + charts

This is the largest change. Both `DevOverlay.tsx` and `DevPageClient.tsx` get the same content logic; they differ only in their outermost wrapper (overlay chrome vs. `<main>`).

### Data model changes

Add `created_at: string` to `GitHubIssue` interface in both files.

### Helper functions

**Stage label detection:**
```ts
function stageLabel(issue: GitHubIssue): string | null {
  const label = issue.labels.find(l => /^P\dS\d/i.test(l.name))
  return label ? label.name.toUpperCase() : null
}
```

**Stage sort order:**
```ts
function stageOrder(s: string): number {
  const m = s.match(/P(\d)S(\d)/i)
  if (!m) return 999
  return parseInt(m[1]) * 10 + parseInt(m[2])
}
```

**Is beta-feedback issue:**
```ts
function isBetaFeedback(issue: GitHubIssue): boolean {
  return issue.labels.some(l => l.name === 'beta-feedback')
}
```

**Week string (ISO week):**
```ts
function isoWeek(dateStr: string): string {
  const d = new Date(dateStr)
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const week = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
  return `w${week}`
}
```

### New sub-components

#### `StatsRow` (replaces MilestoneStats + OverallProgressBar)
Props: `{ openIssues: GitHubIssue[], closedIssues: GitHubIssue[] }`

Computes:
- `openCount` = open issues excluding beta-feedback
- `closedCount` = closed issues excluding beta-feedback
- `feedbackCount` = open issues that ARE beta-feedback

Renders three stat pills in a row: `{openCount} open`, `{closedCount} built`, `{feedbackCount} feedback`.

#### `Pipeline` (reworked)
Props: `{ issues: GitHubIssue[] }`

- Filter out beta-feedback issues
- Group by stage label (or 'Other' if none)
- Sort groups by stageOrder
- Each group is collapsible: local state `Set<string>` of open groups
- Header: `P2S1  ·  3 issues  [+]`
- Expanded: table of issue number (linked), title, status badges

#### `ClosedWork` (reworked)
Props: `{ issues: GitHubIssue[] }`

- Filter out beta-feedback items
- No body text shown — just number, title, labels, close date
- Show 10 initially, "Show N more →" / "Hide ↑"

#### `DevStats` (new — #123)
Props: `{ openIssues: GitHubIssue[], closedIssues: GitHubIssue[] }`

Collapsible section toggled by a button. Default: collapsed.

**Chart 1 — Weekly velocity** (`BarChart` from recharts):
- Data: last 8 ISO weeks
- For each week: count issues where `created_at` falls in that week (opened) and `closed_at` falls in that week (closed)
- Two bars: opened (`#A0622A` copper) and closed (`#4A7FA5` steel blue)
- X-axis: week label. Y-axis: count (integer ticks)

**Chart 2 — Open issue age** (`BarChart`):
- Buckets: `< 1w`, `1–2w`, `2–4w`, `1–3m`, `> 3m`
- For each open issue (excluding beta-feedback): compute `(now - created_at)` in days, place in bucket
- Single bar per bucket, colour: `#C8B020` mustard

**Chart 3 — Avg resolution by stage** (`BarChart`):
- For closed issues with a stage label: group by stage, compute mean days from `created_at` to `closed_at`
- Bar colour: `#4A7FA5`
- Skip stages with fewer than 2 closed issues

All charts: `width="100%" height={180}`, `ResponsiveContainer`, minimal styling.

### New content structure (both files)

```
[Intro block — what this is + link to /beta]
[StatsRow]
[DevStats — collapsible, default collapsed]
[// pipeline section — Pipeline component]
[// completed work section — ClosedWork component]
```

Remove: `MilestoneStats`, `OverallProgressBar`, milestone fetching (`wm_gh_milestones`).

### API fetch changes

Both files: remove the `milestones` fetch entirely. Keep open + closed issue fetches.

The open issues fetch already includes beta-feedback items (they're just excluded from pipeline/closed display). The `feedbackCount` in `StatsRow` counts them from the open issues array.

---

## Commit 5 — #125: Beta opening date banner for logged-out users

### New component: `components/BetaBanner.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

const DISMISSED_KEY = 'wm_beta_banner_dismissed'

export default function BetaBanner({ betaOpensAt }: { betaOpensAt: string | null }) {
  const { data: session, status } = useSession()
  const [dismissed, setDismissed] = useState(true) // default hidden until checked

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === '1')
  }, [])

  if (status === 'loading') return null
  if (session) return null      // logged-in users don't see this
  if (dismissed) return null

  const dateLabel = betaOpensAt
    ? new Date(betaOpensAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const message = dateLabel
    ? `wolfman.blog beta opens ${dateLabel} — 51 spots available.`
    : `wolfman.blog beta is coming — 51 spots available.`

  function dismiss(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="beta-banner">
      <Link href="/beta" className="beta-banner-link">
        {message} <span className="beta-banner-cta">Find out more →</span>
      </Link>
      <button className="beta-banner-dismiss" onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
```

**CSS class spec:**
- `.beta-banner` — `position: fixed; top: 0; left: 0; right: 0; z-index: 200; background: #4A7FA5; color: #fff; display: flex; align-items: center; justify-content: center; padding: 0.4rem 1rem; font-size: 0.8rem;`
- `.beta-banner-link` — `color: inherit; text-decoration: none; flex: 1; text-align: center;`
- `.beta-banner-cta` — `font-weight: 600;`
- `.beta-banner-dismiss` — `background: none; border: none; color: #fff; font-size: 1.1rem; cursor: pointer; padding: 0 0 0 0.75rem; opacity: 0.7;`

### Layout integration

Find where `NavBar` and `TopBar` are mounted (likely `app/(main)/layout.tsx` or the root `app/layout.tsx`). The layout already fetches `getSiteConfig()` (or `getRegistrationState()`) server-side to pass `registrationOpen` to `NavBar`.

In the same layout:
1. Pass `betaOpensAt={config.betaOpensAt?.toISOString() ?? null}` to `BetaBanner`
2. Mount `<BetaBanner>` before `<TopBar>` in the JSX

**Open question for Matthew:** What is the actual beta opening date? Set it via the admin `SiteConfigPanel` or confirm a date to hardcode. The `betaOpensAt` field already exists in the `siteConfig` DB table — just needs a value set.

---

## CSS additions needed

New classes across the above (add to the relevant stylesheet — check where existing `feedback-*` and `dev-*` classes live):

- `feedback-topics` — flex wrap row, gap
- `feedback-topic-pill` — similar to `feedback-category-pill` but secondary style (outline, smaller)
- `feedback-topic-pill.is-active` — filled accent
- `feedback-advanced-toggle` — margin top, text-align left
- `feedback-advanced-btn` — unstyled button, small, muted colour, hover underline
- `feedback-advanced` — subtle background box, small text
- `feedback-dev-link` — margin top, text-align centre or right
- `feedback-dev-anchor` — muted link style
- `dev-stats-row` — flex row, three stat pills, gap
- `dev-stats-pill` — pill with number + label
- `dev-group-header` — flex row, clickable, label + count + expand icon
- `dev-group-body` — table, shown/hidden based on expand state
- `beta-banner` — (see above)
- `beta-banner-link`, `beta-banner-cta`, `beta-banner-dismiss` — (see above)

---

## Open questions / decisions for Matthew

1. **#125 — Beta opening date:** What date should the banner show? Set it in the admin `SiteConfigPanel` or confirm a date here. If no date is set yet, the banner shows the "coming soon" variant.

2. **#122 — "Current functionality" MD file:** Issue #122 mentions a separate MD file describing the user journey and site structure. Treat this as a separate issue to scope (don't implement here).

3. **#123 — Chart visibility:** Should the stats section be visible to all users or admin-only? Proposed: visible to all (it's public GitHub data anyway).
