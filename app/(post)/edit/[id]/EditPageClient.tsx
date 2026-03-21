'use client'

import { useRouter } from 'next/navigation'
import PostForm from '@/components/PostForm'

interface Props {
  postId: string
  initialData?: Parameters<typeof PostForm>[0]['initialData']
}

export default function EditPageClient({ postId, initialData }: Props) {
  const router = useRouter()
  return (
    <PostForm
      mode="edit"
      postId={postId}
      initialData={initialData}
      onDelete={() => router.push('/write')}
    />
  )
}
