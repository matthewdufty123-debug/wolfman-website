import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })

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
