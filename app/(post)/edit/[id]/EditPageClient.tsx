'use client'

import { useRouter } from 'next/navigation'
import PostForm from '@/components/PostForm'

interface Props {
  postId: string
  initialData?: Parameters<typeof PostForm>[0]['initialData']
  communityEnabled: boolean
  defaultPublic: boolean
  initialIsPublic: boolean
  username: string | null
}

export default function EditPageClient({ postId, initialData, communityEnabled, defaultPublic, initialIsPublic, username }: Props) {
  const router = useRouter()
  return (
    <PostForm
      mode="edit"
      postId={postId}
      initialData={initialData}
      onDelete={() => router.push('/write')}
      communityEnabled={communityEnabled}
      defaultPublic={defaultPublic}
      initialIsPublic={initialIsPublic}
      username={username}
    />
  )
}
