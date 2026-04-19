import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { GroupModel } from '@/models/Group'

type SubDoc = {
  _id: { toString(): string }
  name: string
  emoji: string
  monthlyCost: number
  username: string
  password: string
  paidBy: string
  sharedWith: string[]
  nextBillingDate?: string
  createdAt?: Date
}

function serialize(groupId: string, s: SubDoc) {
  return {
    id: s._id.toString(),
    groupId,
    name: s.name,
    emoji: s.emoji ?? '💳',
    monthlyCost: s.monthlyCost ?? 0,
    username: s.username ?? '',
    password: s.password ?? '',
    paidBy: s.paidBy ?? '',
    sharedWith: s.sharedWith ?? [],
    nextBillingDate: s.nextBillingDate ?? '',
    createdAt: s.createdAt ? s.createdAt.toISOString() : undefined,
  }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const group = await GroupModel.findById(id).lean() as { _id: unknown; subscriptions?: SubDoc[] } | null
  if (!group) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const subs = (group.subscriptions ?? []).map(s => serialize(id, s))
  return NextResponse.json(subs)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const body = await req.json() as {
    name: string
    emoji?: string
    monthlyCost?: number
    username?: string
    password?: string
    paidBy?: string
    sharedWith?: string[]
    nextBillingDate?: string
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }
  const group = await GroupModel.findById(id)
  if (!group) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const sub = {
    name: body.name.trim(),
    emoji: body.emoji?.trim() || '💳',
    monthlyCost: Number(body.monthlyCost ?? 0),
    username: body.username ?? '',
    password: body.password ?? '',
    paidBy: body.paidBy ?? '',
    sharedWith: body.sharedWith ?? [],
    nextBillingDate: body.nextBillingDate ?? '',
  }
  group.subscriptions.push(sub)
  await group.save()
  const created = group.subscriptions[group.subscriptions.length - 1] as unknown as SubDoc
  return NextResponse.json(serialize(id, created), { status: 201 })
}
