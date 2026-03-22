import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isValidUsername, isUsernameAvailable } from '@/lib/username'

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('u')?.trim().toLowerCase()

  if (!username) {
    return NextResponse.json({ available: false, reason: 'empty' })
  }

  if (!isValidUsername(username)) {
    return NextResponse.json({ available: false, reason: 'invalid' })
  }

  const session = await auth()
  const available = await isUsernameAvailable(username, session?.user?.id)

  return NextResponse.json({ available, reason: available ? 'ok' : 'taken' })
}
