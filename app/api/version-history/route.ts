import { db } from '@/lib/db'
import { versionHistory } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

// Public — no auth required. Used by the /dev page.
export async function GET() {
  const rows = await db
    .select({
      id: versionHistory.id,
      version: versionHistory.version,
      releasePhase: versionHistory.releasePhase,
      releaseName: versionHistory.releaseName,
      summary: versionHistory.summary,
      changes: versionHistory.changes,
      deployedAt: versionHistory.deployedAt,
    })
    .from(versionHistory)
    .orderBy(desc(versionHistory.deployedAt))

  return NextResponse.json(rows)
}
