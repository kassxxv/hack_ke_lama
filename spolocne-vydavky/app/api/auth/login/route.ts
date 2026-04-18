import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongoose'
import { UserModel } from '@/models/User'

export async function POST(req: NextRequest) {
  const { phone } = await req.json() as { phone: string }
  await connectDB()

  const normalized = phone.trim().replace(/\s+/g, '')
  const pattern = normalized.split('').map(c => c === '+' ? '\\+' : c).join('\\s*')
  const user = await UserModel.findOne({ phone: { $regex: new RegExp('^' + pattern + '$') } }).lean() as { _id: { toString(): string }; name: string; phone: string; avatarColor: string } | null
  if (!user) return NextResponse.json({ error: 'Používateľ nebol nájdený' }, { status: 404 })

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
