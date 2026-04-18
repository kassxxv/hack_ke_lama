'use client'

import { useState, useEffect } from 'react'
import TBShell from '@/components/TBShell'
import ExpenseRow from '@/components/ExpenseRow'
import JointAccountView from '@/components/JointAccountView'
import { calculateDebts } from '@/lib/debt'
import { settleDebt } from '@/lib/api'
import {
  ChevronDown, BarChart2, Users, Plus, ArrowLeftRight,
  ArrowRight, Volume2, Download, Settings, Camera
} from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import type { Group, Expense } from '@/types'

export default function GroupsPage() {
  const { state } = useStore()
  const ME = state.currentUser?.id ?? ''
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [groupLoading, setGroupLoading] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/groups')
      .then(r => r.json())
      .then((data: Group[]) => {
        setGroups(data)
        if (data.length > 0) loadGroup(data[0].id, data[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function loadGroup(id: string, fallback?: Group) {
    setGroupLoading(true)
    try {
      const data = await fetch(`/api/groups/${id}`).then(r => r.json())
      setSelectedGroup(data.group ?? fallback ?? null)
      setExpenses(data.expenses ?? [])
    } catch { /* keep */ }
    finally { setGroupLoading(false) }
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2000)
    return () => clearTimeout(t)
  }, [toast])


  const me = selectedGroup?.members.find(m => m.user.id === ME)
  const balance = me?.balance ?? 0
  const debts = selectedGroup ? calculateDebts(selectedGroup.members) : []
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const settledAmount = expenses.reduce((s, e) => {
    const allSettled = e.splits.every(sp => sp.settled)
    return s + (allSettled ? e.amount : 0)
  }, 0)
  const settledPct = totalExpenses > 0 ? (settledAmount / totalExpenses) * 100 : 0

  const CAT_META: Record<string, { label: string; color: string; emoji: string }> = {
    food:          { label: 'Jedlo',     color: '#ff3b30', emoji: '🍽️' },
    groceries:     { label: 'Nákup',     color: '#ffd60a', emoji: '🛒' },
    transport:     { label: 'Doprava',   color: '#30d158', emoji: '🚗' },
    entertainment: { label: 'Zábava',    color: '#0a84ff', emoji: '🎮' },
    housing:       { label: 'Bývanie',   color: '#bf5af2', emoji: '🏠' },
    other:         { label: 'Ostatné',   color: '#ff9f0a', emoji: '💡' },
  }
  const catMap: Record<string, number> = {}
  for (const e of expenses) catMap[e.category] = (catMap[e.category] ?? 0) + e.amount
  const topCategories = Object.entries(catMap)
    .map(([cat, amount]) => ({
      cat, amount,
      pct: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      ...(CAT_META[cat] ?? { label: cat, color: '#8e8e93', emoji: '💰' }),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4)

  const isPeers = selectedGroup?.type === 'peers'
  const quickActions: Array<{ label: string; icon: React.ElementType; href?: string; action?: () => void }> = isPeers ? [
    { label: 'Skenovať účet', icon: Camera, href: selectedGroup ? `/scan-bill?groupId=${selectedGroup.id}` : '/scan-bill' },
    { label: 'Pridať výdavok', icon: Plus, href: selectedGroup ? `/add-expense?groupId=${selectedGroup.id}` : '/add-expense' },
    { label: 'Správa výdavkov', icon: BarChart2, href: selectedGroup ? `/groups/${selectedGroup.id}/report` : '/groups' },
    { label: 'Vyrovnať dlhy', icon: ArrowLeftRight, action: () => setToast('Vyrovnanie dlhov čoskoro') },
    { label: 'Správa členov', icon: Users, action: () => setToast('Správa členov čoskoro') },
    { label: 'Hlasové zhrnutie', icon: Volume2, action: () => setToast('Hlasové zhrnutie čoskoro') },
  ] : [
    { label: 'Správa výdavkov', icon: BarChart2, href: selectedGroup ? `/groups/${selectedGroup.id}/report` : '/groups' },
    { label: 'Správa členov', icon: Users, action: () => setToast('Správa členov čoskoro') },
    { label: 'Pridať výdavok', icon: Plus, href: selectedGroup ? `/add-expense?groupId=${selectedGroup.id}` : '/add-expense' },
    { label: 'Vyrovnať dlhy', icon: ArrowLeftRight, action: () => setToast('Vyrovnanie dlhov čoskoro') },
    { label: 'Exportovať', icon: Download, action: () => setToast('Export čoskoro') },
    { label: 'Hlasové zhrnutie', icon: Volume2, action: () => setToast('Hlasové zhrnutie čoskoro') },
  ]

  const visibleActions = quickActions.slice(0, 4)
  const [showMoreActions, setShowMoreActions] = useState(false)

  if (loading) {
    return (
      <TBShell>
        <div className="p-8 text-center" style={{ color: '#8e8e93' }}>Načítavam...</div>
      </TBShell>
    )
  }

  return (
    <TBShell>
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-white z-50"
          style={{ background: '#1c1c1e', border: '1px solid #38383a' }}>
          {toast}
        </div>
      )}

      <div className="px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[20px] font-bold text-white">
            {selectedGroup ? `${selectedGroup.emoji} ${selectedGroup.name}` : 'Spoločné výdavky'}
          </h1>
          <Link href="/groups/new"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#0a84ff' }}>
            <Plus size={18} color="#fff" strokeWidth={2.5} />
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <div className="text-[17px] font-bold text-white mb-2">Žiadne skupiny</div>
            <div className="text-[14px] mb-6" style={{ color: '#8e8e93' }}>
              Vytvor svoju prvú skupinu a začni deliť výdavky
            </div>
            <Link href="/groups/new">
              <button className="px-6 py-3 rounded-2xl font-semibold text-[15px] text-white"
                style={{ background: '#0a84ff' }}>
                Vytvoriť skupinu
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Group Selector */}
            <div className="relative mb-6">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center justify-center gap-1.5 w-full py-1"
              >
                <span className="text-[14px] font-medium" style={{ color: '#8e8e93' }}>
                  {selectedGroup?.emoji} {selectedGroup?.name}
                </span>
                <ChevronDown
                  size={14}
                  color="#8e8e93"
                  strokeWidth={2.2}
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                />
              </button>
            </div>

            {/* Group picker bottom sheet */}
            {dropdownOpen && (
              <div
                className="fixed inset-0 z-[200] flex items-end justify-center"
                style={{ background: 'rgba(0,0,0,0.5)' }}
                onClick={() => setDropdownOpen(false)}
              >
                <div
                  className="w-full max-w-[430px] rounded-t-3xl pb-8 overflow-y-auto max-h-[70vh]"
                  style={{ background: '#1c1c1e' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-center pt-3 pb-4">
                    <div className="w-10 h-1 rounded-full" style={{ background: '#38383a' }} />
                  </div>
                  <div className="text-[17px] font-semibold text-white text-center mb-4">Vyberte skupinu</div>
                  <div>
                    {groups.map((g, i) => (
                      <button
                        key={g.id}
                        onClick={() => { loadGroup(g.id, g); setDropdownOpen(false) }}
                        className="flex items-center gap-3 w-full px-5 py-3 text-left"
                        style={{ borderTop: i > 0 ? '0.5px solid #38383a' : 'none' }}
                      >
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-[20px] flex-shrink-0"
                          style={{ background: '#2c2c2e' }}>
                          {g.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-semibold text-white">{g.name}</div>
                          <div className="text-[12px]" style={{ color: '#8e8e93' }}>{g.members.length} členov</div>
                        </div>
                        {g.potBalance != null && g.potBalance > 0 && (
                          <div className="text-[15px] font-semibold text-[#30d158] flex-shrink-0">
                            {g.potBalance.toFixed(2).replace('.', ',')} EUR
                          </div>
                        )}
                        {selectedGroup?.id === g.id && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0 ml-2" style={{ background: '#0a84ff' }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {groupLoading && (
              <div className="py-6 text-center" style={{ color: '#8e8e93' }}>Načítavam skupinu...</div>
            )}

            {!groupLoading && selectedGroup && selectedGroup.type !== 'peers' && (
              <JointAccountView
                group={selectedGroup}
                expenses={expenses}
                currentUserId={ME}
                onToast={setToast}
              />
            )}

            {!groupLoading && selectedGroup && selectedGroup.type === 'peers' && (
              <>
                {/* Balance */}
                <div className="text-center mb-6">
                  <div className="text-[13px] mb-1.5" style={{ color: '#8e8e93' }}>Tvoje saldo</div>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className={`text-[42px] font-bold tracking-tight leading-none
                      ${balance > 0 ? 'text-[#30d158]' : balance < 0 ? 'text-[#ff3b30]' : 'text-white'}`}>
                      {balance > 0 ? '+' : ''}{Math.abs(balance).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[22px] font-semibold" style={{ color: '#8e8e93' }}>EUR</span>
                  </div>
                  <div className="text-[12px] mt-1.5" style={{ color: '#8e8e93' }}>
                    {balance > 0 ? 'Ostatní ti dlhujú' : balance < 0 ? 'Dlhuješ ostatným' : 'Vyrovnaný ✓'}
                  </div>
                </div>

                {/* Stats bars */}
                <div className="rounded-2xl p-4 mb-6" style={{ background: '#1c1c1e' }}>
                  <StatBar
                    label="Celkové výdavky"
                    value={`${totalExpenses.toFixed(2).replace('.', ',')} EUR`}
                    pct={100}
                    color="#0a84ff"
                  />
                  <div style={{ height: '0.5px', background: '#38383a', margin: '10px 0' }} />
                  <StatBar
                    label="Vyrovnané"
                    value={`${settledAmount.toFixed(2).replace('.', ',')} EUR`}
                    pct={settledPct}
                    color="#8e8e93"
                  />
                  <div style={{ height: '0.5px', background: '#38383a', margin: '10px 0' }} />
                  <StatBar
                    label="Zostatok"
                    value={`${balance > 0 ? '+' : ''}${balance.toFixed(2).replace('.', ',')} EUR`}
                    pct={Math.min(Math.abs(balance) / (totalExpenses || 1) * 100, 100)}
                    color={balance >= 0 ? '#30d158' : '#ff3b30'}
                    valueColor={balance > 0 ? '#30d158' : balance < 0 ? '#ff3b30' : '#ffffff'}
                  />
                </div>

                {/* Quick Actions */}
                <div className="mb-6">
                  <div className="grid grid-cols-4 gap-3">
                    {(showMoreActions ? quickActions : visibleActions).map(({ label, icon: Icon, href, action }) => {
                      const inner = (
                        <>
                          <div className="w-full rounded-2xl flex items-center justify-center mb-2"
                            style={{ background: '#1c1c1e', aspectRatio: '1', maxWidth: 68, margin: '0 auto 8px' }}>
                            <Icon size={24} color="#0a84ff" strokeWidth={1.8} />
                          </div>
                          <span className="text-[11px] text-white text-center leading-tight">{label}</span>
                        </>
                      )
                      return href ? (
                        <Link key={label} href={href} className="flex flex-col items-center">
                          {inner}
                        </Link>
                      ) : (
                        <button key={label} onClick={action} className="flex flex-col items-center">
                          {inner}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setShowMoreActions(v => !v)}
                    className="flex items-center gap-1.5 mx-auto mt-4 text-[14px] font-medium"
                    style={{ color: '#0a84ff' }}
                  >
                    {showMoreActions ? 'Menej možností' : 'Viac možností'}
                    <ChevronDown
                      size={14}
                      color="#0a84ff"
                      strokeWidth={2.2}
                      style={{ transform: showMoreActions ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                    />
                  </button>
                </div>

                {/* Divider */}
                <div style={{ height: '0.5px', background: '#38383a', marginBottom: 20 }} />

                {/* Trip finalize banner */}
                {selectedGroup.isTemporary && (
                  <div className="rounded-2xl p-4 mb-6" style={{ background: '#2c1f3a', border: '1px solid #bf5af233' }}>
                    <div className="text-[13px] font-bold mb-1" style={{ color: '#bf5af2' }}>✈️ Dočasná skupina</div>
                    <div className="text-[12px] mb-3" style={{ color: '#8e8e93' }}>
                      Keď je výlet hotový, finalizuj skupinu — vyrovná všetky zostatky naraz.
                    </div>
                    {/* Contribution % per member */}
                    {totalExpenses > 0 && (
                      <div className="space-y-2 mb-3">
                        {selectedGroup.members.map(m => {
                          const paid = expenses
                            .filter(e => e.paidBy === m.user.id)
                            .reduce((s, e) => s + e.amount, 0)
                          const pct = Math.round((paid / totalExpenses) * 100)
                          const fairShare = totalExpenses / selectedGroup.members.length
                          const diff = paid - fairShare
                          return (
                            <div key={m.user.id} className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                                style={{ background: m.user.avatarColor }}>
                                {m.user.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-[12px] text-white">{m.user.id === ME ? 'Ty' : m.user.name.split(' ')[0]}</span>
                                  <span className="text-[12px] font-mono" style={{ color: diff >= 0 ? '#30d158' : '#ff3b30' }}>
                                    {diff >= 0 ? '+' : ''}{diff.toFixed(2).replace('.', ',')} €
                                  </span>
                                </div>
                                <div className="h-1 rounded-full w-full" style={{ background: '#38383a' }}>
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.user.avatarColor }} />
                                </div>
                              </div>
                              <span className="text-[11px] w-8 text-right flex-shrink-0" style={{ color: '#8e8e93' }}>{pct}%</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        for (const d of debts) {
                          await settleDebt(selectedGroup.id, d.fromId, d.toId)
                        }
                        await loadGroup(selectedGroup.id)
                        setToast('Výlet vyrovnaný ✓')
                      }}
                      className="w-full py-3 rounded-xl text-[13px] font-semibold text-white"
                      style={{ background: '#bf5af2' }}
                    >
                      Finalizovať výlet · Vyrovnať všetko
                    </button>
                  </div>
                )}

                {/* Debts — only for non-temporary friends groups */}
                {!selectedGroup.isTemporary && debts.length > 0 && (
                  <div className="mb-6">
                    <div className="text-[15px] font-bold text-white mb-3">Kto komu dlhuje</div>
                    <div className="space-y-2">
                      {debts.map((d, i) => {
                        const isMeDebtor = d.fromId === ME
                        const isMeCreditor = d.toId === ME
                        return (
                          <div key={i} className="rounded-2xl p-4"
                            style={{ background: '#1c1c1e', border: (isMeDebtor || isMeCreditor) ? '1px solid #0a84ff33' : 'none' }}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                                style={{ background: d.fromColor }}>
                                {d.fromName.charAt(0)}
                              </div>
                              <span className="text-[14px] font-semibold text-white">
                                {isMeDebtor ? 'Ty' : d.fromName.split(' ')[0]}
                              </span>
                              <ArrowRight size={14} color="#8e8e93" />
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                                style={{ background: d.toColor }}>
                                {d.toName.charAt(0)}
                              </div>
                              <span className="text-[14px] font-semibold text-white flex-1">
                                {isMeCreditor ? 'Tebe' : d.toName.split(' ')[0]}
                              </span>
                              <span className={`text-[15px] font-mono font-semibold
                                ${isMeDebtor ? 'text-[#ff3b30]' : isMeCreditor ? 'text-[#30d158]' : 'text-white'}`}>
                                {d.amount.toFixed(2).replace('.', ',')} €
                              </span>
                            </div>
                            {(isMeDebtor || isMeCreditor) && (
                              <button
                                onClick={async () => {
                                  await settleDebt(selectedGroup.id, d.fromId, d.toId)
                                  await loadGroup(selectedGroup.id)
                                  setToast('Dlh vyrovnaný ✓')
                                }}
                                className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white"
                                style={{ background: '#0a84ff' }}>
                                {isMeDebtor
                                  ? `Vyrovnať · ${d.amount.toFixed(2).replace('.', ',')} €`
                                  : `Vyžiadať · ${d.amount.toFixed(2).replace('.', ',')} €`}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Top Categories */}
                {topCategories.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[15px] font-bold text-white">Najčastejšie kategórie</span>
                      <Link href={`/groups/${selectedGroup.id}/report`}>
                        <span className="text-[13px]" style={{ color: '#0a84ff' }}>Zobraziť všetky</span>
                      </Link>
                    </div>
                    <div>
                      {topCategories.map((c, i) => (
                        <div key={c.cat} className="flex items-center gap-3 py-3"
                          style={{ borderBottom: i < topCategories.length - 1 ? '0.5px solid #38383a' : 'none' }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] flex-shrink-0"
                            style={{ background: c.color + '22' }}>
                            {c.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[14px] font-medium text-white">{c.label}</span>
                              <span className="text-[14px] font-mono font-semibold text-[#ff3b30]">
                                – {c.amount.toFixed(2).replace('.', ',')} €
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 rounded-full" style={{ background: '#2c2c2e' }}>
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${c.pct}%`, background: c.color }} />
                              </div>
                              <span className="text-[11px] font-medium flex-shrink-0" style={{ color: c.color }}>
                                {c.pct}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expenses */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[15px] font-bold text-white">Výdavky</span>
                    <Link href={`/add-expense?groupId=${selectedGroup.id}`}>
                      <span className="text-[14px] flex items-center gap-1" style={{ color: '#0a84ff' }}>
                        <Plus size={14} />Pridať
                      </span>
                    </Link>
                  </div>
                  {expenses.length > 0 ? (
                    <div>
                      {expenses.map((e, i) => (
                        <div key={e.id}
                          style={{ borderBottom: i < expenses.length - 1 ? '0.5px solid #38383a' : 'none' }}>
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
              </>
            )}
          </>
        )}
      </div>
    </TBShell>
  )
}

function StatBar({
  label, value, pct, color, valueColor
}: {
  label: string
  value: string
  pct: number
  color: string
  valueColor?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px]" style={{ color: '#8e8e93' }}>{label}</span>
        <span className="text-[14px] font-semibold font-mono" style={{ color: valueColor ?? '#ffffff' }}>{value}</span>
      </div>
      <div className="h-1 rounded-full w-full" style={{ background: '#2c2c2e' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, background: color }}
        />
      </div>
    </div>
  )
}
