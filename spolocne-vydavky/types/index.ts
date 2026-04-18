export type GroupType = 'family' | 'roommates' | 'peers'
export type Role = 'admin' | 'member' | 'junior'
export type SplitType = 'equal' | 'amount' | 'percent'

export type User = {
  id: string
  name: string
  phone: string
  avatarColor: string
}

export type Member = {
  user: User
  role: Role
  balance: number
  contributed?: number
}

export type Group = {
  id: string
  name: string
  type: GroupType
  members: Member[]
  totalOwed: number
  isTemporary: boolean
  emoji: string
  potBalance?: number
  potTarget?: number
}

export type Split = {
  userId: string
  amount: number
  settled: boolean
}

export type Expense = {
  id: string
  groupId: string
  amount: number
  paidBy: string
  splits: Split[]
  merchant: string
  date: string
  isPersonal: boolean
  category: string
}

export type Task = {
  id: string
  groupId: string
  title: string
  reward: number
  assignedTo: string
  completed: boolean
}

export type Transaction = {
  id: string
  merchant: string
  amount: number
  date: string
  category: string
  canSplit: boolean
}
