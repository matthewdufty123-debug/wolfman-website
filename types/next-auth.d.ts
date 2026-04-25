import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      displayName: string | null
      bio: string | null
      avatar: string | null
      username: string | null
      onboardingComplete: boolean
      timezone: string | null
    } & DefaultSession['user']
  }

  interface User {
    role?: string
  }
}
