import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { GroupModel } from '@/models/Group'

type Ctx = { params: Promise<{ id: string; userId: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  await connectDB()
  const { id, userId } = await params
  const { role } = await req.json() as { role: string }

  const group = await GroupModel.findById(id)
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  const member = group.members.find((m: { userId: string }) => m.userId === userId)
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  member.role = role
  group.markModified('members')
  await group.save()
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  await connectDB()
  const { id, userId } = await params

  const group = await GroupModel.findById(id)
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  const exists = group.members.some((m: { userId: string }) => m.userId === userId)
  if (!exists) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  group.members.pull({ userId })
  await group.save()
  return NextResponse.json({ ok: true })
}
