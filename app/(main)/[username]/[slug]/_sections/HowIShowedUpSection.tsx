import { db } from '@/lib/db'
import { morningState } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import HumanScoresSection from '@/components/journal/HumanScoresSection'

interface Props {
  postId: string
}

export default async function HowIShowedUpSection({ postId }: Props) {
  const ms = await db
    .select()
    .from(morningState)
    .where(eq(morningState.postId, postId))
    .then(r => r[0] ?? null)

  if (!ms) return null

  return (
    <HumanScoresSection
      brainScale={ms.brainScale}
      bodyScale={ms.bodyScale}
      happyScale={ms.happyScale ?? null}
      stressScale={ms.stressScale ?? null}
    />
  )
}
