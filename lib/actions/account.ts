'use server'

import { auth, signOut } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { isValidUsername, isUsernameAvailable } from '@/lib/username'
import { normalisePhone } from '@/lib/phone'
import { and, ne } from 'drizzle-orm'

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

export async function updateUsername(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated.' }

  const username = (formData.get('username') as string)?.trim().toLowerCase()
  if (!username) return { error: 'Username cannot be empty.' }

  if (!isValidUsername(username)) {
    return { error: 'Username must be 2–30 characters, lowercase letters, numbers and hyphens only, and cannot start or end with a hyphen.' }
  }

  const available = await isUsernameAvailable(username, session.user.id)
  if (!available) return { error: 'That username is already taken.' }

  await db.update(users).set({ username }).where(eq(users.id, session.user.id))
  revalidatePath('/account')
  return { success: 'Username updated.' }
}

export async function updatePhone(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated.' }

  const raw = (formData.get('phone') as string)?.trim()
  if (!raw) return { error: 'Phone number cannot be empty.' }

  const phoneNumber = normalisePhone(raw)
  if (!phoneNumber) {
    return { error: 'Please enter a valid phone number with country code (e.g. +447700900000).' }
  }

  const [existing] = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.phoneNumber, phoneNumber), ne(users.id, session.user.id)))
    .limit(1)
  if (existing) return { error: 'That phone number is already in use.' }

  await db.update(users).set({ phoneNumber, phoneVerified: false, telegramChatId: null }).where(eq(users.id, session.user.id))
  revalidatePath('/account')
  return { success: 'Phone number updated.' }
}

export async function removePhone(_prev: ActionState): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated.' }

  await db.update(users).set({ phoneNumber: null, phoneVerified: false, telegramChatId: null }).where(eq(users.id, session.user.id))
  revalidatePath('/account')
  return { success: 'Phone number removed.' }
}

export async function unlinkTelegram(_prev: ActionState): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated.' }

  await db.update(users).set({ telegramChatId: null }).where(eq(users.id, session.user.id))
  revalidatePath('/account')
  return { success: 'Telegram unlinked.' }
}

export async function logout() {
  await signOut({ redirectTo: '/' })
}
