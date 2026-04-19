import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { GroupModel, ExpenseModel } from '@/models/Group'

type MemberSub = { userId: string; role: string; contributed?: number }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  await connectDB()
  const { id, userId } = await params
  const { role } = await req.json() as { role?: string }

  if (!role) return NextResponse.json({ error: 'invalid_role' }, { status: 400 })

  const group = await GroupModel.findById(id) as { type: string; members: MemberSub[]; save: () => Promise<unknown> } | null
  if (!group) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const allowed = group.type === 'family' ? ['parent', 'child', 'admin'] : ['admin', 'member']
  if (!allowed.includes(role)) {
    return NextResponse.json({ error: 'invalid_role_for_group' }, { status: 400 })
  }

  const m = group.members.find(m => m.userId === userId)
  if (!m) return NextResponse.json({ error: 'member_not_found' }, { status: 404 })

  m.role = role
  await group.save()
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  await connectDB()
  const { id, userId } = await params

  const group = await GroupModel.findById(id) as { _id: { toString(): string }; members: MemberSub[]; save: () => Promise<unknown> } | null
  if (!group) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Block removal if the member has any unsettled splits
  const expenses = await ExpenseModel.find({ groupId: id }).lean() as { paidBy: string; splits: { userId: string; settled: boolean }[] }[]
  const hasOpenDebt = expenses.some(e =>
    e.splits.some(s => !s.settled && (s.userId === userId || e.paidBy === userId))
  )
  if (hasOpenDebt) return NextResponse.json({ error: 'has_open_debt' }, { status: 409 })

  // Block removal if they still have a contribution balance in a joint pot
  const m = group.members.find(x => x.userId === userId)
  if (m && (m.contributed ?? 0) > 0) {
    return NextResponse.json({ error: 'has_contribution' }, { status: 409 })
  }

  group.members = group.members.filter(x => x.userId !== userId)
  await group.save()
  return NextResponse.json({ ok: true })
}
