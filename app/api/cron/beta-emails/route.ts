import { NextRequest, NextResponse } from 'next/server'

// Beta email broadcasts are paused — no public launch date set yet.
// Re-enable the broadcast logic below when ready to open registration.

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ ok: true, message: 'Beta emails paused — no launch date set' })
}
