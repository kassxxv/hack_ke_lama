'use client'

import { use, useEffect, useState, useRef } from 'react'
import TBShell from '@/components/TBShell'
import { ChevronLeft, ChevronDown, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import type { Expense } from '@/types'

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
  food:          { label: 'Jedlo',        color: '#ff3b30', emoji: '🍽️' },
  groceries:     { label: 'Nákup',        color: '#ffd60a', emoji: '🛒' },
  transport:     { label: 'Doprava',      color: '#30d158', emoji: '🎮' },
  entertainment: { label: 'Zábava',       color: '#0a84ff', emoji: '📱' },
  housing:       { label: 'Bývanie',      color: '#bf5af2', emoji: '🏠' },
  other:         { label: 'Ostatné',      color: '#ff9f0a', emoji: '💡' },
}

function categoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { label: cat, color: '#8e8e93', emoji: '💰' }
}

type MonthKey = string // 'YYYY-MM'

function toMonthKey(date: string): MonthKey {
  return date.slice(0, 7)
}

function monthLabel(key: MonthKey): string {
  const [y, m] = key.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
  return `${months[parseInt(m) - 1]} ${y}`
}

function fullMonthLabel(key: MonthKey): string {
  const [y, m] = key.split('-')
  const months = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December']
  return `${months[parseInt(m) - 1]} ${y}`
}

// SVG donut chart
function DonutChart({ segments }: { segments: { pct: number; color: string; label: string; emoji: string }[] }) {
  const R = 90
  const STROKE = 40
  const CX = 140
  const CY = 140
  const circumference = 2 * Math.PI * R

  let cumPct = 0
  const arcs = segments.map(s => {
    const start = cumPct
    cumPct += s.pct
    return { ...s, start, end: cumPct }
  })

  function polarToCart(pct: number, r: number) {
    const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
  }

  return (
    <div className="relative flex items-center justify-center" style={{ height: 300 }}>
      <svg width={280} height={280} viewBox="0 0 280 280">
        {arcs.map((arc, i) => {
          const startDash = (arc.start / 100) * circumference
          const segDash = (arc.pct / 100) * circumference
          return (
            <circle
              key={i}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={`${segDash} ${circumference - segDash}`}
              strokeDashoffset={-startDash + circumference * 0.25}
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          )
        })}
        {/* inner black hole */}
        <circle cx={CX} cy={CY} r={R - STROKE / 2 - 2} fill="#000000" />
      </svg>

      {/* floating category labels */}
      {arcs.map((arc, i) => {
        const midPct = arc.start + arc.pct / 2
        const labelR = R + STROKE / 2 + 36
        const pos = polarToCart(midPct, labelR)
        const pxFromCenter = pos.x - CX
        const pyFromCenter = pos.y - CY
        const isLeft = pxFromCenter < 0

        return (
          <div
            key={i}
            className="absolute flex items-center gap-1.5 pointer-events-none"
            style={{
              left: pos.x + (isLeft ? -72 : 8),
              top: pos.y - 12,
              minWidth: 60,
            }}
          >
            {isLeft ? (
              <>
                <span className="text-[13px] font-semibold" style={{ color: arc.color }}>{arc.pct}%</span>
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[14px] flex-shrink-0"
                  style={{ background: arc.color + '33' }}>
                  {arc.emoji}
                </span>
              </>
            ) : (
              <>
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[14px] flex-shrink-0"
                  style={{ background: arc.color + '33' }}>
                  {arc.emoji}
                </span>
                <span className="text-[13px] font-semibold" style={{ color: arc.color }}>{arc.pct}%</span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function SpendingReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>('')
  const [monthDropOpen, setMonthDropOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'categories' | 'transactions'>('categories')
  const monthScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/groups/${id}`)
      .then(r => r.json())
      .then(data => {
        const exps: Expense[] = data.expenses ?? []
        setExpenses(exps)
        // pick latest month
        const months = [...new Set(exps.map(e => toMonthKey(e.date)))].sort()
        if (months.length > 0) setSelectedMonth(months[months.length - 1])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const allMonths = [...new Set(expenses.map(e => toMonthKey(e.date)))].sort()
  if (allMonths.length === 0) {
    // default to current month
    const now = new Date()
    allMonths.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthExpenses = expenses.filter(e => toMonthKey(e.date) === selectedMonth)

  // categorize
  const catMap: Record<string, number> = {}
  for (const e of monthExpenses) {
    catMap[e.category] = (catMap[e.category] ?? 0) + e.amount
  }
  const totalSpending = Object.values(catMap).reduce((s, v) => s + v, 0)

  const catRows = Object.entries(catMap)
    .map(([cat, amount]) => ({
      cat,
      amount,
      pct: totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0,
      ...categoryMeta(cat),
    }))
    .sort((a, b) => b.amount - a.amount)

  // donut segments (normalize to sum=100)
  const segments = catRows.map(r => ({
    pct: r.pct,
    color: r.color,
    label: r.label,
    emoji: r.emoji,
  }))

  // scroll selected month into view
  useEffect(() => {
    if (!monthScrollRef.current || !selectedMonth) return
    const btn = monthScrollRef.current.querySelector(`[data-month="${selectedMonth}"]`)
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedMonth])

  if (loading) {
    return (
      <TBShell>
        <div className="p-8 text-center" style={{ color: '#8e8e93' }}>Načítavam...</div>
      </TBShell>
    )
  }

  return (
    <TBShell>
      <div style={{ paddingBottom: 32 }}>
        {/* Header */}
        <div className="flex items-center px-4 pt-3 mb-4">
          <Link href="/groups" className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
          </Link>
          <h1 className="text-[17px] font-semibold text-white flex-1 text-center">Správa výdavkov</h1>
          <button className="w-8 h-8 flex items-center justify-center">
            <MoreVertical size={20} color="#8e8e93" />
          </button>
        </div>

        {/* Month title + dropdown */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button onClick={() => setMonthDropOpen(v => !v)} className="flex items-center gap-2">
            <span className="text-[20px] font-bold text-white">
              {selectedMonth ? fullMonthLabel(selectedMonth) : '—'}
            </span>
            <ChevronDown size={18} color="#0a84ff" strokeWidth={2.2}
              style={{ transform: monthDropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {/* Month pill scroll */}
        <div ref={monthScrollRef} className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {allMonths.map(mk => (
            <button
              key={mk}
              data-month={mk}
              onClick={() => setSelectedMonth(mk)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all"
              style={{
                background: selectedMonth === mk ? '#0a84ff' : 'transparent',
                color: selectedMonth === mk ? '#ffffff' : '#8e8e93',
                border: `1.5px solid ${selectedMonth === mk ? '#0a84ff' : '#38383a'}`,
              }}
            >
              {monthLabel(mk)}
            </button>
          ))}
        </div>

        {/* Difference + totals */}
        <div className="px-4 mt-2 mb-4">
          <div className="text-[12px] text-center mb-1" style={{ color: '#8e8e93' }}>Celkové výdavky</div>
          <div className="text-center flex items-baseline justify-center gap-2 mb-4">
            <span className="text-[40px] font-bold tracking-tight text-[#ff3b30]">
              – {totalSpending.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[20px] font-semibold" style={{ color: '#8e8e93' }}>EUR</span>
          </div>

          <div className="rounded-2xl overflow-hidden flex" style={{ background: '#1c1c1e' }}>
            <div className="flex-1 px-4 py-3 text-center" style={{ borderRight: '0.5px solid #38383a' }}>
              <div className="text-[12px] mb-1" style={{ color: '#8e8e93' }}>Výdavky</div>
              <div className="text-[15px] font-semibold text-[#ff3b30]">
                – {totalSpending.toFixed(2).replace('.', ',')} EUR
              </div>
            </div>
            <div className="flex-1 px-4 py-3 text-center">
              <div className="text-[12px] mb-1" style={{ color: '#8e8e93' }}>Položky</div>
              <div className="text-[15px] font-semibold text-[#30d158]">{monthExpenses.length}</div>
            </div>
          </div>
        </div>

        {/* Donut chart */}
        {segments.length > 0 ? (
          <DonutChart segments={segments} />
        ) : (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">📊</div>
            <div className="text-[15px] font-medium text-white mb-1">Žiadne výdavky</div>
            <div className="text-[13px]" style={{ color: '#8e8e93' }}>V tomto mesiaci nie sú žiadne výdavky</div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-4">
          <div className="flex border-b" style={{ borderColor: '#38383a' }}>
            {(['categories', 'transactions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-3 text-[14px] font-medium transition-colors"
                style={{ color: activeTab === tab ? '#ffffff' : '#8e8e93' }}
              >
                {tab === 'categories' ? 'Kategórie' : 'Transakcie'}
              </button>
            ))}
          </div>
          {/* active tab indicator */}
          <div className="flex">
            {(['categories', 'transactions'] as const).map(tab => (
              <div key={tab} className="flex-1 h-0.5 transition-all"
                style={{ background: activeTab === tab ? '#0a84ff' : 'transparent' }} />
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-4 pt-4">
          {activeTab === 'categories' ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[17px] font-bold text-white">Kategórie výdavkov</span>
                <span className="text-[13px]" style={{ color: '#0a84ff' }}>Zobraziť všetky</span>
              </div>
              {catRows.length === 0 ? (
                <div className="py-8 text-center text-[14px]" style={{ color: '#8e8e93' }}>
                  Žiadne kategórie
                </div>
              ) : (
                <div>
                  {catRows.map((r, i) => (
                    <div key={r.cat} className="flex items-center gap-3 py-3.5"
                      style={{ borderBottom: i < catRows.length - 1 ? '0.5px solid #38383a' : 'none' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] flex-shrink-0"
                        style={{ background: r.color + '22' }}>
                        {r.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[14px] font-medium text-white">{r.label}</span>
                          <span className="text-[14px] font-mono font-semibold text-[#ff3b30]">
                            – {r.amount.toFixed(2).replace('.', ',')} €
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 rounded-full" style={{ background: '#2c2c2e' }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${r.pct}%`, background: r.color }} />
                          </div>
                          <span className="text-[11px] font-medium flex-shrink-0" style={{ color: r.color }}>
                            {r.pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[17px] font-bold text-white">Transakcie</span>
                <span className="text-[13px]" style={{ color: '#8e8e93' }}>{monthExpenses.length}</span>
              </div>
              {monthExpenses.length === 0 ? (
                <div className="py-8 text-center text-[14px]" style={{ color: '#8e8e93' }}>
                  Žiadne transakcie
                </div>
              ) : (
                <div>
                  {monthExpenses
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((e, i) => {
                      const meta = categoryMeta(e.category)
                      return (
                        <div key={e.id} className="flex items-center gap-3 py-3"
                          style={{ borderBottom: i < monthExpenses.length - 1 ? '0.5px solid #38383a' : 'none' }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] flex-shrink-0"
                            style={{ background: meta.color + '22' }}>
                            {meta.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold text-white truncate">{e.merchant}</div>
                            <div className="text-[11px] mt-0.5" style={{ color: '#8e8e93' }}>
                              {meta.label} · {e.date.slice(0, 10)}
                            </div>
                          </div>
                          <span className="text-[14px] font-mono font-semibold text-[#ff3b30] flex-shrink-0">
                            – {e.amount.toFixed(2).replace('.', ',')} €
                          </span>
                        </div>
                      )
                    })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </TBShell>
  )
}
