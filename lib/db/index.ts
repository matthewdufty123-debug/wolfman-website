import { neon, NeonQueryFunction } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const raw = neon(process.env.DATABASE_URL!)

// Wrap the Neon query function with a single retry on transient failures
// (Neon cold-start / control-plane errors). Without this, the first request
// after Neon auto-suspends crashes the entire server component render.
const sql: NeonQueryFunction<false, false> = (async (...args: Parameters<typeof raw>) => {
  try {
    return await raw(...args)
  } catch (err: unknown) {
    const isRetryable =
      err instanceof Error &&
      (err.message?.includes('Control plane request failed') ||
       (err as unknown as Record<string, unknown>)['neon:retryable'] === true)
    if (!isRetryable) throw err
    // Single retry after a short pause to let Neon wake
    await new Promise(r => setTimeout(r, 500))
    return await raw(...args)
  }
}) as NeonQueryFunction<false, false>

export const db = drizzle(sql, { schema })
