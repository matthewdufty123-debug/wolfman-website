'use server'

import { auth, signOut } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

type ActionState = { error?: string; success?: string } | undefined

export async function updateName(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated.' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Name cannot be empty.' }

  await db.update(users).set({ name }).where(eq(users.id, session.user.id))
  revalidatePath('/account')
  return { success: 'Name updated.' }
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated.' }

  const current = formData.get('current') as string
  const next = formData.get('next') as string

  if (!current || !next) return { error: 'All fields are required.' }
  if (next.length < 8) return { error: 'New password must be at least 8 characters.' }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user?.passwordHash) return { error: 'No password set on this account — you signed in with a social provider.' }

  const match = await bcrypt.compare(current, user.passwordHash)
  if (!match) return { error: 'Current password is incorrect.' }

  const passwordHash = await bcrypt.hash(next, 12)
  await db.update(users).set({ passwordHash }).where(eq(users.id, session.user.id))
  return { success: 'Password updated.' }
}

export async function logout() {
  await signOut({ redirectTo: '/' })
}
