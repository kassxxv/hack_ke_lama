'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useLang } from '@/lib/use-lang'
import type { BudgetLimit } from '@/types'

const CATEGORIES = ['food', 'groceries', 'transport', 'entertainment', 'housing', 'other'] as const

export default function BudgetLimitsSheet({
  groupId,
  initial,
  onClose,
  onSaved,
}: {
  groupId: string
  initial: BudgetLimit[]
  onClose: () => void
  onSaved: (limits: BudgetLimit[]) => void
}) {
  const { t } = useLang()
  const CAT_EMOJI: Record<string, string> = {
    food: '🍽️', groceries: '🛒', transport: '🚗',
    entertainment: '🎮', housing: '🏠', other: '💡',
  }

  const [values, setValues] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    for (const cat of CATEGORIES) {
      const existing = initial.find(l => l.category === cat)
      m[cat] = existing ? String(existing.limitAmount) : ''
    }
    return m
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const limits: BudgetLimit[] = CATEGORIES
      .filter(cat => values[cat] && parseFloat(values[cat]) > 0)
      .map(cat => ({ category: cat, limitAmount: parseFloat(values[cat]) }))
    const res = await fetch(`/api/groups/${groupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budgetLimits: limits }),
    })
    setSaving(false)
    if (res.ok) onSaved(limits)
  }

  const catLabel = (cat: string) => (t.categories as Record<string, string>)[cat] ?? cat

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full rounded-t-3xl pb-safe"
        style={{ background: '#1c1c1e', maxHeight: '88vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#38383a' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '0.5px solid #38383a' }}>
          <div>
            <div className="text-[17px] font-bold text-white">{t.budgetLimits.title}</div>
            <div className="text-[12px] mt-0.5" style={{ color: '#8e8e93' }}>{t.budgetLimits.subtitle}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full" style={{ background: '#2c2c2e' }}>
            <X size={16} color="#8e8e93" />
          </button>
        </div>

        {/* Category rows */}
        <div className="px-5 py-2">
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat}
              className="flex items-center gap-3 py-3.5"
              style={{ borderBottom: i < CATEGORIES.length - 1 ? '0.5px solid #38383a' : 'none' }}
            >
              <div className="text-[22px] w-9 text-center flex-shrink-0">{CAT_EMOJI[cat]}</div>
              <div className="flex-1">
                <div className="text-[14px] font-medium text-white">{catLabel(cat)}</div>
                <div className="text-[11px] mt-0.5" style={{ color: '#8e8e93' }}>{t.budgetLimits.limitLabel}</div>
              </div>
              <div className="relative flex-shrink-0">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  placeholder={t.budgetLimits.noLimit}
                  value={values[cat]}
                  onChange={e => setValues(v => ({ ...v, [cat]: e.target.value }))}
                  className="text-right text-[15px] font-mono font-semibold text-white bg-transparent outline-none w-28 pr-6 py-1 rounded-xl"
                  style={{ background: '#2c2c2e', paddingLeft: 10 }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: '#8e8e93' }}>€</span>
              </div>
            </div>
          ))}
        </div>

        {/* Save */}
        <div className="px-5 pb-6 pt-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-2xl text-[16px] font-bold text-white"
            style={{ background: '#0a84ff', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? t.budgetLimits.saving : t.budgetLimits.saveBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
