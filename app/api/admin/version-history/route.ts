import { auth } from '@/auth'
import { db } from '@/lib/db'
import { versionHistory } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const rows = await db.select().from(versionHistory).orderBy(desc(versionHistory.deployedAt))
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { version, releasePhase, releaseName, commitHashes, summary, changes, deployedAt } = body

  if (!version || !releasePhase || !releaseName || !summary || !deployedAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [row] = await db
    .insert(versionHistory)
    .values({
      version,
      releasePhase,
      releaseName,
      commitHashes: commitHashes ?? [],
      summary,
      changes: changes ?? [],
      deployedAt: new Date(deployedAt),
      createdBy: session.user.id ?? null,
    })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
