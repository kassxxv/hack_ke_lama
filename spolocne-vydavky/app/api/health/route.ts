import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'

export async function GET() {
  const uri = process.env.MONGODB_URI
  if (!uri) return NextResponse.json({ ok: false, error: 'MONGODB_URI not set' })

  try {
    await connectDB()
    return NextResponse.json({ ok: true, uri: uri.slice(0, 40) + '…' })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), uri: uri.slice(0, 40) + '…' })
  }
}
