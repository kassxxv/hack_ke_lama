import type { Group, Transaction, Expense } from '@/types'

export const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Rodina Novák',
    type: 'family',
    emoji: '🏠',
    totalOwed: 0,
    isTemporary: false,
    members: [
      { user: { id: 'u1', name: 'Marek Novák', phone: '+421 900 111 222', avatarColor: '#5B5EA6' }, role: 'admin', balance: 45.50 },
      { user: { id: 'u2', name: 'Jana Nováková', phone: '+421 900 333 444', avatarColor: '#9B5EA6' }, role: 'admin', balance: -45.50 },
      { user: { id: 'u3', name: 'Lukáš Novák', phone: '+421 900 555 666', avatarColor: '#5EA6A0' }, role: 'junior', balance: 0 },
    ],
  },
  {
    id: 'g2',
    name: 'Byťák — Hlavná 12',
    type: 'roommates',
    emoji: '🛋️',
    totalOwed: 120.00,
    isTemporary: false,
    members: [
      { user: { id: 'u1', name: 'Marek Novák', phone: '+421 900 111 222', avatarColor: '#5B5EA6' }, role: 'admin', balance: 120.00 },
      { user: { id: 'u4', name: 'Tomáš Horváth', phone: '+421 900 777 888', avatarColor: '#A65E5E' }, role: 'member', balance: -80.00 },
      { user: { id: 'u5', name: 'Peter Kováč', phone: '+421 900 999 000', avatarColor: '#5EA65B' }, role: 'member', balance: -40.00 },
    ],
  },
  {
    id: 'g3',
    name: 'Výlet Tatry 🏔️',
    type: 'peers',
    emoji: '✈️',
    totalOwed: 340.00,
    isTemporary: true,
    members: [
      { user: { id: 'u1', name: 'Marek Novák', phone: '+421 900 111 222', avatarColor: '#5B5EA6' }, role: 'admin', balance: 340.00 },
      { user: { id: 'u2', name: 'Jana Nováková', phone: '+421 900 333 444', avatarColor: '#9B5EA6' }, role: 'member', balance: -120.00 },
      { user: { id: 'u4', name: 'Tomáš Horváth', phone: '+421 900 777 888', avatarColor: '#A65E5E' }, role: 'member', balance: -100.00 },
      { user: { id: 'u5', name: 'Peter Kováč', phone: '+421 900 999 000', avatarColor: '#5EA65B' }, role: 'member', balance: -120.00 },
    ],
  },
]

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', merchant: 'KAUFLAND Poprad', amount: -12.33, date: '18. apríl 2026', category: 'Potraviny', canSplit: true },
  { id: 't2', merchant: 'Shell — Ružomberok', amount: -48.00, date: '17. apríl 2026', category: 'Doprava', canSplit: true },
  { id: 't3', merchant: 'Tatranská Lomnica', amount: -89.00, date: '16. apríl 2026', category: 'Zábava', canSplit: true },
  { id: 't4', merchant: 'Lidl Košice', amount: -23.45, date: '15. apríl 2026', category: 'Potraviny', canSplit: true },
  { id: 't5', merchant: 'Netflix', amount: -15.99, date: '1. apríl 2026', category: 'Predplatné', canSplit: true },
]

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'e1', groupId: 'g2', amount: 480.00, paidBy: 'u1', merchant: 'Nájom — apríl', date: '1. apríl 2026',
    isPersonal: false, category: 'Bývanie',
    splits: [
      { userId: 'u1', amount: 160.00, settled: true },
      { userId: 'u4', amount: 160.00, settled: false },
      { userId: 'u5', amount: 160.00, settled: false },
    ],
  },
  {
    id: 'e2', groupId: 'g2', amount: 120.00, paidBy: 'u1', merchant: 'Internet — O2', date: '3. apríl 2026',
    isPersonal: false, category: 'Služby',
    splits: [
      { userId: 'u1', amount: 40.00, settled: true },
      { userId: 'u4', amount: 40.00, settled: false },
      { userId: 'u5', amount: 40.00, settled: false },
    ],
  },
]
