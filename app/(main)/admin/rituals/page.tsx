import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getAllRituals } from '@/lib/rituals'
import RitualManager from '@/components/admin/RitualManager'

export default async function AdminRitualsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') redirect('/')

  const initialRituals = await getAllRituals()

  return (
    <main className="dash-main">
      <div className="dash-wrap">
        <RitualManager initialRituals={initialRituals} />
      </div>
    </main>
  )
}
