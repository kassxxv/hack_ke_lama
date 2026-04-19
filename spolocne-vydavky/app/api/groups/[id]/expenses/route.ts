import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { ExpenseModel } from '@/models/Group'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const expenses = await ExpenseModel.find({ groupId: id }).lean()
  return NextResponse.json(expenses.map(e => ({ ...e, id: e._id.toString() })))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const body = await req.json()
  const expense = await ExpenseModel.create({
    groupId: id,
    amount: body.amount,
    paidBy: body.paidBy,
    splits: body.splits,
    merchant: body.merchant,
    date: body.date,
    isPersonal: body.isPersonal ?? false,
    category: body.category ?? 'Iné',
  })
  return NextResponse.json({ id: expense._id.toString(), ...expense.toObject() }, { status: 201 })
}
