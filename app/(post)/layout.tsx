import NavBar from '@/components/NavBar'
import TopBar from '@/components/TopBar'
import { PostContextProvider } from '@/lib/post-context'

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return (
    <PostContextProvider>
      {children}
      <NavBar />
      <TopBar />
    </PostContextProvider>
  )
}
