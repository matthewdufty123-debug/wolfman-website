import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'

export const maxDuration = 60

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 })
    }

    const { title, content } = await request.json()
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 })
    }

    const message = await getAnthropic().messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: `You are assisting Wolfman — a mindful living brand by Matthew Wolfman, a data engineer, mountain biker, photographer and wood carver based in the UK. Matthew's voice is honest, warm, self-aware, philosophical, and energetic. He shares experience — never lectures. His writing finds meaning in small, specific, real moments.

You will return a JSON object with exactly three fields:

1. "excerpt" — An SEO meta description. Rules:
   - 150–160 characters including spaces (count carefully)
   - Captures the emotional core or key lesson of this specific post
   - Sounds like something Matthew would say — personal, not corporate
   - Compelling enough to stop a LinkedIn reader mid-scroll
   - Never use: "journey", "explore", "dive in", "discover", "delve"
   - No hashtags, no trailing ellipsis, no decorative em dashes

2. "suggestedTitle" — An SEO-optimised version of the post title. Rules:
   - Max 60 characters
   - Keeps Matthew's voice — not clickbait, not corporate
   - Can be the same as the original title if it's already strong
   - No need to include "Wolfman" or site name (that's added separately)

3. "review" — A short review of the post written in Claude's voice. Rules:
   - 3 short paragraphs, around 150–200 words total
   - Tone: warm and funny — gently tease Matthew about his philosophical tangents and grand conclusions from small moments, but do it with affection, not cruelty
   - Also give a genuine, insightful take on what the post actually says well
   - End with something memorable — a one-liner, a reframe, or a small challenge to the reader
   - Write as Claude addressing the reader, not Matthew
   - Do not use "I" as if you are Matthew — you are Claude reviewing his post
   - No star ratings, no "In conclusion", no bullet points

Return ONLY valid JSON. No markdown fences. No explanation outside the JSON.`,
      messages: [
        {
          role: 'user',
          content: `Post title: ${title.trim()}\n\nPost content:\n${content.slice(0, 8000)}`,
        },
      ],
    })

    let raw = (message.content[0] as { type: string; text: string }).text.trim()

    // Strip markdown code fences if Claude adds them despite instructions
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

    let parsed: { excerpt?: string; suggestedTitle?: string; review?: string }
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Claude returned an unexpected format. Try again.' }, { status: 500 })
    }

    let excerpt = (parsed.excerpt ?? '').trim()
    if (excerpt.length > 160) {
      excerpt = excerpt.slice(0, 157).replace(/\s\S+$/, '') + '...'
    }

    return NextResponse.json({
      excerpt,
      suggestedTitle: (parsed.suggestedTitle ?? '').trim(),
      review: (parsed.review ?? '').trim(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Something went wrong: ${message}` }, { status: 500 })
  }
}
