import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { posts as postsTable, users as usersTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PostRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [row] = await db
    .select({ username: usersTable.username })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .where(eq(postsTable.slug, slug))
    .limit(1)

  if (!row?.username) notFound()

  redirect(`/${row.username}/${slug}`)
}
