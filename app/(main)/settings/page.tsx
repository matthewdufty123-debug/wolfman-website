import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ThemeButtons from '@/components/ThemeButtons'
import FontSizeButtons from '@/components/FontSizeButtons'
import FontFamilyButtons from '@/components/FontFamilyButtons'
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
        <FontFamilyButtons />
        <p className="settings-sync-note">Your settings sync across all your devices.</p>
      </div>
    </main>
  )
}
