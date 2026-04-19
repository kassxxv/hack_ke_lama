import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { GroupModel, ExpenseModel } from '@/models/Group'

function calcBalances(members: { userId: string; name: string; phone: string; avatarColor: string; role: string }[], expenses: { paidBy: string; amount: number; splits: { userId: string; amount: number; settled: boolean }[] }[]) {
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

export async function GET() {
  try {
    await connectDB()
    const groups = await GroupModel.find().lean()
    const result = await Promise.all(groups.map(async (g) => {
      const expenses = await ExpenseModel.find({ groupId: g._id }).lean()
      const balances = calcBalances(g.members as Parameters<typeof calcBalances>[0], expenses as Parameters<typeof calcBalances>[1])
      return {
        id: g._id.toString(),
        name: g.name,
        type: g.type,
        emoji: g.emoji,
        isTemporary: g.isTemporary,
        potBalance: (g as typeof g & { potBalance?: number }).potBalance ?? 0,
        potTarget: (g as typeof g & { potTarget?: number }).potTarget ?? null,
        members: (g.members as { userId: string; name: string; phone: string; avatarColor: string; role: string; contributed?: number }[]).map(m => ({
          user: { id: m.userId, name: m.name, phone: m.phone, avatarColor: m.avatarColor },
          role: m.role,
          balance: balances[m.userId] ?? 0,
          contributed: m.contributed ?? 0,
        })),
        totalOwed: Object.values(balances).filter(b => b > 0).reduce((s, b) => s + b, 0),
      }
    }))
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /api/groups]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await connectDB()
  const body = await req.json()
  const group = await GroupModel.create({
    name: body.name,
    type: body.type,
    emoji: body.emoji ?? '👥',
    isTemporary: body.isTemporary ?? false,
    members: body.members ?? [],
  })
  return NextResponse.json({ id: group._id.toString(), ...group.toObject() }, { status: 201 })
}
