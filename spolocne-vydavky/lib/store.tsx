'use client'

import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { MOCK_GROUPS, MOCK_EXPENSES } from './mock-data'
import type { Group, Expense } from '@/types'

type State = {
  groups: Group[]
  expenses: Expense[]
}

type Action =
  | { type: 'ADD_GROUP'; group: Group }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'SETTLE'; groupId: string; fromId: string; toId: string; amount: number }

function recalcBalances(groups: Group[], expenses: Expense[]): Group[] {
  return groups.map(group => {
    const groupExpenses = expenses.filter(e => e.groupId === group.id)
    const balanceMap: Record<string, number> = {}
    group.members.forEach(m => { balanceMap[m.user.id] = 0 })

    groupExpenses.forEach(expense => {
      expense.splits.forEach(split => {
        if (!split.settled) {
          if (split.userId === expense.paidBy) {
            balanceMap[expense.paidBy] = (balanceMap[expense.paidBy] ?? 0) + (expense.amount - split.amount)
          } else {
            balanceMap[split.userId] = (balanceMap[split.userId] ?? 0) - split.amount
            balanceMap[expense.paidBy] = (balanceMap[expense.paidBy] ?? 0) + split.amount
          }
        }
      })
    })

    return {
      ...group,
      members: group.members.map(m => ({ ...m, balance: balanceMap[m.user.id] ?? 0 })),
    }
  })
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_GROUP': {
      const updated = [...state.groups, action.group]
      return { ...state, groups: recalcBalances(updated, state.expenses) }
    }
    case 'ADD_EXPENSE': {
      const updated = [...state.expenses, action.expense]
      return { groups: recalcBalances(state.groups, updated), expenses: updated }
    }
    case 'SETTLE': {
      const updated = state.expenses.map(e => {
        if (e.groupId !== action.groupId) return e
        return {
          ...e,
          splits: e.splits.map(s => {
            const isDebtor = s.userId === action.fromId && e.paidBy === action.toId
            if (isDebtor) return { ...s, settled: true }
            return s
          }),
        }
      })
      return { groups: recalcBalances(state.groups, updated), expenses: updated }
    }
    default:
      return state
  }
}

const initialState: State = {
  groups: recalcBalances(MOCK_GROUPS, MOCK_EXPENSES),
  expenses: MOCK_EXPENSES,
}

const StoreContext = createContext<{
  state: State
  dispatch: React.Dispatch<Action>
} | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

export type { State, Action }
