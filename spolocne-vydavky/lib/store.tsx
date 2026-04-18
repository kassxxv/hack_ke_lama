'use client'

import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import { MOCK_GROUPS, MOCK_EXPENSES } from './mock-data'
import type { Group, Expense } from '@/types'

type State = { groups: Group[]; expenses: Expense[] }

type Action =
  | { type: 'ADD_GROUP'; group: Group }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'SETTLE'; groupId: string; fromId: string; toId: string; amount: number }
  | { type: 'HYDRATE'; state: State }

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

    return { ...group, members: group.members.map(m => ({ ...m, balance: balanceMap[m.user.id] ?? 0 })) }
  })
}

const defaultState: State = {
  groups: recalcBalances(MOCK_GROUPS, MOCK_EXPENSES),
  expenses: MOCK_EXPENSES,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return action.state
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
            return isDebtor ? { ...s, settled: true } : s
          }),
        }
      })
      return { groups: recalcBalances(state.groups, updated), expenses: updated }
    }
    default:
      return state
  }
}

const StoreContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

const STORAGE_KEY = 'sv_store_v1'

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState)

  // Hydrate from localStorage on first mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as State
        // Only hydrate if user has added custom data (more groups than default)
        if (parsed.groups?.length > 0) {
          dispatch({ type: 'HYDRATE', state: parsed })
        }
      }
    } catch { /* ignore parse errors */ }
  }, [])

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch { /* ignore storage errors */ }
  }, [state])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

export type { State, Action }
