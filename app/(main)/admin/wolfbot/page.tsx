import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { wolfbotConfig, wolfbotVersionLog } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import WolfbotConfigClient from '@/components/WolfbotConfigClient'

export const metadata = {
  title: 'Wolfbot Config — Admin',
}

export default async function WolfbotConfigPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') redirect('/')

  const [rows, versionLog] = await Promise.all([
    db.select().from(wolfbotConfig).orderBy(wolfbotConfig.id),
    db.select().from(wolfbotVersionLog).orderBy(desc(wolfbotVersionLog.changedAt)).limit(20),
  ])

  return (
    <main className="dash-main">
      <div className="dash-wrap">
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 className="dash-title">wolfbot config</h1>
          <p className="dash-subtitle">prompts · generation settings · version history</p>
        </header>
        <WolfbotConfigClient rows={rows} versionLog={versionLog} />
      </div>
    </main>
  )
}
