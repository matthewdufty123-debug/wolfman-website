import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN is not configured in environment.' }, { status: 500 })
  }

  return NextResponse.json({ token })
}
