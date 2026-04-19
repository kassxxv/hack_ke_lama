import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongoose'
import { UserModel } from '@/models/User'

type UserDoc = { _id: { toString(): string }; name: string; phone: string; avatarColor: string }

function digits(s: string): string {
  return (s ?? '').replace(/\D/g, '')
}

const DEV_USER = { id: 'dev-local', name: 'Filip', phone: '+421 900 000 001', avatarColor: '#5B5EA6' }
const DEV_DIGITS = digits(DEV_USER.phone)

export async function POST(req: NextRequest) {
  const { phone } = await req.json() as { phone: string }
  const inputDigits = digits(phone)

  if (inputDigits.length < 6) {
    return NextResponse.json({ error: 'Zadaj aspoň 6 číslic' }, { status: 400 })
  }

  // Dev bypass when no DB configured
  if (!process.env.MONGODB_URI) {
    const match = DEV_DIGITS === inputDigits || DEV_DIGITS.endsWith(inputDigits) || inputDigits.endsWith(DEV_DIGITS)
    if (!match) return NextResponse.json({ error: 'Používateľ nebol nájdený' }, { status: 404 })
    const cookieStore = await cookies()
    cookieStore.set('sv_user_id', DEV_USER.id, { httpOnly: true, maxAge: 30 * 24 * 60 * 60, path: '/', sameSite: 'lax' })
    return NextResponse.json({ user: DEV_USER })
  }

  try {
    await connectDB()
    const users = await UserModel.find().lean() as UserDoc[]
    const matches = users.filter(u => {
      const stored = digits(u.phone)
      if (!stored) return false
      return stored === inputDigits || stored.endsWith(inputDigits) || inputDigits.endsWith(stored)
    })

    if (matches.length === 0) return NextResponse.json({ error: 'Používateľ nebol nájdený' }, { status: 404 })
    if (matches.length > 1) return NextResponse.json({ error: 'Viac možných používateľov — zadaj úplné číslo' }, { status: 409 })

    const user = matches[0]
    const cookieStore = await cookies()
    cookieStore.set('sv_user_id', user._id.toString(), {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    })
    return NextResponse.json({
      user: { id: user._id.toString(), name: user.name, phone: user.phone, avatarColor: user.avatarColor },
    })
  } catch {
    return NextResponse.json({ error: 'Chyba databázy' }, { status: 500 })
  }
}
