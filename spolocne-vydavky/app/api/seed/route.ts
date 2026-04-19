import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { UserModel } from '@/models/User'
import { GroupModel, ExpenseModel } from '@/models/Group'

export async function GET() {
  await connectDB()

  await UserModel.deleteMany({})
  await GroupModel.deleteMany({})
  await ExpenseModel.deleteMany({})

  const [filip, archie, lana1, fox, lana2] = await UserModel.insertMany([
    { name: 'Filip',  phone: '+421 900 000 001', avatarColor: '#5B5EA6' },
    { name: 'Archie', phone: '+421 900 333 444', avatarColor: '#9B5EA6' },
    { name: 'Lana',   phone: '+421 900 555 666', avatarColor: '#5EA6A0' },
    { name: 'Fox',    phone: '+421 900 777 888', avatarColor: '#A65E5E' },
    { name: 'Lana',   phone: '+421 900 999 000', avatarColor: '#5EA6A0' },
  ])

  function member(u: typeof filip, role: string, contributed = 0) {
    return { userId: u._id.toString(), name: u.name, phone: u.phone, avatarColor: u.avatarColor, role, contributed }
  }

  const u2 = { userId: archie._id.toString(), name: archie.name, phone: archie.phone, avatarColor: archie.avatarColor, role: 'parent' }
  const u3 = { userId: lana1._id.toString(),  name: lana1.name,  phone: lana1.phone,  avatarColor: lana1.avatarColor,  role: 'child'  }
  const u4 = { userId: fox._id.toString(),    name: fox.name,    phone: fox.phone,    avatarColor: fox.avatarColor,    role: 'child'  }
  const u5 = { userId: lana2._id.toString(),  name: lana2.name,  phone: lana2.phone,  avatarColor: lana2.avatarColor,  role: 'member' }

  const filipMember = member(filip, 'parent')

  const [rodina, bytak, vylet] = await GroupModel.insertMany([
    {
      name: 'Rodina Novák',
      type: 'family',
      emoji: '🏠',
      isTemporary: false,
      potBalance: 340.50,
      potTarget: 500,
      members: [
        member(filip, 'parent', 200),
        { ...u2, contributed: 200 },
        { ...u3, contributed: 0 },
        { ...u4, contributed: 0 },
      ],
      contributions: [
        { userId: filip._id.toString(), amount: 200, note: 'Apríl — môj príspevok', date: '2026-04-01' },
        { userId: archie._id.toString(), amount: 200, note: 'Apríl — Archie',       date: '2026-04-02' },
      ],
      subscriptions: [
        {
          name: 'Netflix Premium',
          emoji: '🎬',
          monthlyCost: 17.99,
          username: 'novak.family@gmail.com',
          password: 'N3tfl1x!Rodina2026',
          paidBy: filipMember.userId,
          sharedWith: [filipMember.userId, u2.userId, u3.userId, u4.userId],
          nextBillingDate: '2026-05-02',
        },
        {
          name: 'Spotify Family',
          emoji: '🎵',
          monthlyCost: 17.99,
          username: 'novak.family',
          password: 'Sp0t!fy-Family#26',
          paidBy: u2.userId,
          sharedWith: [filipMember.userId, u2.userId, u3.userId, u4.userId],
          nextBillingDate: '2026-05-10',
        },
        {
          name: 'iCloud+ 2TB',
          emoji: '☁️',
          monthlyCost: 9.99,
          username: 'rodina.novak@icloud.com',
          password: 'iCl0ud-Rodina!',
          paidBy: filipMember.userId,
          sharedWith: [filipMember.userId, u2.userId, u3.userId, u4.userId],
          nextBillingDate: '2026-05-05',
        },
      ],
    },
    {
      name: 'Priatelia 🍕',
      type: 'peers',
      emoji: '👫',
      isTemporary: false,
      members: [filipMember, u4, u5],
      subscriptions: [
        {
          name: 'Claude Pro',
          emoji: '🤖',
          monthlyCost: 20.00,
          username: 'filip.shared@proton.me',
          password: 'Cl4ude-Shared!2026',
          paidBy: filipMember.userId,
          sharedWith: [filipMember.userId, u4.userId, u5.userId],
          nextBillingDate: '2026-05-08',
        },
        {
          name: 'Gemini Advanced',
          emoji: '✨',
          monthlyCost: 21.99,
          username: 'trojka.ai@gmail.com',
          password: 'G3m!ni-Advanced',
          paidBy: u4.userId,
          sharedWith: [filipMember.userId, u4.userId, u5.userId],
          nextBillingDate: '2026-05-14',
        },
      ],
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
    // ── Priatelia (bytak) ──────────────────────────────────────────────
    {
      groupId: bytak._id, amount: 75, paidBy: filip._id.toString(),
      merchant: 'Pizza Hut', date: '2026-04-05', isPersonal: false, category: 'food',
      splits: [
        { userId: filip._id.toString(), amount: 25, settled: true },
        { userId: u4.userId, amount: 25, settled: false },
        { userId: u5.userId, amount: 25, settled: false },
      ],
    },
    {
      groupId: bytak._id, amount: 60, paidBy: filip._id.toString(),
      merchant: 'Koliba — večera', date: '2026-04-12', isPersonal: false, category: 'food',
      splits: [
        { userId: filip._id.toString(), amount: 20, settled: true },
        { userId: u4.userId, amount: 20, settled: false },
        { userId: u5.userId, amount: 20, settled: false },
      ],
    },
    {
      groupId: bytak._id, amount: 48, paidBy: u5.userId,
      merchant: 'Escape Room Košice', date: '2026-04-10', isPersonal: false, category: 'entertainment',
      splits: [
        { userId: filip._id.toString(), amount: 16, settled: false },
        { userId: u4.userId, amount: 16, settled: false },
        { userId: u5.userId, amount: 16, settled: true },
      ],
    },
    {
      groupId: bytak._id, amount: 34.50, paidBy: filip._id.toString(),
      merchant: 'Billa — večerný nákup', date: '2026-04-08', isPersonal: false, category: 'groceries',
      splits: [
        { userId: filip._id.toString(), amount: 11.50, settled: true },
        { userId: u4.userId, amount: 11.50, settled: false },
        { userId: u5.userId, amount: 11.50, settled: false },
      ],
    },
    {
      groupId: bytak._id, amount: 28, paidBy: u4.userId,
      merchant: 'Uber — nočná jazda', date: '2026-04-06', isPersonal: false, category: 'transport',
      splits: [
        { userId: filip._id.toString(), amount: 9.33, settled: false },
        { userId: u4.userId, amount: 9.33, settled: true },
        { userId: u5.userId, amount: 9.34, settled: false },
      ],
    },
    {
      groupId: bytak._id, amount: 22.80, paidBy: filip._id.toString(),
      merchant: 'Spotify Family', date: '2026-04-01', isPersonal: false, category: 'entertainment',
      splits: [
        { userId: filip._id.toString(), amount: 7.60, settled: true },
        { userId: u4.userId, amount: 7.60, settled: true },
        { userId: u5.userId, amount: 7.60, settled: true },
      ],
    },

    // ── Rodina ────────────────────────────────────────────────────────
    {
      groupId: rodina._id, amount: 230, paidBy: filip._id.toString(),
      merchant: 'Lidl — týždenný nákup', date: '2026-04-05', isPersonal: false, category: 'groceries',
      splits: [
        { userId: filip._id.toString(), amount: 76.66, settled: true },
        { userId: u2.userId, amount: 76.67, settled: true },
        { userId: u3.userId, amount: 76.67, settled: true },
      ],
    },
    {
      groupId: rodina._id, amount: 55, paidBy: u2.userId,
      merchant: 'Elektrárne — záloha', date: '2026-04-08', isPersonal: false, category: 'other',
      splits: [
        { userId: filip._id.toString(), amount: 18.33, settled: true },
        { userId: u2.userId, amount: 18.33, settled: true },
        { userId: u3.userId, amount: 18.34, settled: true },
      ],
    },
    {
      groupId: rodina._id, amount: 145, paidBy: filip._id.toString(),
      merchant: 'Tesco — veľký nákup', date: '2026-04-12', isPersonal: false, category: 'groceries',
      splits: [
        { userId: filip._id.toString(), amount: 48.33, settled: true },
        { userId: u2.userId, amount: 48.33, settled: true },
        { userId: u3.userId, amount: 48.34, settled: true },
      ],
    },
    {
      groupId: rodina._id, amount: 89, paidBy: u2.userId,
      merchant: 'Orange — rodinný tarif', date: '2026-04-01', isPersonal: false, category: 'other',
      splits: [
        { userId: filip._id.toString(), amount: 29.66, settled: true },
        { userId: u2.userId, amount: 29.67, settled: true },
        { userId: u3.userId, amount: 29.67, settled: true },
      ],
    },
    {
      groupId: rodina._id, amount: 420, paidBy: filip._id.toString(),
      merchant: 'Nájom apríl', date: '2026-04-01', isPersonal: false, category: 'housing',
      splits: [
        { userId: filip._id.toString(), amount: 140, settled: true },
        { userId: u2.userId, amount: 140, settled: true },
        { userId: u3.userId, amount: 140, settled: true },
      ],
    },
    {
      groupId: rodina._id, amount: 67.50, paidBy: u3.userId,
      merchant: 'Kaufland — víkend', date: '2026-04-19', isPersonal: false, category: 'groceries',
      splits: [
        { userId: filip._id.toString(), amount: 22.50, settled: false },
        { userId: u2.userId, amount: 22.50, settled: false },
        { userId: u3.userId, amount: 22.50, settled: true },
      ],
    },

    // ── Výlet Tatry ───────────────────────────────────────────────────
    {
      groupId: vylet._id, amount: 340, paidBy: filip._id.toString(),
      merchant: 'Tatranská Lomnica — skipas', date: '2026-04-16', isPersonal: false, category: 'entertainment',
      splits: [
        { userId: filip._id.toString(), amount: 85, settled: true },
        { userId: u2.userId, amount: 85, settled: false },
        { userId: u4.userId, amount: 85, settled: false },
        { userId: u5.userId, amount: 85, settled: false },
      ],
    },
    {
      groupId: vylet._id, amount: 180, paidBy: u2.userId,
      merchant: 'Koliba Kamzík — večera', date: '2026-04-16', isPersonal: false, category: 'food',
      splits: [
        { userId: filip._id.toString(), amount: 45, settled: false },
        { userId: u2.userId, amount: 45, settled: true },
        { userId: u4.userId, amount: 45, settled: false },
        { userId: u5.userId, amount: 45, settled: false },
      ],
    },
    {
      groupId: vylet._id, amount: 96, paidBy: u4.userId,
      merchant: 'Benzínka OMV — palivo', date: '2026-04-15', isPersonal: false, category: 'transport',
      splits: [
        { userId: filip._id.toString(), amount: 24, settled: false },
        { userId: u2.userId, amount: 24, settled: false },
        { userId: u4.userId, amount: 24, settled: true },
        { userId: u5.userId, amount: 24, settled: false },
      ],
    },
    {
      groupId: vylet._id, amount: 220, paidBy: filip._id.toString(),
      merchant: 'Penzión Štart — ubytovanie', date: '2026-04-15', isPersonal: false, category: 'housing',
      splits: [
        { userId: filip._id.toString(), amount: 55, settled: true },
        { userId: u2.userId, amount: 55, settled: false },
        { userId: u4.userId, amount: 55, settled: false },
        { userId: u5.userId, amount: 55, settled: false },
      ],
    },
    {
      groupId: vylet._id, amount: 64, paidBy: u5.userId,
      merchant: 'Horský bufet — obed', date: '2026-04-16', isPersonal: false, category: 'food',
      splits: [
        { userId: filip._id.toString(), amount: 16, settled: false },
        { userId: u2.userId, amount: 16, settled: false },
        { userId: u4.userId, amount: 16, settled: false },
        { userId: u5.userId, amount: 16, settled: true },
      ],
    },
    {
      groupId: vylet._id, amount: 42, paidBy: u2.userId,
      merchant: 'Vlak Košice–Poprad', date: '2026-04-15', isPersonal: false, category: 'transport',
      splits: [
        { userId: filip._id.toString(), amount: 10.50, settled: true },
        { userId: u2.userId, amount: 10.50, settled: true },
        { userId: u4.userId, amount: 10.50, settled: false },
        { userId: u5.userId, amount: 10.50, settled: false },
      ],
    },
    {
      groupId: vylet._id, amount: 55, paidBy: filip._id.toString(),
      merchant: 'Aquapark Tatralandia', date: '2026-04-17', isPersonal: false, category: 'entertainment',
      splits: [
        { userId: filip._id.toString(), amount: 13.75, settled: true },
        { userId: u2.userId, amount: 13.75, settled: false },
        { userId: u4.userId, amount: 13.75, settled: false },
        { userId: u5.userId, amount: 13.75, settled: false },
      ],
    },
  ])

  return NextResponse.json({
    ok: true,
    seeded: { user: filip.name, groups: [rodina.name, bytak.name, vylet.name] }, // bytak = Priatelia now
  })
}
