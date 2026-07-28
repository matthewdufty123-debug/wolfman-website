import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * Production talks to Neon over HTTP. The E2E harness (`npm run test:e2e`)
 * runs a throwaway PostgreSQL on localhost, which speaks the wire protocol
 * instead — set DATABASE_DRIVER=pg to point at it. Nothing but the test
 * harness ever sets that variable, so production is untouched.
 */
function createDb() {
  if (process.env.DATABASE_DRIVER === 'pg') {
    // Required lazily so `pg` is never pulled into a production bundle.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle: drizzlePg } = require('drizzle-orm/node-postgres')
    return drizzlePg(process.env.DATABASE_URL!, { schema }) as unknown as ReturnType<typeof drizzle<typeof schema>>
  }
  return drizzle(neon(process.env.DATABASE_URL!), { schema })
}

export const db = createDb()

/**
 * Retry wrapper for Neon cold-start / control-plane errors.
 * Neon auto-suspends after inactivity; the first request often fails while
 * the instance wakes. Use this around critical queries that run on every
 * page load (e.g. getSiteConfig) to avoid crashing server component renders.
 */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err: unknown) {
    const isRetryable =
      err instanceof Error &&
      (err.message?.includes('Control plane request failed') ||
       (err as unknown as Record<string, unknown>)['neon:retryable'] === true)
    if (!isRetryable) throw err
    await new Promise(r => setTimeout(r, 500))
    return await fn()
  }
}
