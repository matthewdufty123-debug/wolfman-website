import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ThemeButtons from '@/components/ThemeButtons'
import FontSizeButtons from '@/components/FontSizeButtons'
import ReminderSettings from '@/components/ReminderSettings'
import { noindexMetadata } from '@/lib/metadata'

export const metadata: Metadata = noindexMetadata('Settings')

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <main className="settings-main">
      <div className="settings-section">
        <h1 className="settings-title">settings</h1>
        <ThemeButtons />
        <FontSizeButtons />
        <p className="settings-sync-note">Your settings sync across all your devices.</p>
        <div style={{ marginTop: '2rem' }}>
          <h2 className="settings-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>reminders</h2>
          <ReminderSettings />
        </div>
      </div>
    </main>
  )
}
