'use client'

import { useRouter } from 'next/navigation'
import PostForm, { type RitualDef } from '@/components/PostForm'

interface Props {
  postId: string
  initialData?: Parameters<typeof PostForm>[0]['initialData']
  initialTitleSuggestionsUsed?: number
  communityEnabled: boolean
  defaultPublic: boolean
  initialIsPublic: boolean
  username: string | null
  wolfbotReviewExists: boolean
  rituals: RitualDef[]
}

export default function EditPageClient({ postId, initialData, initialTitleSuggestionsUsed, communityEnabled, defaultPublic, initialIsPublic, username, wolfbotReviewExists, rituals }: Props) {
  const router = useRouter()
  return (
    <PostForm
      mode="edit"
      postId={postId}
      initialData={initialData}
      initialTitleSuggestionsUsed={initialTitleSuggestionsUsed}
      onDelete={() => router.push('/write')}
      communityEnabled={communityEnabled}
      defaultPublic={defaultPublic}
      initialIsPublic={initialIsPublic}
      username={username}
      wolfbotReviewExists={wolfbotReviewExists}
      rituals={rituals}
    />
  )
}
