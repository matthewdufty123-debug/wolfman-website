import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { put } from '@vercel/blob'
import { notifyAdminFeedbackSubmitted } from '@/lib/email'

const REPO = 'matthewdufty123-debug/wolfman-website'
const BETA_MILESTONE = 12
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const form = await req.formData()
  const category = form.get('category') as string
  const message = form.get('message') as string
  const anonymous = form.get('anonymous') === 'true'
  const pageUrl = form.get('pageUrl') as string | null
  const screenshot = form.get('screenshot') as File | null
  const topicsRaw = form.get('topics') as string | null
  const topicLabels = topicsRaw
    ? topicsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    : []

  if (!category || !message?.trim()) {
    return NextResponse.json({ error: 'Category and message are required.' }, { status: 400 })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'GitHub token not configured.' }, { status: 500 })
  }

  // Upload screenshot to Vercel Blob if provided
  let screenshotUrl: string | null = null
  if (screenshot && screenshot.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(screenshot.type)) {
      return NextResponse.json({ error: 'Screenshot must be a JPEG, PNG, WebP, or GIF.' }, { status: 400 })
    }
    if (screenshot.size > MAX_SCREENSHOT_SIZE) {
      return NextResponse.json({ error: 'Screenshot must be under 5MB.' }, { status: 400 })
    }
    const ext = screenshot.name.split('.').pop() ?? 'png'
    const filename = `feedback/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    try {
      const blob = await put(filename, screenshot, { access: 'public', contentType: screenshot.type })
      screenshotUrl = blob.url
    } catch (err) {
      console.error('[feedback] Screenshot upload failed:', err)
      return NextResponse.json({ error: 'Screenshot upload failed. Try removing the image and submitting again.' }, { status: 502 })
    }
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

  if (screenshotUrl) {
    bodyLines.push('', `**Screenshot:**`, `![screenshot](${screenshotUrl})`)
  }

  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      body: bodyLines.join('\n'),
      labels: ['beta-feedback', category.toLowerCase(), ...topicLabels],
      milestone: BETA_MILESTONE,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[feedback] GitHub API error:', res.status, text)
    return NextResponse.json({ error: 'Failed to submit feedback.' }, { status: 502 })
  }

  notifyAdminFeedbackSubmitted({
    category,
    messagePreview: message.trim().slice(0, 120),
    anonymous,
    pageUrl,
  })

  return NextResponse.json({ ok: true })
}
