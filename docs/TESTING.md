# Testing — Wolfman Website

Two layers, deliberately. Fast component tests for logic and state; a real
browser against a real database for the flows that matter.

Nothing here touches production. The E2E harness runs its own throwaway
PostgreSQL on `localhost:55432` and its own Next server on port 3100.

---

## Quick reference

| Command | What it does |
|---------|-------------|
| `npm test` | Component tests once (Vitest). Seconds. |
| `npm run test:watch` | Component tests, re-running as you edit |
| `npm run test:e2e` | Full browser tests against a real DB (Playwright) |
| `npm run test:e2e:ui` | Playwright's interactive UI mode |
| `npm run test:all` | Both layers |
| `npm run test:db start\|stop\|reset\|url` | Drive the test database by hand |

---

## Layer 1 — Component tests (Vitest + React Testing Library)

**Where:** `tests/unit/**/*.test.tsx` · **Config:** `vitest.config.ts`

No database, no browser, no server. These render a component in jsdom, drive it
the way a person would, and assert on what appears. A full run is a few seconds,
so they're the ones to run constantly while working.

This is the right layer for **client state and conditional rendering** — which is
where most of this site's bugs have actually lived: a button disabled when it
shouldn't be, a section that vanishes, an error that never surfaces.

`fetch` is stubbed per test, so API routes are never called. Fixtures for the
`/today` data shape live in `tests/fixtures/today.ts`.

```bash
npm test                       # everything
npx vitest run -t "publish"    # just tests matching "publish"
```

### Writing one

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeTodayData } from '../fixtures/today'

it('enables Publish once there is writing', async () => {
  const user = userEvent.setup()
  render(<TodayHub initialData={makeTodayData()} rituals={[]} communityEnabled username="matthew" />)
  // …
})
```

Query by what the user sees — role, label, visible text — not by CSS class.
A test that breaks when you rename a class but not when the feature breaks is
worse than no test.

---

## Layer 2 — E2E (Playwright)

**Where:** `tests/e2e/*.spec.ts` · **Config:** `playwright.config.ts`

Real Chromium, real Next server, real PostgreSQL, real Auth.js session. These
prove the whole chain — form to API route to database and back — and catch what
component tests structurally cannot: routing, auth gating, server components,
persistence across a reload.

Two viewports run by default: **mobile** (Pixel 7) and **desktop**. Mobile
first, because that's how journals get read.

```bash
npm run test:e2e                          # everything, both viewports
npx playwright test --project=mobile      # mobile only
npx playwright test -g "publish"          # by name
npx playwright test --headed              # watch it happen
npx playwright show-report                # last run's HTML report
```

### What happens on each run

`tests/e2e/global-setup.ts` does the following before any test:

1. Starts PostgreSQL (initialising the cluster on first ever run)
2. Drops and recreates the database
3. Pushes the current Drizzle schema — so schema drift fails loudly here first
4. Seeds two users and three rituals

Then Playwright starts `next dev -p 3100` against `.env.test` and runs the specs.

**Seeded logins** (`scripts/seed-test-db.ts`):

| | Email | Password |
|---|-------|----------|
| User | `wolf@test.local` | `howl-at-the-moon` |
| Admin | `admin@test.local` | `howl-at-the-moon` |

### Test isolation

`/today` works on **one post per user per day**, so tests share a journal unless
you clear it. Call `resetJournals()` in `beforeEach` — it truncates posts and
their children while leaving users and rituals alone. Skip it and the second
test finds a published journal and a "Republish" button.

### Screenshots

```ts
await shot(page, 'today-empty', testInfo.project.name)
```

Written to `tests/screenshots/<viewport>/<name>.png`, and gitignored — they're
working artefacts for looking at a change, not golden images. Nothing fails on a
pixel difference.

Full-page captures hide `position: fixed` chrome (nav bars, the closed login
sheet, the Next dev badge) for the capture only. Without that, fixed elements
get painted into the middle of the stitched image and the screenshot shows
things no visitor ever sees. Pass `{ chrome: true }` when the nav *is* the
subject.

---

## The test database

A throwaway PostgreSQL cluster, driven by `scripts/test-db.sh`. Delete it at any
time; it rebuilds itself on the next run.

```bash
npm run test:db start     # start (initialises on first run)
npm run test:db reset     # drop and recreate, empty
npm run test:db stop
npm run test:db url       # print the connection string
psql "$(npm run --silent test:db url)"   # poke around
```

`scripts/seed-test-db.ts` refuses to run unless `DATABASE_URL` names
`wolfman_test` and is not a Neon host — it can't be pointed at production.

### How the app connects to it

Production talks to Neon over HTTP; the harness needs the wire protocol.
`lib/db/index.ts` switches on `DATABASE_DRIVER=pg`, which **only `.env.test`
ever sets**. Production and local dev are untouched.

### Requirements

The harness needs PostgreSQL 16 binaries at `/usr/lib/postgresql/16/bin`
(override with `PG_BIN`). On a machine without them, the component tests still
run fine on their own — they need nothing.

---

## What to test where

| Testing… | Layer |
|----------|-------|
| Button enabled/disabled, hints, error states | Component |
| Form state, optimistic updates, failure handling | Component |
| Copy and wording | Component |
| Auth gating, redirects, middleware | E2E |
| Data actually persisting | E2E |
| Server components and streamed sections | E2E |
| Mobile layout, the reading experience | E2E + screenshot |

When a bug is found, the fix comes with a test that fails without it. Prove
that: revert the fix, watch the test go red, restore it. A test that passes on
broken code is worse than none, because it buys false confidence.

---

## Known rough edges

- **Dev-server compile latency.** The first hit to a route compiles it, which
  can take 20s+. Timeouts are set generously; the reading page's Suspense
  sections get 45s. Using a production build would remove this, at the cost of a
  build on every run.
- **Playwright browser version.** Some sandboxes ship a Chromium whose build
  number doesn't match this Playwright. `playwright.config.ts` finds a usable
  binary under `PLAYWRIGHT_BROWSERS_PATH`, or falls back to Playwright's own
  download. Override with `PLAYWRIGHT_CHROMIUM_PATH`.
- **No CI wiring yet.** Both layers run locally only. `npm run test:all` is the
  command a CI job would call.
