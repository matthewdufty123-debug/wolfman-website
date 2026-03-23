import NavBar from '@/components/NavBar'
import TopBar from '@/components/TopBar'
import { PostContextProvider } from '@/lib/post-context'
import { getSiteConfig, isRegistrationOpen } from '@/lib/site-config'

export default async function PostLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig()
  const registrationOpen = isRegistrationOpen(config.status)

  return (
    <PostContextProvider>
      {children}
      <NavBar registrationOpen={registrationOpen} />
      <TopBar />
    </PostContextProvider>
  )
}
