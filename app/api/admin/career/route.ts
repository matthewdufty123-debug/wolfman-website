import { auth } from '@/auth'
import { db } from '@/lib/db'
import { careerRoles, careerAchievements, careerSkills } from '@/lib/db/schema'
import { eq, asc, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

// ── GET — return all career data ─────────────────────────────────────────────
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const [roles, achievements, skills] = await Promise.all([
    db.select().from(careerRoles).orderBy(desc(careerRoles.sortOrder)),
    db.select().from(careerAchievements).orderBy(asc(careerAchievements.sortOrder)),
    db.select().from(careerSkills).orderBy(asc(careerSkills.name)),
  ])

  return NextResponse.json({ roles, achievements, skills })
}

// ── POST — create a role, achievement, or skill ──────────────────────────────
export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { type, ...data } = body

  if (type === 'role') {
    const [row] = await db.insert(careerRoles).values({
      title: data.title,
      company: data.company,
      employmentType: data.employmentType,
      startDate: data.startDate,
      endDate: data.endDate || null,
      summary: data.summary,
      sortOrder: data.sortOrder ?? 0,
      isCurrent: data.isCurrent ?? false,
    }).returning()
    return NextResponse.json(row, { status: 201 })
  }

  if (type === 'achievement') {
    const [row] = await db.insert(careerAchievements).values({
      roleId: data.roleId,
      theme: data.theme,
      description: data.description,
      skillTags: data.skillTags ?? [],
      sortOrder: data.sortOrder ?? 0,
    }).returning()
    return NextResponse.json(row, { status: 201 })
  }

  if (type === 'skill') {
    const [row] = await db.insert(careerSkills).values({
      name: data.name,
      theme: data.theme,
      firstUsedDate: data.firstUsedDate || null,
      description: data.description || null,
    }).returning()
    return NextResponse.json(row, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

// ── PUT — update a role, achievement, or skill ───────────────────────────────
export async function PUT(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { type, id, ...data } = body

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (type === 'role') {
    const [row] = await db.update(careerRoles)
      .set({
        title: data.title,
        company: data.company,
        employmentType: data.employmentType,
        startDate: data.startDate,
        endDate: data.endDate || null,
        summary: data.summary,
        sortOrder: data.sortOrder,
        isCurrent: data.isCurrent ?? false,
        updatedAt: new Date(),
      })
      .where(eq(careerRoles.id, id))
      .returning()
    return NextResponse.json(row)
  }

  if (type === 'achievement') {
    const [row] = await db.update(careerAchievements)
      .set({
        roleId: data.roleId,
        theme: data.theme,
        description: data.description,
        skillTags: data.skillTags ?? [],
        sortOrder: data.sortOrder,
      })
      .where(eq(careerAchievements.id, id))
      .returning()
    return NextResponse.json(row)
  }

  if (type === 'skill') {
    const [row] = await db.update(careerSkills)
      .set({
        name: data.name,
        theme: data.theme,
        firstUsedDate: data.firstUsedDate || null,
        description: data.description || null,
      })
      .where(eq(careerSkills.id, id))
      .returning()
    return NextResponse.json(row)
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

// ── DELETE — remove a role, achievement, or skill ────────────────────────────
export async function DELETE(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (!type || !id) return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })

  if (type === 'role') {
    await db.delete(careerRoles).where(eq(careerRoles.id, id))
  } else if (type === 'achievement') {
    await db.delete(careerAchievements).where(eq(careerAchievements.id, id))
  } else if (type === 'skill') {
    await db.delete(careerSkills).where(eq(careerSkills.id, id))
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
