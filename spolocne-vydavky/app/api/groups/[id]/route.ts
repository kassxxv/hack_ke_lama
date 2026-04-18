import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { GroupModel, ExpenseModel } from '@/models/Group'

function calcBalances(
  members: { userId: string; name: string; phone: string; avatarColor: string; role: string }[],
  expenses: { paidBy: string; amount: number; splits: { userId: string; amount: number; settled: boolean }[] }[]
) {
  const map: Record<string, number> = {}
  members.forEach(m => { map[m.userId] = 0 })
  expenses.forEach(e => {
    e.splits.forEach(s => {
      if (!s.settled) {
        if (s.userId === e.paidBy) {
          map[e.paidBy] = (map[e.paidBy] ?? 0) + (e.amount - s.amount)
        } else {
          map[s.userId] = (map[s.userId] ?? 0) - s.amount
          map[e.paidBy] = (map[e.paidBy] ?? 0) + s.amount
        }
      }
    })
  })
  return map
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const group = await GroupModel.findById(id).lean() as { _id: { toString(): string }; name: string; type: string; emoji: string; isTemporary: boolean; members: { userId: string; name: string; phone: string; avatarColor: string; role: string }[] } | null
  if (!group) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const rawExpenses = await ExpenseModel.find({ groupId: id }).lean() as { _id: { toString(): string }; groupId: unknown; amount: number; paidBy: string; splits: { userId: string; amount: number; settled: boolean }[]; merchant: string; date: string; isPersonal: boolean; category: string }[]
  const balances = calcBalances(group.members, rawExpenses)

  const result = {
    id: group._id.toString(),
    name: group.name,
    type: group.type,
    emoji: group.emoji,
    isTemporary: group.isTemporary,
    members: group.members.map(m => ({
      user: { id: m.userId, name: m.name, phone: m.phone, avatarColor: m.avatarColor },
      role: m.role,
      balance: balances[m.userId] ?? 0,
    })),
    totalOwed: Object.values(balances).filter(b => b > 0).reduce((s, b) => s + b, 0),
  }

  const expenses = rawExpenses.map(e => ({
    id: e._id.toString(),
    groupId: id,
    amount: e.amount,
    paidBy: e.paidBy,
    splits: e.splits,
    merchant: e.merchant,
    date: e.date,
    isPersonal: e.isPersonal,
    category: e.category,
  }))

  return NextResponse.json({ group: result, expenses })
}
