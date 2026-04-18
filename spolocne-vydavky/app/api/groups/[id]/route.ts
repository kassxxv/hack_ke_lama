import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { GroupModel, ExpenseModel } from '@/models/Group'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const group = await GroupModel.findById(id).lean()
  if (!group) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const expenses = await ExpenseModel.find({ groupId: id }).lean()
  return NextResponse.json({ group, expenses })
}
