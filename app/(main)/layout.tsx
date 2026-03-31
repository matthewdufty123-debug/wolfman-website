import UpperNavBar from '@/components/UpperNavBar'
import LowerNavBar from '@/components/LowerNavBar'
import ClosedAlphaBanner from '@/components/ClosedAlphaBanner'
import { PostContextProvider } from '@/lib/post-context'
import { getSiteConfig, isRegistrationOpen } from '@/lib/site-config'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig()
  const registrationOpen = isRegistrationOpen(config.status)

  return (
    <PostContextProvider>
      <UpperNavBar />
      <ClosedAlphaBanner />
      {children}
      <LowerNavBar registrationOpen={registrationOpen} />
      {process.env.NEXT_PUBLIC_APP_VERSION && (
        <span className="app-version-badge" aria-hidden="true">
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </span>
      )}
    </PostContextProvider>
  )
}
