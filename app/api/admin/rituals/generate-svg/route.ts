import { auth } from '@/auth'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const maxDuration = 30

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

const SYSTEM_PROMPT = `You are an SVG icon designer for a mindful morning journalling app called Wolfman.

Design language:
- ViewBox is 18×18. All coordinates must stay within this space.
- Use stroke-based line art: stroke-width="1.5", stroke-linecap="round".
- Default stroke and fill values are inherited from the parent <svg> tag — do NOT set stroke="currentColor" or fill="none" on individual elements unless overriding.
- Keep it minimal: aim for 2–5 SVG elements maximum (path, line, circle, ellipse, rect).
- The icon must be recognisable at 18×18 pixels and also look good at 32×32.
- Use simple geometric shapes. No text. No gradients. No filters.
- If the concept is best represented as a solid filled shape (like a paw print), use only ellipse/circle elements with NO stroke attributes — the parent <svg> will set fill.

CRITICAL: Return ONLY the inner SVG elements — NO wrapping <svg> tag, NO XML declarations, NO comments, NO markdown code fences. Just the raw SVG elements (path, line, circle, ellipse, rect).

Example output for a "sun" icon:
<circle cx="9" cy="9" r="3"/><line x1="9" y1="1.5" x2="9" y2="3.5"/><line x1="9" y1="14.5" x2="9" y2="16.5"/><line x1="1.5" y1="9" x2="3.5" y2="9"/><line x1="14.5" y1="9" x2="16.5" y2="9"/>`

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { label, description, category } = await req.json()

  if (!label?.trim()) {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 })
  }

  const client = new Anthropic()

  const userMessage = [
    `Design an 18×18 SVG icon for a morning ritual called "${label}".`,
    description ? `Description: ${description}` : '',
    category ? `Category: ${category}` : '',
    'Return only the inner SVG elements.',
  ].filter(Boolean).join('\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim()

  // Strip any accidental wrapping (markdown fences, <svg> tags)
  const svgContent = text
    .replace(/```[a-z]*\n?/g, '')
    .replace(/```/g, '')
    .replace(/<\/?svg[^>]*>/g, '')
    .trim()

  return NextResponse.json({ svgContent })
}
