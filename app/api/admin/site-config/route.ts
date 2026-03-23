import { auth } from '@/auth'
import { db } from '@/lib/db'
import { siteConfig } from '@/lib/db/schema'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const [row] = await db.select().from(siteConfig).limit(1)
  return NextResponse.json(row ?? null)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { status, userCap, statusMessage, betaOpensAt } = body

  const validStatuses = ['closed_alpha', 'closed_beta', 'open_beta', 'live']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  await db
    .insert(siteConfig)
    .values({
      id: 1,
      status,
      userCap: userCap ?? null,
      statusMessage: statusMessage || null,
      betaOpensAt: betaOpensAt ? new Date(betaOpensAt) : null,
      updatedAt: new Date(),
      updatedBy: session.user.id ?? null,
    })
    .onConflictDoUpdate({
      target: siteConfig.id,
      set: {
        status,
        userCap: userCap ?? null,
        statusMessage: statusMessage || null,
        betaOpensAt: betaOpensAt ? new Date(betaOpensAt) : null,
        updatedAt: new Date(),
        updatedBy: session.user.id ?? null,
      },
    })

  return NextResponse.json({ ok: true })
}
