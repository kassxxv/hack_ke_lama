import type { Member } from '@/types'

export type DebtRow = {
  fromId: string
  fromName: string
  fromColor: string
  toId: string
  toName: string
  toColor: string
  amount: number
}

export function calculateDebts(members: Member[]): DebtRow[] {
  const creditors = members.filter(m => m.balance > 0).map(m => ({ ...m, balance: m.balance }))
  const debtors = members.filter(m => m.balance < 0).map(m => ({ ...m, balance: -m.balance }))

  const rows: DebtRow[] = []
  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci]
    const d = debtors[di]
    const amount = Math.min(c.balance, d.balance)
    if (amount > 0.009) {
      rows.push({
        fromId: d.user.id,
        fromName: d.user.name,
        fromColor: d.user.avatarColor,
        toId: c.user.id,
        toName: c.user.name,
        toColor: c.user.avatarColor,
        amount: parseFloat(amount.toFixed(2)),
      })
    }
    c.balance -= amount
    d.balance -= amount
    if (c.balance < 0.01) ci++
    if (d.balance < 0.01) di++
  }

  return rows
}
