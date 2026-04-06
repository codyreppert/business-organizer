import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit, rateLimitResponse } from '@/lib/utils/rateLimit'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are an expense receipt parser. Extract structured data from receipt images.
Always respond with a JSON object and nothing else — no markdown, no explanation.

Extract these fields if present:
- category: one of "meals", "lodging", "transport", "supplies", "software", "other"
- amount: number (total amount paid, as a number, no currency symbol)
- date: ISO date string "YYYY-MM-DD"
- merchant: business name
- description: brief description of what was purchased
- businessPurpose: why this was a business expense (infer if obvious, e.g. hotel → lodging)

If a field cannot be determined from the receipt, omit it from the response.
Return only valid JSON.`

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(`ingest:${ip}`, 10, 60_000)) {
    return rateLimitResponse()
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf'
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  if (!supportedTypes.includes(mimeType)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Use JPEG, PNG, GIF, WebP, or PDF.' },
      { status: 400 }
    )
  }

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  const contentBlock =
    mimeType === 'application/pdf'
      ? ({
          type: 'document' as const,
          source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 },
        })
      : ({
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: base64,
          },
        })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          contentBlock,
          { type: 'text', text: 'Extract expense data from this receipt.' },
        ],
      },
    ],
  })

  const text = message.content.find((b) => b.type === 'text')?.text ?? '{}'

  let extracted: Record<string, unknown>
  try {
    extracted = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 })
  }

  // Determine which fields were inferred (all that were returned)
  const inferredFields = Object.keys(extracted).filter((k) => extracted[k] != null)

  return NextResponse.json({ data: { ...extracted, inferredFields } })
}
