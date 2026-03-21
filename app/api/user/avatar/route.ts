import { auth } from '@/auth'
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const filename = `avatars/${session.user.id}-${Date.now()}.${ext}`

  const blob = await put(filename, file, { access: 'public', contentType: file.type })

  await db.update(users).set({ avatar: blob.url }).where(eq(users.id, session.user.id))

  return NextResponse.json({ avatarUrl: blob.url })
}
