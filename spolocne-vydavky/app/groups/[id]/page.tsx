'use client'

import TBShell from '@/components/TBShell'
import ExpenseRow from '@/components/ExpenseRow'
import RoleBadge from '@/components/RoleBadge'
import { useStore } from '@/lib/store'
import { calculateDebts } from '@/lib/debt'
import { ChevronLeft, UserPlus, Volume2, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

const ME = 'u1'

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { state, dispatch } = useStore()

  const group = state.groups.find(g => g.id === id) ?? state.groups[0]
  const expenses = state.expenses.filter(e => e.groupId === id)
  const me = group?.members.find(m => m.user.id === ME)
  const balance = me?.balance ?? 0
  const debts = group ? calculateDebts(group.members) : []

  function handleSettle(fromId: string, toId: string, amount: number) {
    dispatch({ type: 'SETTLE', groupId: id, fromId, toId, amount })
  }

  if (!group) return null

  return (
    <TBShell>
      <div className="px-4 pt-3">
        {/* Header */}
        <div className="flex items-center mb-5" style={{ position: 'relative' }}>
          <Link href="/groups" className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
          </Link>
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <div className="text-[17px] font-semibold text-white">{group.name}</div>
            <div className="text-[11px]" style={{ color: '#8e8e93' }}>{group.members.length} členov</div>
          </div>
          <button className="ml-auto w-8 h-8 flex items-center justify-center">
            <UserPlus size={18} color="#8e8e93" />
          </button>
        </div>

        {/* My balance — on black */}
        <div className="text-center mb-5">
          <div className="text-[13px] mb-1" style={{ color: '#8e8e93' }}>Tvoje saldo</div>
          <div className="flex items-baseline justify-center gap-2">
            <span className={`text-[38px] font-bold tracking-tight ${balance > 0 ? 'text-[#30d158]' : balance < 0 ? 'text-[#ff3b30]' : 'text-white'}`}>
              {balance > 0 ? '+' : ''}{Math.abs(balance).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[20px] font-semibold" style={{ color: '#8e8e93' }}>EUR</span>
          </div>
          <div className="text-[12px] mt-1" style={{ color: '#8e8e93' }}>
            {balance > 0 ? 'Ostatní ti dlhujú' : balance < 0 ? 'Dlhuješ ostatným' : 'Vyrovnaný ✓'}
          </div>

          <button
            className="mt-3 mx-auto flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium"
            style={{ background: '#1c1c1e', color: '#0a84ff' }}
          >
            <Volume2 size={14} />
            Hlasové zhrnutie
          </button>
        </div>

        {/* Kto komu dlhuje — the key clarity section */}
        {debts.length > 0 && (
          <div className="mb-5">
            <div className="text-[15px] font-bold text-white mb-3">Kto komu dlhuje</div>
            <div className="space-y-2">
              {debts.map((d, i) => {
                const isMeDebtor = d.fromId === ME
                const isMeCreditor = d.toId === ME
                return (
                  <div key={i} className="rounded-2xl p-4" style={{ background: '#1c1c1e', border: (isMeDebtor || isMeCreditor) ? '1px solid #0a84ff33' : 'none' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0" style={{ background: d.fromColor }}>
                        {d.fromName.charAt(0)}
                      </div>
                      <span className="text-[14px] font-semibold text-white">
                        {isMeDebtor ? 'Ty' : d.fromName.split(' ')[0]}
                      </span>
                      <ArrowRight size={14} color="#8e8e93" />
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0" style={{ background: d.toColor }}>
                        {d.toName.charAt(0)}
                      </div>
                      <span className="text-[14px] font-semibold text-white flex-1">
                        {isMeCreditor ? 'Tebe' : d.toName.split(' ')[0]}
                      </span>
                      <span className={`text-[15px] font-mono font-semibold ${isMeDebtor ? 'text-[#ff3b30]' : isMeCreditor ? 'text-[#30d158]' : 'text-white'}`}>
                        {d.amount.toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                    {(isMeDebtor || isMeCreditor) && (
                      <button
                        onClick={() => handleSettle(d.fromId, d.toId, d.amount)}
                        className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white"
                        style={{ background: '#0a84ff' }}
                      >
                        {isMeDebtor ? `Vyrovnať · ${d.amount.toFixed(2).replace('.', ',')} €` : `Vyžiadať · ${d.amount.toFixed(2).replace('.', ',')} €`}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Members */}
        <div className="mb-5">
          <div className="text-[15px] font-bold text-white mb-3">Členovia</div>
          <div>
            {group.members.map((m, i) => (
              <div
                key={m.user.id}
                className="flex items-center gap-3 py-3"
                style={{ borderBottom: i < group.members.length - 1 ? '0.5px solid #38383a' : 'none' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0" style={{ background: m.user.avatarColor }}>
                  {m.user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-white">{m.user.id === ME ? 'Ty' : m.user.name}</span>
                    <RoleBadge role={m.role} />
                  </div>
                </div>
                <span className={`text-[14px] font-mono font-semibold ${m.balance > 0 ? 'text-[#30d158]' : m.balance < 0 ? 'text-[#ff3b30]' : 'text-[#8e8e93]'}`}>
                  {m.balance > 0 ? '+' : ''}{m.balance.toFixed(2).replace('.', ',')} €
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] font-bold text-white">Výdavky</span>
            <Link href={`/add-expense?groupId=${id}`}>
              <span className="text-[14px] flex items-center gap-1" style={{ color: '#0a84ff' }}>
                <Plus size={14} />Pridať
              </span>
            </Link>
          </div>
          {expenses.length > 0 ? (
            <div>
              {expenses.map((e, i) => (
                <div key={e.id} style={{ borderBottom: i < expenses.length - 1 ? '0.5px solid #38383a' : 'none' }}>
                  <ExpenseRow expense={e} currentUserId={ME} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="text-4xl mb-3">🤖</div>
              <div className="text-[15px] font-medium text-white mb-1">Žiadne výdavky</div>
              <div className="text-[13px]" style={{ color: '#8e8e93' }}>Pridaj prvý výdavok skupiny</div>
            </div>
          )}
        </div>
      </div>
    </TBShell>
  )
}
