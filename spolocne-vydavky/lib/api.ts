import type { Group, Expense } from '@/types'

const BASE = '/api'

export async function fetchGroups(): Promise<Group[]> {
  const res = await fetch(`${BASE}/groups`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch groups')
  return res.json()
}

export async function createGroup(data: { name: string; type: string; emoji: string; isTemporary: boolean; members: { userId: string; name: string; phone: string; avatarColor: string; role: string }[] }): Promise<Group> {
  const res = await fetch(`${BASE}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create group')
  return res.json()
}

export async function fetchExpenses(groupId: string): Promise<Expense[]> {
  const res = await fetch(`${BASE}/groups/${groupId}/expenses`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch expenses')
  return res.json()
}

export async function createExpense(groupId: string, data: Omit<Expense, 'id' | 'groupId'>): Promise<Expense> {
  const res = await fetch(`${BASE}/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create expense')
  return res.json()
}

export async function settleDebt(groupId: string, fromId: string, toId: string): Promise<void> {
  await fetch(`${BASE}/groups/${groupId}/settle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromId, toId }),
  })
}
