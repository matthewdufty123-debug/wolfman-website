'use server'

import { signIn } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import { generateUniqueUsername } from '@/lib/username'
import { getSiteConfig, isRegistrationOpen, isCapReached } from '@/lib/site-config'
import { notifyAdminNewRegistration } from '@/lib/email'
import { normalisePhone } from '@/lib/phone'

type ActionState = { error: string } | undefined

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    await signIn('credentials', { email, password, redirectTo: '/account' })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Invalid email or password.' }
    }
    throw error
  }
}

// Modal login: returns result instead of redirecting — caller handles session refresh
export async function loginForModal(email: string, password: string): Promise<{ success: true } | { error: string }> {
  try {
    await signIn('credentials', { email, password, redirect: false })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Invalid email or password.' }
    }
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const password = formData.get('password') as string

  if (!name || !email || !phone || !password) {
    return { error: 'All fields are required.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const phoneNumber = normalisePhone(phone)
  if (!phoneNumber) {
    return { error: 'Please enter a valid phone number with country code (e.g. +447700900000).' }
  }

  const [config, [{ total }]] = await Promise.all([
    getSiteConfig(),
    db.select({ total: count() }).from(users),
  ])
  if (!isRegistrationOpen(config.status)) {
    return { error: 'Registration is not open yet.' }
  }
  if (isCapReached(config.userCap, Number(total))) {
    return { error: 'Registration is currently closed — the beta is full.' }
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    return { error: 'An account with that email already exists.' }
  }

  const [existingPhone] = await db.select({ id: users.id }).from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1)
  if (existingPhone) {
    return { error: 'That phone number is already in use.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const username = await generateUniqueUsername(name)
  await db.insert(users).values({ name, email, phoneNumber, passwordHash, role: 'customer', username })

  notifyAdminNewRegistration({
    username,
    email,
    userCount: Number(total) + 1,
    userCap: config.userCap ?? 51,
  })

  // Auto sign-in and redirect to onboarding
  await signIn('credentials', { email, password, redirectTo: '/onboarding' })
}
