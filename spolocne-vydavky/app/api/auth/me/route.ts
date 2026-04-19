import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongoose'
import { UserModel } from '@/models/User'

export async function GET() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('sv_user_id')?.value
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  await connectDB()
  const user = await UserModel.findById(userId).lean() as { _id: { toString(): string }; name: string; phone: string; avatarColor: string } | null
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ id: user._id.toString(), name: user.name, phone: user.phone, avatarColor: user.avatarColor })
}
