import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getAllRituals } from '@/lib/rituals'
import RitualManager from '@/components/admin/RitualManager'

export default async function AdminRitualsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') redirect('/')

  const rows = await getAllRituals()

  // Serialize dates for client component
  const initialRituals = rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  return (
    <main className="dash-main">
      <div className="dash-wrap">
        <RitualManager initialRituals={initialRituals} />
      </div>
    </main>
  )
}
