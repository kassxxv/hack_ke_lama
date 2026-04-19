'use client'

import TBShell from '@/components/TBShell'
import { useStore } from '@/lib/store'
import { createExpense, fetchGroups } from '@/lib/api'
import { ChevronLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import type { SplitType, Split } from '@/types'
import { useLang } from '@/lib/use-lang'

const parseNum = (s: string) => parseFloat((s || '').replace(',', '.')) || 0
const fmt = (n: number) => n.toFixed(2).replace('.', ',')

const CATEGORIES_SK = ['Potraviny', 'Doprava', 'Zábava', 'Bývanie', 'Služby', 'Predplatné', 'Iné']
const CATEGORIES_EN = ['Groceries', 'Transport', 'Entertainment', 'Housing', 'Services', 'Subscription', 'Other']

function AddExpenseContent() {
  const { state, dispatch } = useStore()
  const { t, lang } = useLang()
  const router = useRouter()
  const params = useSearchParams()
  const preGroupId = params.get('groupId') ?? state.groups[0]?.id ?? ''
  const preAmount = params.get('amount') ?? ''
  const preMerchant = params.get('merchant') ?? ''

  const CATEGORIES = lang === 'en' ? CATEGORIES_EN : CATEGORIES_SK

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const [groupId, setGroupId] = useState(preGroupId)
  const [merchant, setMerchant] = useState(preMerchant)
  const [amount, setAmount] = useState(preAmount)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [paidBy, setPaidBy] = useState(state.currentUser?.id ?? '')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})
  const [customPercents, setCustomPercents] = useState<Record<string, string>>({})
  const [lockedAmounts, setLockedAmounts] = useState<Set<string>>(new Set())
  const [lockedPercents, setLockedPercents] = useState<Set<string>>(new Set())

  const group = state.groups.find(g => g.id === groupId) ?? state.groups[0]
  const members = group?.members ?? []
  const numericAmount = parseFloat(amount.replace(',', '.')) || 0
  const allSelected = selected.size === 0 ? members.map(m => m.user.id) : [...selected]
  const perPerson = allSelected.length > 0 ? numericAmount / allSelected.length : 0

  function displayedAmount(memberId: string): string {
    if (lockedAmounts.has(memberId)) return customAmounts[memberId] ?? ''
    const lockedSum = [...lockedAmounts].reduce((s, id) => s + parseNum(customAmounts[id] ?? '0'), 0)
    const unlockedCount = members.length - lockedAmounts.size
    if (unlockedCount <= 0) return '0,00'
    const remaining = Math.max(0, numericAmount - lockedSum) / unlockedCount
    return fmt(remaining)
  }

  function displayedPercent(memberId: string): string {
    if (lockedPercents.has(memberId)) return customPercents[memberId] ?? ''
    const lockedSum = [...lockedPercents].reduce((s, id) => s + parseNum(customPercents[id] ?? '0'), 0)
    const unlockedCount = members.length - lockedPercents.size
    if (unlockedCount <= 0) return '0,00'
    const remaining = Math.max(0, 100 - lockedSum) / unlockedCount
    return fmt(remaining)
  }

  const amountSum = members.reduce((s, m) => s + parseNum(displayedAmount(m.user.id)), 0)
  const percentSum = members.reduce((s, m) => s + parseNum(displayedPercent(m.user.id)), 0)
  const amountValid = numericAmount > 0 && Math.abs(amountSum - numericAmount) < 0.01
  const percentValid = Math.abs(percentSum - 100) < 0.01

  useEffect(() => {
    setLockedAmounts(new Set())
    setLockedPercents(new Set())
    setCustomAmounts({})
    setCustomPercents({})
  }, [groupId])

  function toggleMember(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function switchSplitType(type: SplitType) {
    setSplitType(type)
    if (type === 'amount') {
      setLockedAmounts(new Set())
      setCustomAmounts({})
    }
    if (type === 'percent') {
      setLockedPercents(new Set())
      setCustomPercents({})
    }
  }

  function onAmountChange(memberId: string, value: string) {
    setCustomAmounts(prev => ({ ...prev, [memberId]: value }))
    setLockedAmounts(prev => {
      const next = new Set(prev)
      if (value.trim() === '') next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  function onPercentChange(memberId: string, value: string) {
    setCustomPercents(prev => ({ ...prev, [memberId]: value }))
    setLockedPercents(prev => {
      const next = new Set(prev)
      if (value.trim() === '') next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  function buildSplits(): Split[] {
    if (splitType === 'equal') {
      const ids = allSelected
      return ids.map(userId => ({
        userId,
        amount: parseFloat((numericAmount / ids.length).toFixed(2)),
        settled: userId === paidBy,
      }))
    }
    if (splitType === 'amount') {
      return members
        .map(m => ({ userId: m.user.id, amount: parseFloat(parseNum(displayedAmount(m.user.id)).toFixed(2)) }))
        .filter(s => s.amount > 0)
        .map(s => ({ ...s, settled: s.userId === paidBy }))
    }
    return members
      .map(m => {
        const pct = parseNum(displayedPercent(m.user.id))
        return { userId: m.user.id, amount: parseFloat(((pct / 100) * numericAmount).toFixed(2)) }
      })
      .filter(s => s.amount > 0)
      .map(s => ({ ...s, settled: s.userId === paidBy }))
  }

  const splitValid =
    splitType === 'equal' ? allSelected.length > 0 :
    splitType === 'amount' ? amountValid :
    percentValid

  const canSave = Boolean(merchant.trim()) && numericAmount > 0 && splitValid

  async function handleSave() {
    if (!canSave || !group) return
    const splits = buildSplits()
    if (splits.length === 0) return
    const expenseDate = new Date(selectedYear, selectedMonth, new Date().getDate())
    await createExpense(groupId, {
      amount: numericAmount,
      paidBy,
      splits,
      merchant: merchant.trim(),
      date: expenseDate.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' }),
      isPersonal: false,
      category,
    })
    router.push(`/groups/${groupId}`)
  }

  return (
    <TBShell>
      <div className="px-4 pt-3">
        {/* Header */}
        <div className="flex items-center mb-5" style={{ position: 'relative' }}>
          <Link href={`/groups/${groupId}`} className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
          </Link>
          <h1 className="text-[17px] font-semibold text-white absolute left-1/2 -translate-x-1/2">{t.addExpense.title}</h1>
        </div>

        {/* Month pills */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {Array.from({ length: 6 }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
              const m = d.getMonth()
              const y = d.getFullYear()
              const isActive = m === selectedMonth && y === selectedYear
              return (
                <button
                  key={`${y}-${m}`}
                  onClick={() => { setSelectedMonth(m); setSelectedYear(y) }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all"
                  style={{
                    background: isActive ? '#0a84ff' : 'transparent',
                    color: isActive ? '#fff' : '#8e8e93',
                    border: isActive ? 'none' : '1px solid #38383a',
                  }}
                >
                  {t.report.monthsShort[m]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Group picker */}
        <div className="mb-4">
          <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>{t.addExpense.group}</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {state.groups.map(g => (
              <button
                key={g.id}
                onClick={() => setGroupId(g.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all"
                style={{
                  background: groupId === g.id ? '#0a84ff' : '#1c1c1e',
                  color: groupId === g.id ? '#fff' : '#8e8e93',
                  border: groupId === g.id ? 'none' : '1px solid #38383a',
                }}
              >
                {g.emoji} {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>{t.addExpense.amount}</div>
          <div className="flex items-baseline gap-2 rounded-2xl px-4 py-3" style={{ background: '#1c1c1e' }}>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-[32px] font-bold text-white outline-none w-full"
              style={{ caretColor: '#0a84ff' }}
            />
            <span className="text-[20px] font-semibold" style={{ color: '#8e8e93' }}>EUR</span>
          </div>
        </div>

        {/* Merchant */}
        <div className="mb-4">
          <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>{t.addExpense.description}</div>
          <input
            type="text"
            placeholder={t.addExpense.descriptionPlaceholder}
            value={merchant}
            onChange={e => setMerchant(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-[15px] text-white outline-none"
            style={{ background: '#1c1c1e', caretColor: '#0a84ff' }}
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>{t.addExpense.category}</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all"
                style={{
                  background: category === c ? '#0a84ff' : '#1c1c1e',
                  color: category === c ? '#fff' : '#8e8e93',
                  border: category === c ? 'none' : '1px solid #38383a',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Paid by */}
        <div className="mb-4">
          <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>{t.addExpense.paidBy}</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {members.map(m => (
              <button
                key={m.user.id}
                onClick={() => setPaidBy(m.user.id)}
                className="flex items-center gap-2 flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all"
                style={{
                  background: paidBy === m.user.id ? '#0a84ff' : '#1c1c1e',
                  color: paidBy === m.user.id ? '#fff' : '#8e8e93',
                  border: paidBy === m.user.id ? 'none' : '1px solid #38383a',
                }}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: m.user.avatarColor }}>
                  {m.user.name.charAt(0)}
                </div>
                {m.user.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Split type */}
        <div className="mb-3">
          <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>{t.addExpense.split}</div>
          <div className="flex rounded-2xl p-1" style={{ background: '#1c1c1e' }}>
            {(['equal', 'amount', 'percent'] as SplitType[]).map(type => {
              const labels = { equal: t.addExpense.splitEqual, amount: t.addExpense.splitAmount, percent: t.addExpense.splitPercent }
              return (
                <button
                  key={type}
                  onClick={() => switchSplitType(type)}
                  className="flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all"
                  style={{
                    background: splitType === type ? '#0a84ff' : 'transparent',
                    color: splitType === type ? '#fff' : '#8e8e93',
                  }}
                >
                  {labels[type]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Members */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[12px] uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>
              {splitType === 'equal'
                ? (perPerson > 0 ? t.addExpense.splitBetween(fmt(perPerson)) : t.addExpense.splitBetweenNoAmt)
                : splitType === 'amount' ? t.addExpense.splitAmountHint : t.addExpense.splitPercentHint}
            </div>
            {splitType === 'amount' && (
              <div className="text-[12px] font-mono font-semibold" style={{ color: amountValid ? '#30d158' : '#ff3b30' }}>
                {t.addExpense.sumLabel}: {fmt(amountSum)} / {fmt(numericAmount)} €
              </div>
            )}
            {splitType === 'percent' && (
              <div className="text-[12px] font-mono font-semibold" style={{ color: percentValid ? '#30d158' : '#ff3b30' }}>
                {t.addExpense.sumLabel}: {fmt(percentSum)} / 100 %
              </div>
            )}
          </div>
          <div className="space-y-2">
            {members.map(m => {
              if (splitType === 'equal') {
                const isSelected = selected.size === 0 || selected.has(m.user.id)
                return (
                  <button
                    key={m.user.id}
                    onClick={() => toggleMember(m.user.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                    style={{
                      background: '#1c1c1e',
                      border: isSelected ? '1px solid #0a84ff44' : '1px solid transparent',
                    }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0" style={{ background: m.user.avatarColor }}>
                      {m.user.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-[14px] font-medium text-white">{m.user.name}</div>
                      <div className="text-[12px]" style={{ color: isSelected ? '#30d158' : '#8e8e93' }}>
                        {isSelected && perPerson > 0 ? `${fmt(perPerson)} EUR` : t.addExpense.notSelected}
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isSelected ? '#0a84ff' : '#2c2c2e' }}>
                      {isSelected && <Check size={13} color="#fff" strokeWidth={2.5} />}
                    </div>
                  </button>
                )
              }
              if (splitType === 'amount') {
                const val = displayedAmount(m.user.id)
                const parsed = parseNum(val)
                const isLocked = lockedAmounts.has(m.user.id)
                return (
                  <div
                    key={m.user.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{
                      background: '#1c1c1e',
                      border: isLocked ? '1px solid #0a84ff88' : parsed > 0 ? '1px solid #0a84ff22' : '1px solid transparent',
                    }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0" style={{ background: m.user.avatarColor }}>
                      {m.user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-white">{m.user.name}</div>
                      <div className="text-[12px]" style={{ color: parsed > 0 ? (isLocked ? '#0a84ff' : '#8e8e93') : '#8e8e93' }}>
                        {parsed > 0 && numericAmount > 0
                          ? `${fmt((parsed / numericAmount) * 100)} %${isLocked ? ' · 🔒' : ''}`
                          : t.addExpense.notSelected}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={val}
                        onChange={e => onAmountChange(m.user.id, e.target.value)}
                        className="w-20 bg-transparent text-[15px] font-mono font-semibold text-white text-right outline-none"
                        style={{ caretColor: '#0a84ff' }}
                        placeholder="0,00"
                      />
                      <span className="text-[13px]" style={{ color: '#8e8e93' }}>€</span>
                    </div>
                  </div>
                )
              }
              const val = displayedPercent(m.user.id)
              const parsed = parseNum(val)
              const asEur = (parsed / 100) * numericAmount
              const isLocked = lockedPercents.has(m.user.id)
              return (
                <div
                  key={m.user.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{
                    background: '#1c1c1e',
                    border: isLocked ? '1px solid #0a84ff88' : parsed > 0 ? '1px solid #0a84ff22' : '1px solid transparent',
                  }}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0" style={{ background: m.user.avatarColor }}>
                    {m.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-white">{m.user.name}</div>
                    <div className="text-[12px]" style={{ color: parsed > 0 ? (isLocked ? '#0a84ff' : '#8e8e93') : '#8e8e93' }}>
                      {parsed > 0 && numericAmount > 0
                        ? `${fmt(asEur)} EUR${isLocked ? ' · 🔒' : ''}`
                        : t.addExpense.notSelected}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={val}
                      onChange={e => onPercentChange(m.user.id, e.target.value)}
                      className="w-16 bg-transparent text-[15px] font-mono font-semibold text-white text-right outline-none"
                      style={{ caretColor: '#0a84ff' }}
                      placeholder="0"
                    />
                    <span className="text-[13px]" style={{ color: '#8e8e93' }}>%</span>
                  </div>
                </div>
              )
            })}
          </div>
          {splitType === 'amount' && !amountValid && numericAmount > 0 && (
            <div className="text-[12px] mt-2" style={{ color: '#ff3b30' }}>{t.addExpense.sumMismatch}</div>
          )}
          {splitType === 'percent' && !percentValid && (
            <div className="text-[12px] mt-2" style={{ color: '#ff3b30' }}>{t.addExpense.percentMismatch}</div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full py-4 rounded-2xl font-semibold text-[16px] text-white mb-2 transition-opacity"
          style={{ background: canSave ? '#0a84ff' : '#2c2c2e', opacity: canSave ? 1 : 0.5 }}
        >
          {numericAmount > 0 ? t.addExpense.addBtn(fmt(numericAmount)) : t.addExpense.addBtnNoAmt}
        </button>

        <div className="h-4" />
      </div>
    </TBShell>
  )
}

export default function AddExpensePage() {
  return <Suspense><AddExpenseContent /></Suspense>
}
