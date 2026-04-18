import type { Expense } from '@/types'

const CATEGORY_EMOJI: Record<string, string> = {
  Potraviny: '🛒', Doprava: '⛽', Zábava: '🎭',
  Bývanie: '🏠', Služby: '📡', Predplatné: '📺',
}

interface ExpenseRowProps {
  expense: Expense
  currentUserId: string
}

export default function ExpenseRow({ expense, currentUserId }: ExpenseRowProps) {
  const myShare = expense.splits.find(s => s.userId === currentUserId)
  const isPaidByMe = expense.paidBy === currentUserId

  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '0.5px solid #38383a' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ background: '#2c2c2e' }}>
        {CATEGORY_EMOJI[expense.category] ?? '💳'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-white truncate">{expense.merchant}</div>
        <div className="text-[12px] mt-0.5" style={{ color: '#8e8e93' }}>
          {isPaidByMe ? 'Ty' : 'Niekto'} zaplatil · {expense.date}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[15px] font-mono font-semibold text-white">
          {expense.amount.toFixed(2)} €
        </div>
        {myShare && (
          <div className={`text-[12px] font-mono ${myShare.settled ? 'text-[#8e8e93]' : isPaidByMe ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
            {isPaidByMe ? `+${(expense.amount - myShare.amount).toFixed(2)} €` : `-${myShare.amount.toFixed(2)} €`}
          </div>
        )}
      </div>
    </div>
  )
}
