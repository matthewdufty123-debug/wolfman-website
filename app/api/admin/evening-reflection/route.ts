import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { eveningReflection } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

// GET /api/admin/evening-reflection?postId=xxx
export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const [row] = await db
    .select()
    .from(eveningReflection)
    .where(eq(eveningReflection.postId, postId))

  return NextResponse.json(row ?? null)
}

// POST /api/admin/evening-reflection — create or update
export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { postId, reflection, wentToPlan, dayRating } = await request.json()

  if (!postId || !reflection || wentToPlan === undefined || !dayRating) {
    return NextResponse.json({ error: 'postId, reflection, wentToPlan and dayRating are required' }, { status: 400 })
  }

  // Upsert — update if exists, insert if not
  const [existing] = await db
    .select({ id: eveningReflection.id })
    .from(eveningReflection)
    .where(eq(eveningReflection.postId, postId))

  if (existing) {
    const [updated] = await db
      .update(eveningReflection)
      .set({ reflection, wentToPlan, dayRating, updatedAt: new Date() })
      .where(eq(eveningReflection.postId, postId))
      .returning()
    return NextResponse.json(updated)
  }

  const [created] = await db
    .insert(eveningReflection)
    .values({ postId, reflection, wentToPlan, dayRating })
    .returning()

  return NextResponse.json(created, { status: 201 })
}
