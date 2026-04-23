import { auth } from '@/auth'
import { db } from '@/lib/db'
import { rituals } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

/** Convert a label to a camelCase key: "Morning Run" → "morningRun" */
function toCamelCase(label: string): string {
  return label
    .trim()
    .split(/\s+/)
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join('')
}

// GET — return all rituals (active + archived), sorted by sortOrder
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const rows = await db.select().from(rituals).orderBy(asc(rituals.sortOrder))
  return NextResponse.json(rows)
}

// POST — create a new ritual
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { label, description, category, color, svgContent, emoji, hashtag, sortOrder } = body

  if (!label?.trim()) {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 })
  }

  const key = toCamelCase(label)

  // Check key uniqueness
  const existing = await db.select({ key: rituals.key }).from(rituals)
  if (existing.some(r => r.key === key)) {
    return NextResponse.json(
      { error: `Key "${key}" already exists. Choose a different label.` },
      { status: 409 }
    )
  }

  const [row] = await db
    .insert(rituals)
    .values({
      key,
      label: label.trim(),
      description: description?.trim() ?? '',
      category: category?.trim() ?? '',
      color: color ?? '#4A7FA5',
      svgContent: svgContent ?? null,
      emoji: emoji ?? null,
      hashtag: hashtag ?? null,
      sortOrder: sortOrder ?? 0,
    })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
