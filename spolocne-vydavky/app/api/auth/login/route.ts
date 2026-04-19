import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongoose'
import { UserModel } from '@/models/User'

type UserDoc = { _id: { toString(): string }; name: string; phone: string; avatarColor: string }

function digits(s: string): string {
  return (s ?? '').replace(/\D/g, '')
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json() as { phone: string }
  await connectDB()

  const inputDigits = digits(phone)
  if (inputDigits.length < 6) {
    return NextResponse.json({ error: 'Zadaj aspoň 6 číslic' }, { status: 400 })
  }

  const users = await UserModel.find().lean() as UserDoc[]
  const matches = users.filter(u => {
    const stored = digits(u.phone)
    if (!stored) return false
    return stored === inputDigits || stored.endsWith(inputDigits) || inputDigits.endsWith(stored)
  })

  if (matches.length === 0) {
    return NextResponse.json({ error: 'Používateľ nebol nájdený' }, { status: 404 })
  }
  if (matches.length > 1) {
    return NextResponse.json({ error: 'Viac možných používateľov — zadaj úplné číslo' }, { status: 409 })
  }

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
}
