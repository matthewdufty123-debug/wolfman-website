import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { posts, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// The journal reading page and home page are ISR-cached (revalidate: 300).
// Call this after any mutation that changes what anonymous readers see —
// publish, edit, delete, WOLF|BOT review — so the static pages refresh
// immediately instead of waiting out the interval.
//
// For deletes, call BEFORE removing the row (the slug lookup needs it);
// the revalidated render then 404s, which is correct.
export async function revalidatePost(postId: string): Promise<void> {
  try {
    const [row] = await db
      .select({ slug: posts.slug, username: users.username })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, postId))
      .limit(1)

    if (row?.username) revalidatePath(`/${row.username}/${row.slug}`)
    revalidatePath('/')
  } catch {
    // Non-fatal — the 5-minute ISR interval is the safety net
  }
}
