import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const RESERVED_USERNAMES = new Set([
  'admin', 'shop', 'cart', 'checkout', 'account', 'settings',
  'login', 'register', 'write', 'edit', 'discover', 'api',
  'feedback', 'beta', 'about', 'intentions', 'morning-stats',
  'morning-ritual', 'journal', 'stats', 'profile', 'help',
  'support', 'terms', 'privacy', 'null', 'undefined', 'wolfman',
])

const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{0,28}[a-z0-9]$|^[a-z0-9]{2}$/

export function isValidUsername(u: string): boolean {
  return USERNAME_REGEX.test(u) && !RESERVED_USERNAMES.has(u)
}

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
    || 'user'
}

// Generates a unique username for a given name, avoiding DB collisions.
// Checks reserved list first, then appends -2, -3... if taken.
export async function generateUniqueUsername(name: string): Promise<string> {
  const base = slugifyName(name)
  const safe = RESERVED_USERNAMES.has(base) ? `${base}-user` : base

  // Check if the base is free
  const [existing] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.username, safe))
    .limit(1)

  if (!existing) return safe

  // Find a free numbered variant
  for (let i = 2; i <= 99; i++) {
    const candidate = `${safe.slice(0, 27)}-${i}`
    const [taken] = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.username, candidate))
      .limit(1)
    if (!taken) return candidate
  }

  // Fallback: timestamp suffix (effectively guaranteed unique)
  return `${safe.slice(0, 20)}-${Date.now().toString(36)}`
}

// Check if a username is available for a specific user (allows their current username through)
export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  if (!isValidUsername(username)) return false
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)
  if (!existing) return true
  if (excludeUserId && existing.id === excludeUserId) return true
  return false
}
