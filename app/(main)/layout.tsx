export const dynamic = 'force-dynamic'

import UpperNavBar from '@/components/UpperNavBar'
import LowerNavBar from '@/components/LowerNavBar'
import { PostContextProvider } from '@/lib/post-context'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <PostContextProvider>
      <UpperNavBar />
      {children}
      <LowerNavBar />
    </PostContextProvider>
  )
}
