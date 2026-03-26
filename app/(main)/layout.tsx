import NavBar from '@/components/NavBar'
import TopBar from '@/components/TopBar'
import ClosedAlphaBanner from '@/components/ClosedAlphaBanner'
import { PostContextProvider } from '@/lib/post-context'
import { getSiteConfig, isRegistrationOpen } from '@/lib/site-config'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig()
  const registrationOpen = isRegistrationOpen(config.status)

  return (
    <PostContextProvider>
      <ClosedAlphaBanner />
      {children}
      <NavBar registrationOpen={registrationOpen} />
      <TopBar />
    </PostContextProvider>
  )
}
