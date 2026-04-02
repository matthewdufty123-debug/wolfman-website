import { cache } from 'react'
import { db } from '@/lib/db'
import { siteConfig } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { users } from '@/lib/db/schema'

export type SiteStatus = 'closed_alpha' | 'closed_beta' | 'open_beta' | 'live'

export type SiteConfig = {
  status: SiteStatus
  userCap: number | null
  statusMessage: string | null
  betaOpensAt: Date | null
  currentRelease: string
}

// Cached per request — deduplicates multiple calls within a single render cycle.
// getSiteConfig() auto-bootstraps the singleton row on first call if it doesn't exist.
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const [row] = await db.select().from(siteConfig).where(eq(siteConfig.id, 1)).limit(1)

  if (!row) {
    await db.insert(siteConfig).values({
      id: 1,
      status: 'closed_alpha',
      userCap: 51,
      currentRelease: 'closed_alpha_dev',
    })
    return { status: 'closed_alpha', userCap: 51, statusMessage: null, betaOpensAt: null, currentRelease: 'closed_alpha_dev' }
  }

  return {
    status: row.status as SiteStatus,
    userCap: row.userCap ?? null,
    statusMessage: row.statusMessage ?? null,
    betaOpensAt: row.betaOpensAt ?? null,
    currentRelease: row.currentRelease ?? 'closed_alpha_dev',
  }
})

// Returns true when new registrations are conceptually open (used to show/hide register links)
export function isRegistrationOpen(status: SiteStatus): boolean {
  return status === 'open_beta' || status === 'live'
}

// Returns true when the cap has been reached (or exceeded).
// Pass the current user count to avoid an extra DB call at the call site.
export function isCapReached(userCap: number | null, currentCount: number): boolean {
  if (userCap === null) return false
  return currentCount >= userCap
}

// Convenience: fetch config + current user count together
export async function getRegistrationState(): Promise<{
  config: SiteConfig
  userCount: number
  registrationOpen: boolean
  capReached: boolean
}> {
  const [config, [{ total }]] = await Promise.all([
    getSiteConfig(),
    db.select({ total: count() }).from(users),
  ])
  const userCount = Number(total)
  const registrationOpen = isRegistrationOpen(config.status)
  const capReached = isCapReached(config.userCap, userCount)
  return { config, userCount, registrationOpen, capReached }
}
