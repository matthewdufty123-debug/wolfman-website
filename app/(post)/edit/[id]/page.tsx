import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { loadPostForEdit } from '@/lib/actions/today'
import { getActiveRituals } from '@/lib/rituals'
import TodayHub from '../../today/TodayHub'

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const [data, activeRituals] = await Promise.all([
    loadPostForEdit(id, session.user.id),
    getActiveRituals(),
  ])

  if (!data) notFound()

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
