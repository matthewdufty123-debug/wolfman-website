'use client'

import PostForm from '@/components/PostForm'

interface Props {
  communityEnabled: boolean
  defaultPublic: boolean
  username: string | null
}

export default function WritePageClient({ communityEnabled, defaultPublic, username }: Props) {
  return (
    <PostForm
      mode="create"
      communityEnabled={communityEnabled}
      defaultPublic={defaultPublic}
      username={username}
    />
  )
}
