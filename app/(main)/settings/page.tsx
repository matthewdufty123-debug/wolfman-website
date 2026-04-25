import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { noindexMetadata } from '@/lib/metadata'
import SectionHeader from '@/components/SectionHeader'
import ThemeButtons from '@/components/ThemeButtons'
import FontSizeButtons from '@/components/FontSizeButtons'
import TimezoneSettings from '@/components/TimezoneSettings'
import ReminderSettings from '@/components/ReminderSettings'
import AccountCommunityForm from '@/components/AccountCommunityForm'
import AccountWolfBotProfileForm from '@/components/AccountWolfBotProfileForm'

export const metadata: Metadata = noindexMetadata('Settings')

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const [userData] = await db
    .select({
      communityEnabled: users.communityEnabled,
      defaultPublic: users.defaultPublic,
      profession: users.profession,
      humourSource: users.humourSource,
    })
    .from(users)
    .where(eq(users.id, session.user.id))

  const username = session.user.username ?? ''

  return (
    <main className="personal-page">
      <SectionHeader section="personal" current="/settings" username={username} />
      <div className="personal-page-wrap">

        {/* Appearance */}
        <div className="setting-card">
          <div className="setting-card-head">
            <p className="setting-card-label">Appearance</p>
            <p className="setting-card-title">Theme</p>
            <p className="setting-card-desc">Choose how Wolfman looks.</p>
          </div>
          <div className="setting-card-divider" />
          <div className="setting-card-body">
            <ThemeButtons />
          </div>
        </div>

        {/* Reading size */}
        <div className="setting-card">
          <div className="setting-card-head">
            <p className="setting-card-label">Reading</p>
            <p className="setting-card-title">Text size</p>
            <p className="setting-card-desc">Adjust the size of text when reading journals.</p>
          </div>
          <div className="setting-card-divider" />
          <div className="setting-card-body">
            <FontSizeButtons />
          </div>
        </div>

        {/* Timezone */}
        <div className="setting-card">
          <div className="setting-card-head">
            <p className="setting-card-label">Journal</p>
            <p className="setting-card-title">Your timezone</p>
            <p className="setting-card-desc">Defines your journal day boundary. Midnight in your timezone starts a new day.</p>
          </div>
          <div className="setting-card-divider" />
          <div className="setting-card-body">
            <TimezoneSettings />
          </div>
        </div>

        {/* Morning reminder */}
        <div className="setting-card">
          <div className="setting-card-head">
            <p className="setting-card-label">Notifications</p>
            <p className="setting-card-title">Morning reminder</p>
            <p className="setting-card-desc">A gentle nudge to write your intention. Only sent on days you haven&apos;t journalled yet.</p>
          </div>
          <div className="setting-card-divider" />
          <div className="setting-card-body">
            <ReminderSettings />
          </div>
        </div>

        {/* Community */}
        <div className="setting-card">
          <div className="setting-card-head">
            <p className="setting-card-label">Community</p>
            <p className="setting-card-title">Journal visibility</p>
            <p className="setting-card-desc">Control whether your journals appear in the community feed.</p>
          </div>
          <div className="setting-card-divider" />
          <div className="setting-card-body">
            <AccountCommunityForm
              communityEnabled={userData?.communityEnabled ?? false}
              defaultPublic={userData?.defaultPublic ?? false}
            />
          </div>
        </div>

        {/* WOLF|BOT profile */}
        <div className="setting-card">
          <div className="setting-card-head">
            <p className="setting-card-label">WOLF|BOT</p>
            <p className="setting-card-title">Your profile</p>
            <p className="setting-card-desc">These details personalise your WOLF|BOT journal reviews.</p>
          </div>
          <div className="setting-card-divider" />
          <div className="setting-card-body">
            <AccountWolfBotProfileForm
              profession={userData?.profession ?? ''}
              humourSource={userData?.humourSource ?? ''}
            />
          </div>
        </div>

        <p className="personal-sync-note">Your settings sync across all your devices.</p>
      </div>
    </main>
  )
}
