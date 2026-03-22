import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function JournalPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (user?.username) redirect(`/${user.username}`)
  redirect('/account')
}
