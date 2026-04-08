/**
 * One-time backfill: calculate and store word counts for all existing posts.
 * Run via: npx tsx scripts/backfill-word-counts.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { posts } from '../lib/db/schema'
import { eq } from 'drizzle-orm'
import { calculateWordCounts } from '../lib/word-count'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function main() {
  const allPosts = await db
    .select({ id: posts.id, title: posts.title, content: posts.content })
    .from(posts)

  console.log(`Backfilling word counts for ${allPosts.length} posts...`)

  let updated = 0
  for (const post of allPosts) {
    const counts = calculateWordCounts(post.content)
    await db.update(posts).set(counts).where(eq(posts.id, post.id))
    updated++
    console.log(`  [${updated}/${allPosts.length}] ${post.title} — ${counts.wordCountTotal} words`)
  }

  console.log(`Done. ${updated} posts updated.`)
  process.exit(0)
}

main().catch(err => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
