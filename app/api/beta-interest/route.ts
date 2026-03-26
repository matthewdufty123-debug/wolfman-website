import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { betaInterest } from '@/lib/db/schema'
import { sendBetaInterestConfirmation, sendAdminBetaInterestAlert } from '@/lib/email'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)

  const name  = typeof body?.name  === 'string' ? body.name.trim()               : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const source = typeof body?.source === 'string' ? body.source : 'beta-page'

  if (!name || !email || !email.includes('@')) {
    return NextResponse.json(
      { error: 'Name and a valid email are required.' },
      { status: 400 }
    )
  }

  const result = await db
    .insert(betaInterest)
    .values({ email, name, source })
    .onConflictDoNothing()
    .returning({ id: betaInterest.id })

  const isDuplicate = result.length === 0

  if (!isDuplicate) {
    // Fire-and-forget — email failures must never block the user's response
    Promise.all([
      sendBetaInterestConfirmation(email, name),
      sendAdminBetaInterestAlert(email, name),
    ]).catch(err => console.error('[beta-interest] email error:', err))
  }

  return NextResponse.json({ ok: true, duplicate: isDuplicate })
}
