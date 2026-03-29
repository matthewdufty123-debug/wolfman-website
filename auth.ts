import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema'
import { authConfig } from './auth.config'
import { generateUniqueUsername } from '@/lib/username'

const ADMIN_GITHUB_USERNAME = 'matthewdufty123-debug'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }
        if (!email || !password) return null

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (!user || !user.passwordHash) return null

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        if (!passwordMatch) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (user.id && user.name) {
        const username = await generateUniqueUsername(user.name)
        await db.update(users).set({ username }).where(eq(users.id, user.id))
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github') {
        const githubUsername = (profile as { login?: string })?.login
        if (githubUsername === ADMIN_GITHUB_USERNAME) {
          await db
            .update(users)
            .set({ role: 'admin' })
            .where(eq(users.email, user.email!))
          user.role = 'admin'
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? 'customer'
        token.id = user.id
        // Fetch extended profile fields at sign-in time
        const [row] = await db
          .select({ displayName: users.displayName, bio: users.bio, avatar: users.avatar, username: users.username, onboardingComplete: users.onboardingComplete })
          .from(users)
          .where(eq(users.id, user.id!))
        token.displayName        = row?.displayName        ?? null
        token.bio                = row?.bio                ?? null
        token.avatar             = row?.avatar             ?? null
        token.username           = row?.username           ?? null
        token.onboardingComplete = row?.onboardingComplete ?? false
      } else if (token.id && !token.username) {
        // Username was null at sign-in (set later via account page) — re-fetch
        const [row] = await db
          .select({ username: users.username })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1)
        token.username = row?.username ?? null
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.role             = token.role             as string
        session.user.id               = token.id               as string
        session.user.displayName      = token.displayName      as string | null
        session.user.bio              = token.bio              as string | null
        session.user.avatar           = token.avatar           as string | null
        session.user.username         = token.username         as string | null
        session.user.onboardingComplete = token.onboardingComplete as boolean
      }
      return session
    },
  },
})
