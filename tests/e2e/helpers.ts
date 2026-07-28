import type { Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'

export const TEST_USER = {
  email: 'wolf@test.local',
  password: 'howl-at-the-moon',
  username: 'testwolf',
}

/**
 * Wipe every journal, leaving users and rituals in place.
 *
 * /today works on one post per user per day, so without this each test would
 * inherit the previous test's journal — a published one turns "Publish" into
 * "Republish" and quietly invalidates whatever the next test asserts.
 */
export async function resetJournals() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    await client.query(`TRUNCATE TABLE
      journal_entries, scale_entries, morning_state, wolfbot_reviews, posts
      RESTART IDENTITY CASCADE`)
  } finally {
    await client.end()
  }
}

/** Sign in with the seeded credentials and wait for the app to settle. */
export async function login(page: Page, user = TEST_USER) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 30_000 })
}

const SHOT_DIR = 'tests/screenshots'

/**
 * A full-page capture stitches the whole scrollable document together, but
 * `position: fixed` elements are painted wherever they happen to sit in that
 * expanded canvas — so the nav bars repeat mid-page and the closed login sheet
 * (parked off-screen with translateY(100%)) appears floating over the content.
 * None of that is what a person sees, and it makes screenshots untrustworthy.
 *
 * Hiding the fixed chrome for the capture only gives an honest picture of the
 * page's own content. Pass `chrome: true` when the nav is the thing under test.
 */
const HIDE_FIXED_CHROME = `
  .upper-nav, .lower-nav, .login-overlay, .more-pages-overlay { display: none !important; }
  /* The dev server's own overlay badge, which is not part of the site */
  nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }
`

/**
 * Save a screenshot under tests/screenshots/<project>/<name>.png.
 * These are working artefacts for looking at a change, not golden-image
 * comparisons — nothing fails on a pixel difference.
 */
export async function shot(
  page: Page,
  name: string,
  project = 'default',
  opts: { fullPage?: boolean; chrome?: boolean } = {},
) {
  const { fullPage = true, chrome = false } = opts
  const dir = join(SHOT_DIR, project)
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `${name}.png`)
  await page.screenshot({
    path,
    fullPage,
    ...(fullPage && !chrome ? { style: HIDE_FIXED_CHROME } : {}),
  })
  return path
}
