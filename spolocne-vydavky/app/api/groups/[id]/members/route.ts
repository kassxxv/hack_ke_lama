import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { GroupModel } from '@/models/Group'
import { UserModel } from '@/models/User'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const group = await GroupModel.findById(id).lean() as { members: { userId: string }[] } | null
  if (!group) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const memberIds = (group.members ?? []).map(m => m.userId)
  const allUsers = await UserModel.find().lean() as { _id: { toString(): string }; name: string; phone: string; avatarColor: string }[]
  return NextResponse.json(allUsers.map(u => ({
    id: u._id.toString(),
    name: u.name,
    phone: u.phone,
    avatarColor: u.avatarColor,
    isMember: memberIds.includes(u._id.toString()),
  })))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const body = await req.json() as { action: 'add' | 'remove' | 'role'; userId: string; role?: string; name?: string; phone?: string; avatarColor?: string }
  const group = await GroupModel.findById(id)
  if (!group) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (body.action === 'add') {
    const already = (group.members ?? []).some((m: { userId: string }) => m.userId === body.userId)
    if (!already) {
      group.members.push({ userId: body.userId, name: body.name ?? '', phone: body.phone ?? '', avatarColor: body.avatarColor ?? '#5B5EA6', role: body.role ?? 'member' })
    }
  } else if (body.action === 'remove') {
    group.members = (group.members ?? []).filter((m: { userId: string }) => m.userId !== body.userId)
  } else if (body.action === 'role') {
    const m = (group.members ?? []).find((m: { userId: string }) => m.userId === body.userId)
    if (m) m.role = body.role ?? 'member'
  }

  await group.save()
  return NextResponse.json({ ok: true })
}
