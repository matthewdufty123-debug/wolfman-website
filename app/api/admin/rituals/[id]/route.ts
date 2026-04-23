import { auth } from '@/auth'
import { db } from '@/lib/db'
import { rituals, morningState } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

// PATCH — update ritual metadata (key is immutable)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Reject key changes
  if ('key' in body) {
    return NextResponse.json(
      { error: 'Ritual key is immutable after creation' },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (body.label !== undefined) updates.label = body.label.trim()
  if (body.description !== undefined) updates.description = body.description.trim()
  if (body.category !== undefined) updates.category = body.category.trim()
  if (body.color !== undefined) updates.color = body.color
  if (body.svgContent !== undefined) updates.svgContent = body.svgContent
  if (body.emoji !== undefined) updates.emoji = body.emoji
  if (body.hashtag !== undefined) updates.hashtag = body.hashtag
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder
  if (body.isActive !== undefined) updates.isActive = body.isActive

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  updates.updatedAt = new Date()

  const [row] = await db
    .update(rituals)
    .set(updates)
    .where(eq(rituals.id, id))
    .returning()

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(row)
}

// DELETE — hard delete only if no journals reference this ritual key
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  // Fetch the ritual to get its key
  const [ritual] = await db.select().from(rituals).where(eq(rituals.id, id))
  if (!ritual) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check if any journal references this key
  const [usage] = await db
    .select({ count: sql<number>`count(*)` })
    .from(morningState)
    .where(sql`(${morningState.routineChecklist}->>${ritual.key})::boolean = true`)

  if (Number(usage.count) > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${usage.count} journal(s) reference "${ritual.label}". Archive it instead.` },
      { status: 409 }
    )
  }

  await db.delete(rituals).where(eq(rituals.id, id))
  return NextResponse.json({ ok: true })
}
