'use client'

import TBShell from '@/components/TBShell'
import { useStore } from '@/lib/store'
import { createExpense, fetchGroups } from '@/lib/api'
import { ChevronLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import type { SplitType } from '@/types'

const CATEGORIES = ['Potraviny', 'Doprava', 'Zábava', 'Bývanie', 'Služby', 'Predplatné', 'Iné']

function AddExpenseContent() {
  const { state, dispatch } = useStore()
  const router = useRouter()
  const params = useSearchParams()
  const preGroupId = params.get('groupId') ?? state.groups[0]?.id ?? ''

  const [groupId, setGroupId] = useState(preGroupId)
  const [merchant, setMerchant] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Potraviny')
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [paidBy, setPaidBy] = useState('u1')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const group = state.groups.find(g => g.id === groupId) ?? state.groups[0]
  const members = group?.members ?? []
  const numericAmount = parseFloat(amount.replace(',', '.')) || 0
  const allSelected = selected.size === 0 ? members.map(m => m.user.id) : [...selected]
  const perPerson = allSelected.length > 0 ? numericAmount / allSelected.length : 0

  function toggleMember(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  async function handleSave() {
    if (!merchant.trim() || numericAmount <= 0 || !group) return
    const splitMembers = allSelected
    const splits = splitMembers.map(userId => ({
      userId,
      amount: parseFloat((numericAmount / splitMembers.length).toFixed(2)),
      settled: userId === paidBy,
    }))
    await createExpense(groupId, {
      amount: numericAmount,
      paidBy,
      splits,
      merchant: merchant.trim(),
      date: new Date().toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' }),
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
          <h1 className="text-[17px] font-semibold text-white absolute left-1/2 -translate-x-1/2">Nový výdavok</h1>
        </div>

        {/* Group picker */}
        <div className="mb-4">
          <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>Skupina</div>
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
          <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>Suma</div>
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
          <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>Popis</div>
          <input
            type="text"
            placeholder="Napr. Nájom, Kaufland, Pizza…"
            value={merchant}
            onChange={e => setMerchant(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-[15px] text-white outline-none"
            style={{ background: '#1c1c1e', caretColor: '#0a84ff' }}
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>Kategória</div>
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
          <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>Zaplatil/a</div>
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
          <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>Rozdelenie</div>
          <div className="flex rounded-2xl p-1" style={{ background: '#1c1c1e' }}>
            {(['equal', 'amount', 'percent'] as SplitType[]).map(type => {
              const labels = { equal: 'Rovnako', amount: 'Suma €', percent: 'Percento %' }
              return (
                <button
                  key={type}
                  onClick={() => setSplitType(type)}
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
          <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>
            Rozdeliť medzi · {perPerson > 0 ? `${perPerson.toFixed(2).replace('.', ',')} EUR / osoba` : ''}
          </div>
          <div className="space-y-2">
            {members.map(m => {
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
                      {isSelected && perPerson > 0 ? `${perPerson.toFixed(2).replace('.', ',')} EUR` : 'Nevybraný'}
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isSelected ? '#0a84ff' : '#2c2c2e' }}>
                    {isSelected && <Check size={13} color="#fff" strokeWidth={2.5} />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!merchant.trim() || numericAmount <= 0}
          className="w-full py-4 rounded-2xl font-semibold text-[16px] text-white mb-2 transition-opacity"
          style={{ background: merchant.trim() && numericAmount > 0 ? '#0a84ff' : '#2c2c2e', opacity: merchant.trim() && numericAmount > 0 ? 1 : 0.5 }}
        >
          Pridať výdavok · {numericAmount > 0 ? `${numericAmount.toFixed(2).replace('.', ',')} EUR` : ''}
        </button>

        <div className="h-4" />
      </div>
    </TBShell>
  )
}

export default function AddExpensePage() {
  return <Suspense><AddExpenseContent /></Suspense>
}
