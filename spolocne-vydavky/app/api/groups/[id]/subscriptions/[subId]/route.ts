import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { GroupModel } from '@/models/Group'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; subId: string }> }) {
  await connectDB()
  const { id, subId } = await params
  const group = await GroupModel.findById(id)
  if (!group) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const before = group.subscriptions.length
  group.subscriptions.pull({ _id: subId })
  if (group.subscriptions.length === before) {
    return NextResponse.json({ error: 'subscription not found' }, { status: 404 })
  }
  await group.save()
  return NextResponse.json({ ok: true })
}
