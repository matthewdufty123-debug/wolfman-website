import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function WritePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  redirect('/today')
}
