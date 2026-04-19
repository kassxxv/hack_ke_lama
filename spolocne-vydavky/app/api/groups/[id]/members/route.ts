import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { GroupModel } from '@/models/Group'
import { UserModel } from '@/models/User'

type UserDoc = { _id: { toString(): string }; name: string; phone: string; avatarColor: string }

function digits(s: string) { return (s ?? '').replace(/\D/g, '') }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const { phone, role = 'member' } = await req.json() as { phone: string; role?: string }

  if (!phone?.trim()) return NextResponse.json({ error: 'Phone required' }, { status: 400 })

  const inputDigits = digits(phone)
  const users = await UserModel.find().lean() as UserDoc[]
  const match = users.find(u => {
    const stored = digits(u.phone)
    return stored && (stored === inputDigits || stored.endsWith(inputDigits) || inputDigits.endsWith(stored))
  })

  if (!match) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const group = await GroupModel.findById(id)
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  const already = group.members.some((m: { userId: string }) => m.userId === match._id.toString())
  if (already) return NextResponse.json({ error: 'Already a member' }, { status: 409 })

  group.members.push({
    userId: match._id.toString(),
    name: match.name,
    phone: match.phone,
    avatarColor: match.avatarColor,
    role,
    contributed: 0,
  })
  await group.save()

  return NextResponse.json({ ok: true, user: { id: match._id.toString(), name: match.name, phone: match.phone, avatarColor: match.avatarColor } })
}
