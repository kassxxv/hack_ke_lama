'use client'

import type { Expense } from '@/types'
import { useLang } from '@/lib/use-lang'

const CATEGORY_EMOJI: Record<string, string> = {
  Potraviny: '🛒', Doprava: '⛽', Zábava: '🎭',
  Bývanie: '🏠', Služby: '📡', Predplatné: '📺',
  food: '🍽️', groceries: '🛒', transport: '🚗',
  entertainment: '🎮', housing: '🏠', other: '💡',
  settlement: '✅',
}

interface ExpenseRowProps {
  expense: Expense
  currentUserId: string
}

export default function ExpenseRow({ expense, currentUserId }: ExpenseRowProps) {
  const { t } = useLang()
  const myShare = expense.splits.find(s => s.userId === currentUserId)
  const isPaidByMe = expense.paidBy === currentUserId
  const isSettlement = expense.category === 'settlement'

  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '0.5px solid #38383a' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: isSettlement ? '#30d15822' : '#2c2c2e' }}>
        {CATEGORY_EMOJI[expense.category] ?? '💳'}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[14px] font-medium truncate ${isSettlement ? 'text-[#30d158]' : 'text-white'}`}>
          {expense.merchant}
        </div>
        <div className="text-[12px] mt-0.5" style={{ color: '#8e8e93' }}>
          {isPaidByMe ? t.expenseRow.you : t.expenseRow.someone} {t.expenseRow.paid} · {expense.date}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`text-[15px] font-mono font-semibold ${isSettlement ? 'text-[#30d158]' : 'text-white'}`}>
          {isSettlement ? '+' : ''}{expense.amount.toFixed(2)} €
        </div>
        {myShare && !isSettlement && (
          <div className={`text-[12px] font-mono ${myShare.settled ? 'text-[#8e8e93]' : isPaidByMe ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
            {isPaidByMe ? `+${(expense.amount - myShare.amount).toFixed(2)} €` : `-${myShare.amount.toFixed(2)} €`}
          </div>
        )}
      </div>
    </div>
  )
}
