import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const REPO = 'matthewdufty123-debug/wolfman-website'
const BETA_MILESTONE = 12

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await req.json()
  const { category, message, anonymous, pageUrl } = body as {
    category: string
    message: string
    anonymous: boolean
    pageUrl?: string
  }

  if (!category || !message?.trim()) {
    return NextResponse.json({ error: 'Category and message are required.' }, { status: 400 })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GitHub token not configured.' }, { status: 500 })
  }

  const shortMessage = message.trim().slice(0, 60)
  const title = `[Beta Feedback] ${category}: ${shortMessage}${message.trim().length > 60 ? '…' : ''}`

  const bodyLines = [
    `**Category:** ${category}`,
    '',
    `**Message:**`,
    message.trim(),
    '',
    `**Submitted:** ${new Date().toISOString()}`,
  ]

  if (!anonymous) {
    bodyLines.push(`**User ID:** ${session.user.id}`)
    if (pageUrl) bodyLines.push(`**Page:** ${pageUrl}`)
  }

  const issueBody = bodyLines.join('\n')

  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      body: issueBody,
      labels: ['beta-feedback'],
      milestone: BETA_MILESTONE,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[feedback] GitHub API error:', res.status, text)
    return NextResponse.json({ error: 'Failed to submit feedback.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
