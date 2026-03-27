import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { betaInterest } from '@/lib/db/schema'
import { sendBetaInterestConfirmation } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email, name, source = 'beta-page' } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const [row] = await db
      .insert(betaInterest)
      .values({ email: email.toLowerCase().trim(), name: name ?? null, source })
      .onConflictDoNothing()
      .returning({ id: betaInterest.id })

    // row is undefined if the email already existed — still return success to avoid enumeration
    if (row) {
      // Fire confirmation email — non-fatal if it fails
      try {
        await sendBetaInterestConfirmation({ to: email, name: name ?? null })
      } catch (emailErr) {
        console.error('[beta-interest] confirmation email failed:', emailErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[beta-interest] POST error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
