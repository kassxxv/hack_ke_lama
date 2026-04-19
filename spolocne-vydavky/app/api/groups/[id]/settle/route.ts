import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { ExpenseModel } from '@/models/Group'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const { fromId, toId } = await req.json()

  const expenses = await ExpenseModel.find({ groupId: id, paidBy: toId })
  await Promise.all(expenses.map(async e => {
    let changed = false
    e.splits = e.splits.map((s: { userId: string; amount: number; settled: boolean }) => {
      if (s.userId === fromId && !s.settled) { s.settled = true; changed = true }
      return s
    })
    if (changed) await e.save()
  }))

  return NextResponse.json({ ok: true })
}
