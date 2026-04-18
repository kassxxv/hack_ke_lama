'use client'

import TBShell from '@/components/TBShell'
import { MOCK_GROUPS } from '@/lib/mock-data'
import { ChevronLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

const ME = 'u1'
type SplitType = 'equal' | 'amount' | 'percent'

function SplitPageContent() {
  const params = useSearchParams()
  const amount = parseFloat(params.get('amount') ?? '12.33')
  const merchant = params.get('merchant') ?? 'KAUFLAND Poprad'

  const allMembers = MOCK_GROUPS.flatMap(g => g.members).filter(
    (m, i, arr) => m.user.id !== ME && arr.findIndex(x => x.user.id === m.user.id) === i
  )

  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [selected, setSelected] = useState<Set<string>>(new Set([allMembers[0]?.user.id, allMembers[1]?.user.id].filter(Boolean) as string[]))

  const selectedCount = selected.size + 1
  const perPerson = amount / selectedCount

  function toggleMember(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <TBShell>
      <div className="px-4 pt-4 pb-2">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link href="/" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#1c1c1e' }}>
            <ChevronLeft size={18} color="#0a84ff" />
          </Link>
          <h1 className="text-[20px] font-bold text-white">Rozdeliť výdavok</h1>
        </div>

        {/* Transaction card */}
        <div className="rounded-2xl p-4 mb-5" style={{ background: '#1c1c1e' }}>
          <div className="text-[13px] font-medium text-white truncate">{merchant}</div>
          <div className="text-[30px] font-bold font-mono text-[#ff453a] tracking-tight">– {amount.toFixed(2)} EUR</div>
          <div className="text-[12px] mt-1" style={{ color: '#8e8e93' }}>18. apríl 2026</div>
        </div>

        {/* Split type toggle */}
        <div className="text-[13px] font-semibold mb-2" style={{ color: '#8e8e93' }}>Ako rozdeliť?</div>
        <div className="flex rounded-2xl p-1 mb-2" style={{ background: '#1c1c1e' }}>
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

        {/* Summary */}
        <div className="rounded-xl px-4 py-3 mb-5" style={{ background: '#1c3a5e' }}>
          <span className="text-[13px]" style={{ color: '#0a84ff' }}>
            Každý dlhuje: <span className="font-mono font-semibold">{perPerson.toFixed(2)} EUR</span> · {selectedCount} {selectedCount === 1 ? 'osoba' : selectedCount < 5 ? 'osoby' : 'osôb'}
          </span>
        </div>

        {/* People */}
        <div className="text-[15px] font-semibold text-white mb-3">Vyber ľudí</div>
        <div className="space-y-2 mb-5">
          {allMembers.map(m => {
            const isSelected = selected.has(m.user.id)
            return (
              <button
                key={m.user.id}
                onClick={() => toggleMember(m.user.id)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all"
                style={{ background: '#1c1c1e', border: isSelected ? '1px solid #0a84ff44' : '1px solid transparent' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold text-white flex-shrink-0"
                  style={{ background: m.user.avatarColor }}
                >
                  {m.user.name.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-[14px] font-medium text-white">{m.user.name}</div>
                  <div className="text-[12px]" style={{ color: isSelected ? '#30d158' : '#8e8e93' }}>
                    {isSelected ? `${perPerson.toFixed(2)} EUR` : 'Nevybraný'}
                  </div>
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: isSelected ? '#0a84ff' : '#2c2c2e' }}
                >
                  {isSelected && <Check size={13} color="#fff" strokeWidth={2.5} />}
                </div>
              </button>
            )
          })}
        </div>

        {/* CTAs */}
        <button className="w-full py-4 rounded-2xl font-semibold text-[16px] text-white mb-2" style={{ background: '#0a84ff' }}>
          Vyžiadať platbu · €{(perPerson * selected.size).toFixed(2)}
        </button>
        <button className="w-full py-3 rounded-2xl font-medium text-[14px]" style={{ background: '#1c1c1e', color: '#8e8e93', border: '1px solid #38383a' }}>
          Označiť ako zaplatené
        </button>
      </div>
    </TBShell>
  )
}

export default function SplitPage() {
  return (
    <Suspense>
      <SplitPageContent />
    </Suspense>
  )
}
