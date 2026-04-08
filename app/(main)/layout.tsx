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
      <ClosedAlphaBanner status={config.status} />
      {children}
      <LowerNavBar registrationOpen={registrationOpen} />
    </PostContextProvider>
  )
}
