'use client'

import { useState } from 'react'
import { Plus, TrendingDown, PiggyBank, Users, BarChart2, Download } from 'lucide-react'
import Link from 'next/link'
import type { Group, Expense } from '@/types'


const CAT_META: Record<string, { label: string; color: string; emoji: string }> = {
  food:          { label: 'Jedlo',     color: '#ff3b30', emoji: '🍽️' },
  groceries:     { label: 'Nákup',     color: '#ffd60a', emoji: '🛒' },
  transport:     { label: 'Doprava',   color: '#30d158', emoji: '🚗' },
  entertainment: { label: 'Zábava',    color: '#0a84ff', emoji: '🎮' },
  housing:       { label: 'Bývanie',   color: '#bf5af2', emoji: '🏠' },
  other:         { label: 'Ostatné',   color: '#ff9f0a', emoji: '💡' },
}

function catMeta(cat: string) {
  return CAT_META[cat] ?? { label: cat, color: '#8e8e93', emoji: '💰' }
}

export default function JointAccountView({
  group,
  expenses,
  currentUserId,
  onToast,
}: {
  group: Group
  expenses: Expense[]
  currentUserId: string
  onToast: (msg: string) => void
}) {
  const potBalance = group.potBalance ?? 0
  const contributions = group.members.map(m => ({
    userId: m.user.id,
    name: m.user.name,
    avatarColor: m.user.avatarColor,
    contributed: m.contributed ?? 0,
  }))
  const [showAllExpenses, setShowAllExpenses] = useState(false)

  const totalContributed = contributions.reduce((s, c) => s + c.contributed, 0)
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)

  const recentExpenses = showAllExpenses ? expenses : expenses.slice(0, 5)

  // top categories
  const catMap: Record<string, number> = {}
  for (const e of expenses) catMap[e.category] = (catMap[e.category] ?? 0) + e.amount
  const topCats = Object.entries(catMap)
    .map(([cat, amount]) => ({ cat, amount, pct: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0, ...catMeta(cat) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)

  const quickActions = [
    { label: 'Prispieť', icon: PiggyBank, action: () => onToast('Príspevok do fondu čoskoro') },
    { label: 'Zaplatiť', icon: TrendingDown, action: () => onToast('Platba z fondu čoskoro') },
    { label: 'Výdavky', icon: BarChart2, href: `/groups/${group.id}/report` },
    { label: 'Členovia', icon: Users, action: () => onToast('Správa členov čoskoro') },
  ]

  return (
    <div>
      {/* Pot balance */}
      <div className="text-center mb-6">
        <div className="text-[13px] mb-1.5" style={{ color: '#8e8e93' }}>Spoločný fond</div>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-[42px] font-bold tracking-tight leading-none text-[#30d158]">
            {potBalance.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[22px] font-semibold" style={{ color: '#8e8e93' }}>EUR</span>
        </div>
        <div className="text-[12px] mt-1.5" style={{ color: '#8e8e93' }}>
          Dostupný zostatok
        </div>
      </div>

      {/* Stats card */}
      <div className="rounded-2xl overflow-hidden flex mb-6" style={{ background: '#1c1c1e' }}>
        <div className="flex-1 px-4 py-3 text-center" style={{ borderRight: '0.5px solid #38383a' }}>
          <div className="text-[12px] mb-1" style={{ color: '#8e8e93' }}>Vložené</div>
          <div className="text-[15px] font-semibold text-[#30d158]">
            {totalContributed.toFixed(2).replace('.', ',')} €
          </div>
        </div>
        <div className="flex-1 px-4 py-3 text-center">
          <div className="text-[12px] mb-1" style={{ color: '#8e8e93' }}>Minuté</div>
          <div className="text-[15px] font-semibold text-[#ff3b30]">
            {totalSpent.toFixed(2).replace('.', ',')} €
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {quickActions.map(({ label, icon: Icon, href, action }) => {
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
            <Link key={label} href={href} className="flex flex-col items-center">{inner}</Link>
          ) : (
            <button key={label} onClick={action} className="flex flex-col items-center">{inner}</button>
          )
        })}
      </div>

      <div style={{ height: '0.5px', background: '#38383a', marginBottom: 20 }} />

      {/* Member contributions */}
      <div className="mb-6">
        <div className="text-[15px] font-bold text-white mb-3">Príspevky členov</div>
        <div>
          {contributions.map((c, i) => {
            const pct = totalContributed > 0 ? (c.contributed / totalContributed) * 100 : 0
            const isMe = c.userId === currentUserId
            return (
              <div key={c.userId} className="flex items-center gap-3 py-3"
                style={{ borderBottom: i < contributions.length - 1 ? '0.5px solid #38383a' : 'none' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                  style={{ background: c.avatarColor }}>
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[14px] font-medium text-white">{isMe ? 'Ty' : c.name.split(' ')[0]}</span>
                    <span className="text-[14px] font-mono font-semibold text-[#30d158]">
                      {c.contributed.toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full" style={{ background: '#2c2c2e' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: '#30d158' }} />
                    </div>
                    <span className="text-[11px] font-medium flex-shrink-0" style={{ color: '#8e8e93' }}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top categories */}
      {topCats.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] font-bold text-white">Kategórie výdavkov</span>
            <Link href={`/groups/${group.id}/report`}>
              <span className="text-[13px]" style={{ color: '#0a84ff' }}>Zobraziť všetky</span>
            </Link>
          </div>
          <div>
            {topCats.map((c, i) => (
              <div key={c.cat} className="flex items-center gap-3 py-3"
                style={{ borderBottom: i < topCats.length - 1 ? '0.5px solid #38383a' : 'none' }}>
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
                    <span className="text-[11px] font-medium flex-shrink-0" style={{ color: c.color }}>{c.pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent expenses from pot */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-bold text-white">Výdavky z fondu</span>
          <Link href={`/add-expense?groupId=${group.id}`}>
            <span className="text-[14px] flex items-center gap-1" style={{ color: '#0a84ff' }}>
              <Plus size={14} />Pridať
            </span>
          </Link>
        </div>
        {expenses.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-4xl mb-3">🤖</div>
            <div className="text-[15px] font-medium text-white mb-1">Žiadne výdavky</div>
            <div className="text-[13px]" style={{ color: '#8e8e93' }}>Pridaj prvý výdavok zo spoločného fondu</div>
          </div>
        ) : (
          <div>
            {recentExpenses.map((e, i) => {
              const meta = catMeta(e.category)
              return (
                <div key={e.id} className="flex items-center gap-3 py-3"
                  style={{ borderBottom: i < recentExpenses.length - 1 ? '0.5px solid #38383a' : 'none' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] flex-shrink-0"
                    style={{ background: meta.color + '22' }}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white truncate">{e.merchant}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: '#8e8e93' }}>{meta.label} · {e.date.slice(0, 10)}</div>
                  </div>
                  <span className="text-[14px] font-mono font-semibold text-[#ff3b30] flex-shrink-0">
                    – {e.amount.toFixed(2).replace('.', ',')} €
                  </span>
                </div>
              )
            })}
            {expenses.length > 5 && (
              <button
                onClick={() => setShowAllExpenses(v => !v)}
                className="w-full py-3 text-[14px] font-medium text-center mt-1"
                style={{ color: '#0a84ff' }}
              >
                {showAllExpenses ? 'Zobraziť menej' : `Zobraziť všetky (${expenses.length})`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
