import { NextRequest, NextResponse } from 'next/server'

const GEMINI_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`

const PROMPT = `You are a receipt parser. Analyze this receipt image and extract the data as JSON.

Return ONLY valid JSON in this exact shape, nothing else:
{
  "merchant": "string (restaurant/store name)",
  "date": "string (YYYY-MM-DD format, use today if not visible)",
  "total": number,
  "items": [
    { "id": "i1", "name": "string", "price": number (unit price), "qty": number }
  ]
}

Rules:
- price is the unit price of one item
- qty is the quantity (default 1)
- If an item line shows e.g. "2x Pizza 18.00" → price: 9.00, qty: 2
- Omit tax lines, subtotals, tips — only actual purchased items
- If merchant name is not visible use "Neznámy obchod"
- Always return valid JSON, no markdown, no explanation`

export type ScannedReceipt = {
  merchant: string
  date: string
  total: number
  items: { id: string; name: string; price: number; qty: number }[]
}

export async function POST(req: NextRequest) {
  if (!GEMINI_KEY) {
    return NextResponse.json({ error: 'Gemini not configured' }, { status: 500 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mimeType = file.type || 'image/jpeg'

  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inlineData: { mimeType, data: base64 } },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: 'Gemini error', detail: err }, { status: 502 })
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  try {
    const parsed: ScannedReceipt = JSON.parse(text)
    // ensure IDs and sensible defaults
    parsed.items = parsed.items.map((item, i) => ({
      ...item,
      id: `i${i + 1}`,
      qty: item.qty ?? 1,
      price: item.price ?? 0,
    }))
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Failed to parse Gemini response', raw: text }, { status: 502 })
  }
}
