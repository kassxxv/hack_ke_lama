import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { UserModel } from '@/models/User'
import { GroupModel, ExpenseModel } from '@/models/Group'

export async function GET() {
  await connectDB()

  await UserModel.deleteMany({})
  await GroupModel.deleteMany({})
  await ExpenseModel.deleteMany({})

  const filip = await UserModel.create({
    name: 'Filip',
    phone: '+421 900 000 001',
    avatarColor: '#5B5EA6',
  })

  const u2 = { userId: 'u2', name: 'Martin Kováč', phone: '+421 900 333 444', avatarColor: '#9B5EA6', role: 'member' }
  const u3 = { userId: 'u3', name: 'Jana Nováková', phone: '+421 900 555 666', avatarColor: '#5EA6A0', role: 'junior' }
  const u4 = { userId: 'u4', name: 'Tomáš Horváth', phone: '+421 900 777 888', avatarColor: '#A65E5E', role: 'member' }
  const u5 = { userId: 'u5', name: 'Lucia Free', phone: '+421 900 999 000', avatarColor: '#5EA65B', role: 'member' }

  const filipMember = { userId: filip._id.toString(), name: filip.name, phone: filip.phone, avatarColor: filip.avatarColor, role: 'admin' }

  const [rodina, bytak, vylet] = await GroupModel.insertMany([
    {
      name: 'Rodina Novák',
      type: 'family',
      emoji: '🏠',
      isTemporary: false,
      members: [filipMember, u2, u3],
    },
    {
      name: 'Byťák — Hlavná 12',
      type: 'roommates',
      emoji: '🛋️',
      isTemporary: false,
      members: [filipMember, u4, u5],
    },
    {
      name: 'Výlet Tatry 🏔️',
      type: 'peers',
      emoji: '✈️',
      isTemporary: true,
      members: [filipMember, u2, u4, u5],
    },
  ])

  await ExpenseModel.insertMany([
    {
      groupId: bytak._id,
      amount: 480,
      paidBy: filip._id.toString(),
      merchant: 'Nájom — apríl',
      date: '1. apríl 2026',
      isPersonal: false,
      category: 'Bývanie',
      splits: [
        { userId: filip._id.toString(), amount: 160, settled: true },
        { userId: u4.userId, amount: 160, settled: false },
        { userId: u5.userId, amount: 160, settled: false },
      ],
    },
    {
      groupId: bytak._id,
      amount: 120,
      paidBy: filip._id.toString(),
      merchant: 'Internet — O2',
      date: '3. apríl 2026',
      isPersonal: false,
      category: 'Služby',
      splits: [
        { userId: filip._id.toString(), amount: 40, settled: true },
        { userId: u4.userId, amount: 40, settled: false },
        { userId: u5.userId, amount: 40, settled: false },
      ],
    },
    {
      groupId: vylet._id,
      amount: 340,
      paidBy: filip._id.toString(),
      merchant: 'Tatranská Lomnica — skipas',
      date: '16. apríl 2026',
      isPersonal: false,
      category: 'Zábava',
      splits: [
        { userId: filip._id.toString(), amount: 85, settled: true },
        { userId: u2.userId, amount: 85, settled: false },
        { userId: u4.userId, amount: 85, settled: false },
        { userId: u5.userId, amount: 85, settled: false },
      ],
    },
  ])

  return NextResponse.json({
    ok: true,
    seeded: { user: filip.name, groups: [rodina.name, bytak.name, vylet.name] },
  })
}
