'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TBShell from '@/components/TBShell'
import ExpenseRow from '@/components/ExpenseRow'
import JointAccountView from '@/components/JointAccountView'
import ManageMembersSheet from '@/components/ManageMembersSheet'
import { calculateDebts } from '@/lib/debt'
import { settleDebt } from '@/lib/api'
import {
  ChevronDown, BarChart2, Users, Plus, ArrowLeftRight,
  ArrowRight, Volume2, Download, Settings, Camera, KeyRound
} from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { useLang } from '@/lib/use-lang'
import type { Group, Expense } from '@/types'

export default function GroupsPage() {
  const { state } = useStore()
  const { t } = useLang()
  const ME = state.currentUser?.id ?? ''
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [groupLoading, setGroupLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [nudgedIds, setNudgedIds] = useState<Set<string>>(new Set())
  const [showAllDebts, setShowAllDebts] = useState(false)
  const [manageMembersOpen, setManageMembersOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pendingSettleRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    fetch('/api/groups')
      .then(r => r.json())
      .then((data: unknown) => {
        const list = Array.isArray(data) ? (data as Group[]) : []
        setGroups(list)
        if (list.length > 0) loadGroup(list[0].id, list[0])
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
    food:          { label: t.categories.food,         color: '#ff3b30', emoji: '🍽️' },
    groceries:     { label: t.categories.groceries,    color: '#ffd60a', emoji: '🛒' },
    transport:     { label: t.categories.transport,    color: '#30d158', emoji: '🚗' },
    entertainment: { label: t.categories.entertainment,color: '#0a84ff', emoji: '🎮' },
    housing:       { label: t.categories.housing,      color: '#bf5af2', emoji: '🏠' },
    other:         { label: t.categories.other,        color: '#ff9f0a', emoji: '💡' },
    settlement:    { label: t.categories.settlement,   color: '#30d158', emoji: '✅' },
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
    { label: t.groupsPage.scanBill, icon: Camera, href: selectedGroup ? `/scan-bill?groupId=${selectedGroup.id}` : '/scan-bill' },
    { label: t.groupsPage.addExpense, icon: Plus, href: selectedGroup ? `/add-expense?groupId=${selectedGroup.id}` : '/add-expense' },
    { label: t.groupsPage.expenseReport, icon: BarChart2, href: selectedGroup ? `/groups/${selectedGroup.id}/report` : '/groups' },
    { label: t.groupsPage.subscriptions, icon: KeyRound, href: selectedGroup ? `/groups/${selectedGroup.id}/subscriptions` : '/groups' },
    { label: t.groupsPage.settleDebts, icon: ArrowLeftRight, action: () => setToast(t.groupsPage.settleSoon) },
    { label: t.groupsPage.membersMgmt, icon: Users, action: () => setManageMembersOpen(true) },
    { label: t.groupsPage.voiceSummary, icon: Volume2, action: () => setToast(t.groupsPage.voiceSoon) },
  ] : [
    { label: t.groupsPage.expenseReport, icon: BarChart2, href: selectedGroup ? `/groups/${selectedGroup.id}/report` : '/groups' },
    { label: t.groupsPage.membersMgmt, icon: Users, action: () => setManageMembersOpen(true) },
    { label: t.groupsPage.addExpense, icon: Plus, href: selectedGroup ? `/add-expense?groupId=${selectedGroup.id}` : '/add-expense' },
    { label: t.groupsPage.subscriptions, icon: KeyRound, href: selectedGroup ? `/groups/${selectedGroup.id}/subscriptions` : '/groups' },
    { label: t.groupsPage.settleDebts, icon: ArrowLeftRight, action: () => setToast(t.groupsPage.settleSoon) },
    { label: t.groupsPage.exportAction, icon: Download, action: () => setToast(t.groupsPage.exportSoon) },
    { label: t.groupsPage.voiceSummary, icon: Volume2, action: () => setToast(t.groupsPage.voiceSoon) },
  ]

  const visibleActions = quickActions.slice(0, 4)
  const [showMoreActions, setShowMoreActions] = useState(false)

  if (loading) {
    return (
      <TBShell>
        <div className="p-8 text-center" style={{ color: '#8e8e93' }}>{t.common.loading}</div>
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
            {t.groupsPage.headerTitle}
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
            <div className="text-[17px] font-bold text-white mb-2">{t.groupsPage.emptyTitle}</div>
            <div className="text-[14px] mb-6" style={{ color: '#8e8e93' }}>
              {t.groupsPage.emptySubtitle}
            </div>
            <Link href="/groups/new">
              <button className="px-6 py-3 rounded-2xl font-semibold text-[15px] text-white"
                style={{ background: '#0a84ff' }}>
                {t.groupsPage.emptyCta}
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
                  <div className="text-[17px] font-semibold text-white text-center mb-4">{t.groupsPage.pickGroup}</div>
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
                          <div className="text-[12px]" style={{ color: '#8e8e93' }}>{t.membersCount(g.members.length)}</div>
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
              <div className="py-6 text-center" style={{ color: '#8e8e93' }}>{t.common.loadingGroup}</div>
            )}

            {!groupLoading && selectedGroup && selectedGroup.type !== 'peers' && (
              <JointAccountView
                group={selectedGroup}
                expenses={expenses}
                currentUserId={ME}
                onToast={setToast}
                onManageMembers={() => setManageMembersOpen(true)}
              />
            )}

            {!groupLoading && selectedGroup && selectedGroup.type === 'peers' && (
              <>
                {/* Hero — only show balance if non-zero, else show group total */}
                {balance !== 0 ? (
                  <div className="text-center mb-5">
                    <div className="text-[13px] mb-1.5" style={{ color: '#8e8e93' }}>
                      {balance > 0 ? t.groupsPage.owedToYou : t.groupsPage.youOwe}
                    </div>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className={`text-[42px] font-bold tracking-tight leading-none ${balance > 0 ? 'text-[#30d158]' : 'text-[#ff3b30]'}`}>
                        {balance > 0 ? '+' : '–'}{Math.abs(balance).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[22px] font-semibold" style={{ color: '#8e8e93' }}>EUR</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center mb-5">
                    <div className="text-[13px] mb-1" style={{ color: '#8e8e93' }}>{t.groupsPage.groupSpentTotal}</div>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-[38px] font-bold tracking-tight leading-none text-white">
                        {totalExpenses.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[20px] font-semibold" style={{ color: '#8e8e93' }}>EUR</span>
                    </div>
                    <div className="text-[12px] mt-1" style={{ color: '#30d158' }}>{t.groupsPage.allSettledShort}</div>
                  </div>
                )}

                {/* Compact 2-stat strip — only when there's something to show */}
                {totalExpenses > 0 && balance !== 0 && (
                  <div className="flex gap-3 mb-5">
                    <div className="flex-1 rounded-2xl px-4 py-3 text-center" style={{ background: '#1c1c1e' }}>
                      <div className="text-[11px] mb-1" style={{ color: '#8e8e93' }}>{t.groupsPage.groupSpent}</div>
                      <div className="text-[15px] font-semibold font-mono text-white">
                        {totalExpenses.toFixed(2).replace('.', ',')} €
                      </div>
                    </div>
                    <div className="flex-1 rounded-2xl px-4 py-3 text-center" style={{ background: '#1c1c1e' }}>
                      <div className="text-[11px] mb-1" style={{ color: '#8e8e93' }}>{t.groupsPage.myShare}</div>
                      <div className="text-[15px] font-semibold font-mono text-white">
                        {(totalExpenses / (selectedGroup.members.length || 1)).toFixed(2).replace('.', ',')} €
                      </div>
                    </div>
                  </div>
                )}

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
                    {showMoreActions ? t.groupsPage.fewerOptions : t.groupsPage.moreOptions}
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
                    <div className="text-[13px] font-bold mb-1" style={{ color: '#bf5af2' }}>{t.groupsPage.tempGroup}</div>
                    <div className="text-[12px] mb-3" style={{ color: '#8e8e93' }}>
                      {t.groupsPage.tempGroupHint}
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
                                  <span className="text-[12px] text-white">{m.user.id === ME ? t.common.you : m.user.name.split(' ')[0]}</span>
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
                        setToast(t.groupsPage.tripSettled)
                      }}
                      className="w-full py-3 rounded-xl text-[13px] font-semibold text-white"
                      style={{ background: '#bf5af2' }}
                    >
                      {t.groupsPage.tempGroupCta}
                    </button>
                  </div>
                )}

                {/* Debts — only for non-temporary friends groups */}
                {!selectedGroup.isTemporary && debts.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[15px] font-bold text-white">{t.groupsPage.debts}</span>
                      {debts.length > 2 && (
                        <button onClick={() => setShowAllDebts(v => !v)} className="text-[13px]" style={{ color: '#0a84ff' }}>
                          {showAllDebts ? t.common.showLess : t.groupsPage.showAllDebts(debts.length)}
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {(showAllDebts ? debts : debts.slice(0, 2)).map((d) => {
                        const isMeDebtor = d.fromId === ME
                        const isMeCreditor = d.toId === ME
                        const nudged = nudgedIds.has(d.fromId)
                        const relatedExpenses = expenses.filter(e =>
                          e.paidBy === d.toId &&
                          e.category !== 'settlement' &&
                          e.splits.some(s => s.userId === d.fromId && !s.settled)
                        )
                        const expenseLabel = relatedExpenses.length > 0
                          ? relatedExpenses.map(e => e.merchant).join(', ')
                          : t.groupsPage.expenseUnsettled
                        return (
                          <motion.div key={`${d.fromId}-${d.toId}`} className="rounded-2xl p-4"
                            initial={{ opacity: 0, scale: 0.94, y: 6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                            style={{ background: '#1c1c1e', border: (isMeDebtor || isMeCreditor) ? `1px solid ${isMeDebtor ? '#ff3b3033' : '#30d15833'}` : 'none' }}>
                            {/* Avatars + names */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="relative flex-shrink-0 w-9 h-9">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
                                  style={{ background: d.fromColor }}>
                                  {d.fromName.charAt(0)}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                  style={{ background: d.toColor, border: '1.5px solid #1c1c1e' }}>
                                  {d.toName.charAt(0)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[14px] font-semibold text-white">
                                  {isMeDebtor ? t.groupsPage.debtsMeSubject : d.fromName.split(' ')[0]}
                                  <span className="font-normal mx-1.5" style={{ color: '#8e8e93' }}>{t.groupsPage.debtsConnector}</span>
                                  {isMeCreditor ? t.groupsPage.debtsMeObject : d.toName.split(' ')[0]}
                                </div>
                                <div className="text-[11px] mt-0.5 truncate" style={{ color: '#8e8e93' }}>
                                  {relatedExpenses.length > 0
                                    ? `${t.groupsPage.expenseCount(relatedExpenses.length)}: ${expenseLabel}`
                                    : t.groupsPage.expenseUnsettled}
                                </div>
                              </div>
                              <span className={`text-[20px] font-mono font-bold flex-shrink-0 ${isMeDebtor ? 'text-[#ff3b30]' : isMeCreditor ? 'text-[#30d158]' : 'text-white'}`}>
                                {d.amount.toFixed(2).replace('.', ',')} €
                              </span>
                            </div>
                            {/* Expense chips */}
                            {relatedExpenses.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {relatedExpenses.map(e => (
                                  <span key={e.id} className="px-2 py-0.5 rounded-full text-[11px]"
                                    style={{ background: '#2c2c2e', color: '#8e8e93' }}>
                                    {CAT_META[e.category]?.emoji ?? '💳'} {e.merchant} · {e.splits.find(s => s.userId === d.fromId)?.amount.toFixed(2).replace('.', ',')} €
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Action button */}
                            <button
                              disabled={nudged}
                              onClick={async () => {
                                const key = d.fromId
                                if (pendingSettleRef.current.has(key)) return
                                if (isMeDebtor) {
                                  // Instant settle — I'm paying now
                                  await settleDebt(selectedGroup.id, d.fromId, d.toId)
                                  await fetch(`/api/groups/${selectedGroup.id}/expenses`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      amount: d.amount,
                                      paidBy: d.fromId,
                                      merchant: `${t.settlementPrefix}: ${d.fromName.split(' ')[0]} → ${d.toName.split(' ')[0]}`,
                                      date: new Date().toISOString().slice(0, 10),
                                      isPersonal: false,
                                      category: 'settlement',
                                      splits: [
                                        { userId: d.fromId, amount: d.amount, settled: true },
                                        { userId: d.toId, amount: 0, settled: true },
                                      ],
                                    }),
                                  })
                                  await loadGroup(selectedGroup.id)
                                  setToast(t.groupsPage.debtSettled(d.amount.toFixed(2).replace('.', ',')))
                                } else {
                                  // Nudge — remind them, auto-settle after delay
                                  setNudgedIds(prev => new Set(prev).add(key))
                                  setToast(t.groupsPage.reminderSent(d.fromName.split(' ')[0]))
                                  const delay = 5000 + Math.random() * 10000
                                  const timer = setTimeout(async () => {
                                    pendingSettleRef.current.delete(key)
                                    await settleDebt(selectedGroup.id, d.fromId, d.toId)
                                    await fetch(`/api/groups/${selectedGroup.id}/expenses`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        amount: d.amount,
                                        paidBy: d.fromId,
                                        merchant: `${t.settlementPrefix}: ${d.fromName.split(' ')[0]} → ${d.toName.split(' ')[0]}`,
                                        date: new Date().toISOString().slice(0, 10),
                                        isPersonal: false,
                                        category: 'settlement',
                                        splits: [
                                          { userId: d.fromId, amount: d.amount, settled: true },
                                          { userId: d.toId, amount: 0, settled: true },
                                        ],
                                      }),
                                    })
                                    await loadGroup(selectedGroup.id)
                                    setToast(t.groupsPage.personPaid(d.fromName.split(' ')[0], d.amount.toFixed(2).replace('.', ',')))
                                  }, delay)
                                  pendingSettleRef.current.set(key, timer)
                                }
                              }}
                              className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                              style={nudged
                                ? { background: '#2c2c2e', color: '#8e8e93', border: '1px solid #38383a' }
                                : isMeDebtor
                                  ? { background: '#0a84ff', color: '#fff' }
                                  : { background: '#ff9f0a22', color: '#ff9f0a', border: '1px solid #ff9f0a44' }}>
                              {nudged
                                ? t.groupsPage.awaitingPayment
                                : isMeDebtor
                                  ? t.groupsPage.settleAmount(d.amount.toFixed(2).replace('.', ','))
                                  : <><span className="bell-shake inline-block mr-1">🔔</span>{t.groupsPage.remind}</>}
                            </button>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Top Categories */}
                {topCategories.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[15px] font-bold text-white">{t.groupsPage.topCategories}</span>
                      <Link href={`/groups/${selectedGroup.id}/report`}>
                        <span className="text-[13px]" style={{ color: '#0a84ff' }}>{t.common.showAll}</span>
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
                    <span className="text-[15px] font-bold text-white">{t.groupsPage.expenses}</span>
                    <Link href={`/add-expense?groupId=${selectedGroup.id}`}>
                      <span className="text-[14px] flex items-center gap-1" style={{ color: '#0a84ff' }}>
                        <Plus size={14} />{t.common.add}
                      </span>
                    </Link>
                  </div>
                  {expenses.length > 0 ? (
                    <div>
                      {expenses.map((e, i) => (
                        <motion.div key={e.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.28, delay: i * 0.05, ease: 'easeOut' }}
                          style={{ borderBottom: i < expenses.length - 1 ? '0.5px solid #38383a' : 'none' }}>
                          <ExpenseRow expense={e} currentUserId={ME} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <div className="text-4xl mb-3">🤖</div>
                      <div className="text-[15px] font-medium text-white mb-1">{t.common.noExpenses}</div>
                      <div className="text-[13px]" style={{ color: '#8e8e93' }}>{t.groupsPage.noExpensesHint}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {manageMembersOpen && selectedGroup && (
        <ManageMembersSheet
          group={selectedGroup}
          currentUserId={ME}
          onClose={() => setManageMembersOpen(false)}
          onChange={async () => { await loadGroup(selectedGroup.id) }}
          onToast={setToast}
        />
      )}
    </TBShell>
  )
}

