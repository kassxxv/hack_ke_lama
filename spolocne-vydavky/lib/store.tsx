'use client'

import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { Group, Expense, User } from '@/types'

type State = { groups: Group[]; expenses: Expense[]; currentUser: User | null }

type Action =
  | { type: 'SET_GROUPS'; groups: Group[] }
  | { type: 'SET_USER'; user: User }
  | { type: 'ADD_GROUP'; group: Group }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'SETTLE'; groupId: string; fromId: string; toId: string; amount: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_GROUPS':
      return { ...state, groups: action.groups }
    case 'SET_USER':
      return { ...state, currentUser: action.user }
    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, action.group] }
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.expense] }
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
      return { ...state, expenses: updated }
    }
    default:
      return state
  }
}

const StoreContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { groups: [], expenses: [], currentUser: null })

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(user => { if (user) dispatch({ type: 'SET_USER', user }) })
      .catch(() => {})

    fetch('/api/groups')
      .then(r => r.json())
      .then((data: unknown) => { if (Array.isArray(data)) dispatch({ type: 'SET_GROUPS', groups: data as Group[] }) })
      .catch(() => {})
  }, [])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

export type { State, Action }
