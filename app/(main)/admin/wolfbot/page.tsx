import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { wolfbotConfig } from '@/lib/db/schema'
import WolfbotConfigClient from '@/components/WolfbotConfigClient'

export const metadata = {
  title: 'Wolfbot Config — Admin',
}

export default async function WolfbotConfigPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') redirect('/')

  const rows = await db
    .select()
    .from(wolfbotConfig)
    .orderBy(wolfbotConfig.id)

  return (
    <main className="dash-main">
      <div className="dash-wrap">
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 className="dash-title">wolfbot config</h1>
          <p className="dash-subtitle">pixel art mascot — configuration &amp; sprite editor</p>
        </header>
        <WolfbotConfigClient rows={rows} />
      </div>
    </main>
  )
}
