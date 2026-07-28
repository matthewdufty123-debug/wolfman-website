/**
 * Seeds the throwaway E2E database with just enough to drive the app:
 * one ordinary user, one admin, and a handful of rituals.
 *
 * Run via `npm run test:e2e` — it is wired into the harness. Refuses to touch
 * anything that isn't an explicitly-flagged test database.
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { drizzle } from 'drizzle-orm/node-postgres'
import { sql } from 'drizzle-orm'
import * as schema from '../lib/db/schema'
import { users, rituals } from '../lib/db/schema'

export const TEST_USER = {
  email: 'wolf@test.local',
  password: 'howl-at-the-moon',
  username: 'testwolf',
  name: 'Test Wolf',
}

export const TEST_ADMIN = {
  email: 'admin@test.local',
  password: 'howl-at-the-moon',
  username: 'testadmin',
  name: 'Test Admin',
}

const TEST_RITUALS = [
  { key: 'sunlight', label: 'Sunlight', description: 'Get outside early', category: 'Physical', color: '#C8B020', sortOrder: 0 },
  { key: 'movement', label: 'Movement', description: 'Move the body', category: 'Physical', color: '#3AB87A', sortOrder: 1 },
  { key: 'stillness', label: 'Stillness', description: 'Sit with it', category: 'Mindfulness', color: '#4A7FA5', sortOrder: 2 },
]

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  // Hard guard: never let this run against anything but the test database.
  if (!/wolfman_test/.test(url) || /neon\.tech/.test(url)) {
    throw new Error(`Refusing to seed — DATABASE_URL does not look like the test database:\n  ${url}`)
  }

  const db = drizzle(url, { schema })

  await db.execute(sql`TRUNCATE TABLE
    journal_entries, scale_entries, morning_state, wolfbot_reviews, posts,
    accounts, sessions, rituals, users
    RESTART IDENTITY CASCADE`)

  const passwordHash = await bcrypt.hash(TEST_USER.password, 10)

  await db.insert(users).values([
    {
      email: TEST_USER.email,
      passwordHash,
      name: TEST_USER.name,
      displayName: TEST_USER.name,
      username: TEST_USER.username,
      role: 'customer',
      communityEnabled: true,
      onboardingComplete: true,
      timezone: 'Europe/London',
    },
    {
      email: TEST_ADMIN.email,
      passwordHash,
      name: TEST_ADMIN.name,
      displayName: TEST_ADMIN.name,
      username: TEST_ADMIN.username,
      role: 'admin',
      communityEnabled: true,
      onboardingComplete: true,
      timezone: 'Europe/London',
    },
  ])

  await db.insert(rituals).values(TEST_RITUALS)

  console.log(`seeded: ${TEST_USER.email} / ${TEST_ADMIN.email}, ${TEST_RITUALS.length} rituals`)
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
