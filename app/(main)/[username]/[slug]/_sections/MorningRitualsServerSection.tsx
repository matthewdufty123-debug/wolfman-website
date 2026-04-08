import { db } from '@/lib/db'
import { morningState } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import MorningRitualsSection from '@/components/journal/MorningRitualsSection'

interface Props {
  postId: string
}

export default async function MorningRitualsServerSection({ postId }: Props) {
  const ms = await db
    .select()
    .from(morningState)
    .where(eq(morningState.postId, postId))
    .then(r => r[0] ?? null)

  if (!ms) return null

  return (
    <MorningRitualsSection checklist={ms.routineChecklist as Record<string, boolean>} />
  )
}
