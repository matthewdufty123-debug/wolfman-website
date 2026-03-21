'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

type PostMeta = { postId: string; authorId: string | null }

type PostContextValue = {
  post: PostMeta | null
  setPost: (meta: PostMeta) => void
  clearPost: () => void
}

const PostContext = createContext<PostContextValue>({
  post: null,
  setPost: () => {},
  clearPost: () => {},
})

export function PostContextProvider({ children }: { children: React.ReactNode }) {
  const [post, setPostState] = useState<PostMeta | null>(null)
  const setPost = useCallback((meta: PostMeta) => setPostState(meta), [])
  const clearPost = useCallback(() => setPostState(null), [])
  return (
    <PostContext.Provider value={{ post, setPost, clearPost }}>
      {children}
    </PostContext.Provider>
  )
}

export function usePostContext() {
  return useContext(PostContext)
}

// Rendered by post pages to register their postId + authorId into context
export function PostContextSetter({ postId, authorId }: PostMeta) {
  const { setPost, clearPost } = usePostContext()
  useEffect(() => {
    setPost({ postId, authorId })
    return () => clearPost()
  }, [postId, authorId, setPost, clearPost])
  return null
}
