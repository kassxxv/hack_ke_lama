'use client'

import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { Group, Expense } from '@/types'

type State = { groups: Group[]; expenses: Expense[] }

type Action =
  | { type: 'ADD_GROUP'; group: Group }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'SETTLE'; groupId: string; fromId: string; toId: string; amount: number }
  | { type: 'HYDRATE'; state: State }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return action.state
    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, action.group] }
    case 'ADD_EXPENSE': {
      const updated = [...state.expenses, action.expense]
      return { ...state, expenses: updated }
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
      return { ...state, expenses: updated }
    }
    default:
      return state
  }
}

const StoreContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { groups: [], expenses: [] })

  useEffect(() => {
    fetch('/api/groups')
      .then(r => r.json())
      .then((groups: Group[]) => dispatch({ type: 'HYDRATE', state: { groups, expenses: [] } }))
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
