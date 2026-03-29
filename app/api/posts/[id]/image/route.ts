import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { put } from '@vercel/blob'
import { db } from '@/lib/db'
import { posts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Verify post ownership
  const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, id))
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.authorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const form = await request.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'File must be a JPEG, PNG, or WebP' }, { status: 400 })
  }

  const maxSize = 5 * 1024 * 1024 // 5MB (post images are pre-cropped and compressed client-side)
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `journal-photos/${id}-${Date.now()}.${ext}`

  const blob = await put(filename, file, { access: 'public', contentType: file.type })

  // Update the post's image field
  await db.update(posts).set({ image: blob.url, updatedAt: new Date() }).where(eq(posts.id, id))

  return NextResponse.json({ url: blob.url })
}
