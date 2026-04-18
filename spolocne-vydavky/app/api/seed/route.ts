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

  const u2 = { userId: 'u2', name: 'Martin Kováč',   phone: '+421 900 333 444', avatarColor: '#9B5EA6', role: 'member' }
  const u3 = { userId: 'u3', name: 'Jana Nováková',  phone: '+421 900 555 666', avatarColor: '#5EA6A0', role: 'junior' }
  const u4 = { userId: 'u4', name: 'Tomáš Horváth',  phone: '+421 900 777 888', avatarColor: '#A65E5E', role: 'member' }
  const u5 = { userId: 'u5', name: 'Lucia Free',     phone: '+421 900 999 000', avatarColor: '#5EA65B', role: 'member' }

  const filipMember = {
    userId: filip._id.toString(),
    name: filip.name,
    phone: filip.phone,
    avatarColor: filip.avatarColor,
    role: 'admin',
  }

  const [rodina, bytak, vylet] = await GroupModel.insertMany([
    {
      name: 'Rodina Novák',
      type: 'family',
      emoji: '🏠',
      isTemporary: false,
      potBalance: 340.50,
      potTarget: 500,
      members: [
        { ...filipMember, contributed: 200 },
        { ...u2, contributed: 200 },
        { ...u3, contributed: 100 },
      ],
      contributions: [
        { userId: filipMember.userId, amount: 200, note: 'Apríl — môj príspevok', date: '2026-04-01' },
        { userId: u2.userId,          amount: 200, note: 'Apríl — Martin',        date: '2026-04-02' },
        { userId: u3.userId,          amount: 100, note: 'Apríl — Jana',          date: '2026-04-03' },
      ],
    },
    {
      name: 'Priatelia 🍕',
      type: 'peers',
      emoji: '👫',
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
    // Priatelia expenses (friends — who owes who)
    {
      groupId: bytak._id,
      amount: 60,
      paidBy: filip._id.toString(),
      merchant: 'Pizza Hut',
      date: '2026-04-05',
      isPersonal: false,
      category: 'food',
      splits: [
        { userId: filip._id.toString(), amount: 20, settled: true },
        { userId: u4.userId, amount: 20, settled: false },
        { userId: u5.userId, amount: 20, settled: false },
      ],
    },
    {
      groupId: bytak._id,
      amount: 45,
      paidBy: u4.userId,
      merchant: 'Cinema City',
      date: '2026-04-10',
      isPersonal: false,
      category: 'entertainment',
      splits: [
        { userId: filip._id.toString(), amount: 15, settled: false },
        { userId: u4.userId, amount: 15, settled: true },
        { userId: u5.userId, amount: 15, settled: false },
      ],
    },
    {
      groupId: bytak._id,
      amount: 36,
      paidBy: u5.userId,
      merchant: 'Uber — taxík',
      date: '2026-04-12',
      isPersonal: false,
      category: 'transport',
      splits: [
        { userId: filip._id.toString(), amount: 12, settled: false },
        { userId: u4.userId, amount: 12, settled: false },
        { userId: u5.userId, amount: 12, settled: true },
      ],
    },
    // Rodina expenses (joint)
    {
      groupId: rodina._id,
      amount: 230,
      paidBy: filip._id.toString(),
      merchant: 'Lidl — týždenný nákup',
      date: '2026-04-05',
      isPersonal: false,
      category: 'groceries',
      splits: [
        { userId: filip._id.toString(), amount: 76.66, settled: true },
        { userId: u2.userId, amount: 76.67, settled: true },
        { userId: u3.userId, amount: 76.67, settled: true },
      ],
    },
    {
      groupId: rodina._id,
      amount: 55,
      paidBy: u2.userId,
      merchant: 'Elektrárne — záloha',
      date: '2026-04-08',
      isPersonal: false,
      category: 'other',
      splits: [
        { userId: filip._id.toString(), amount: 18.33, settled: true },
        { userId: u2.userId, amount: 18.33, settled: true },
        { userId: u3.userId, amount: 18.34, settled: true },
      ],
    },
    // Výlet expenses (peers)
    {
      groupId: vylet._id,
      amount: 340,
      paidBy: filip._id.toString(),
      merchant: 'Tatranská Lomnica — skipas',
      date: '2026-04-16',
      isPersonal: false,
      category: 'entertainment',
      splits: [
        { userId: filip._id.toString(), amount: 85, settled: true },
        { userId: u2.userId, amount: 85, settled: false },
        { userId: u4.userId, amount: 85, settled: false },
        { userId: u5.userId, amount: 85, settled: false },
      ],
    },
    {
      groupId: vylet._id,
      amount: 180,
      paidBy: u2.userId,
      merchant: 'Koliba Kamzík — večera',
      date: '2026-04-16',
      isPersonal: false,
      category: 'food',
      splits: [
        { userId: filip._id.toString(), amount: 45, settled: false },
        { userId: u2.userId, amount: 45, settled: true },
        { userId: u4.userId, amount: 45, settled: false },
        { userId: u5.userId, amount: 45, settled: false },
      ],
    },
    {
      groupId: vylet._id,
      amount: 96,
      paidBy: u4.userId,
      merchant: 'Benzínka — palivo',
      date: '2026-04-15',
      isPersonal: false,
      category: 'transport',
      splits: [
        { userId: filip._id.toString(), amount: 24, settled: false },
        { userId: u2.userId, amount: 24, settled: false },
        { userId: u4.userId, amount: 24, settled: true },
        { userId: u5.userId, amount: 24, settled: false },
      ],
    },
  ])

  return NextResponse.json({
    ok: true,
    seeded: { user: filip.name, groups: [rodina.name, bytak.name, vylet.name] }, // bytak = Priatelia now
  })
}
