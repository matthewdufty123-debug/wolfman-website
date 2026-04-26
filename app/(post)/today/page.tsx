import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { findOrCreateTodayPost } from '@/lib/actions/today'
import { getActiveRituals } from '@/lib/rituals'
import TodayHub from './TodayHub'

export default async function TodayPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const timezone = session.user.timezone

  if (!timezone) {
    return (
      <main className="td-hub">
        <div className="td-tz-prompt">
          <p className="td-tz-prompt-text">
            Set your timezone before you start journaling — it defines when your day begins.
          </p>
          <Link href="/settings" className="td-tz-prompt-link">
            Set timezone →
          </Link>
        </div>
      </main>
    )
  }

  const [data, activeRituals] = await Promise.all([
    findOrCreateTodayPost(session.user.id, timezone),
    getActiveRituals(),
  ])

  const ritualDefs = activeRituals.map(r => ({
    key: r.key,
    label: r.label,
    description: r.description,
    category: r.category,
    color: r.color,
    svgContent: r.svgContent,
    sortOrder: r.sortOrder,
  }))

  return (
    <TodayHub
      initialData={data}
      rituals={ritualDefs}
      communityEnabled={session.user.onboardingComplete}
      username={session.user.username}
    />
  )
}
