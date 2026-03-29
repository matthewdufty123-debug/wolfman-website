import { NextResponse } from 'next/server'

// Evening reflection data is now stored directly on the posts table.
// This endpoint was deprecated in the journal page redesign (March 2026).
// Update evening reflection via PUT /api/posts/[id] with { eveningReflection, feelAboutToday }.

export async function GET() {
  return NextResponse.json({ error: 'This endpoint has been removed. Use PUT /api/posts/[id] instead.' }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ error: 'This endpoint has been removed. Use PUT /api/posts/[id] instead.' }, { status: 410 })
}
