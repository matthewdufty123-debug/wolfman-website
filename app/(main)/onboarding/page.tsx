import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import OnboardingForm from '@/components/OnboardingForm'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // If already completed onboarding, send to profile
  const [user] = await db
    .select({ onboardingComplete: users.onboardingComplete, username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user) redirect('/login')
  if (user.onboardingComplete) {
    redirect(user.username ? `/${user.username}` : '/')
  }

  return (
    <main className="onboarding-page">
      <div className="onboarding-card">
        <p className="beta-eyebrow">Welcome to Wolfman</p>
        <h1 className="onboarding-title">Let&apos;s set up your journal.</h1>
        <p className="onboarding-subtitle">
          Two quick questions and you&apos;ll be writing your first morning intention.
        </p>
        <OnboardingForm username={user.username} />
      </div>
    </main>
  )
}
