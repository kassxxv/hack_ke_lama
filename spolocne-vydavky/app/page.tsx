import TBShell from '@/components/TBShell'
import SwipeLayout from '@/components/SwipeLayout'
import QuickActions from '@/components/QuickActions'
import { Mail, Settings } from 'lucide-react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongoose'
import { GroupModel, ExpenseModel } from '@/models/Group'
import { UserModel } from '@/models/User'
import { T, getLang } from '@/lib/i18n'


const CATEGORY_EMOJI: Record<string, string> = {
  Potraviny: '🛒', Doprava: '⛽', Zábava: '🎭',
  Bývanie: '🏠', Služby: '📡', Predplatné: '📺', Iné: '💳',
}

const TRANSACTIONS = [
  { id: 't1', merchant: 'KAUFLAND Poprad', amount: -12.33, date: '18. apríl 2026', category: 'Potraviny', canSplit: true },
  { id: 't2', merchant: 'Shell — Ružomberok', amount: -48.00, date: '17. apríl 2026', category: 'Doprava', canSplit: true },
  { id: 't3', merchant: 'Tatranská Lomnica', amount: -89.00, date: '16. apríl 2026', category: 'Zábava', canSplit: true },
  { id: 't4', merchant: 'Lidl Košice', amount: -23.45, date: '15. apríl 2026', category: 'Potraviny', canSplit: true },
  { id: 't5', merchant: 'Netflix', amount: -15.99, date: '1. apríl 2026', category: 'Predplatné', canSplit: false },
]

async function getTeaserData() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('sv_user_id')?.value
    if (!userId) return { totalOwed: 0, groupCount: 0, userName: 'Filip' }

    await connectDB()
    const user = await UserModel.findById(userId).lean() as { name: string } | null
    const groups = await GroupModel.find().lean() as { _id: { toString(): string }; members: { userId: string; role: string }[] }[]

    let totalOwed = 0
    let groupCount = 0
    for (const g of groups) {
      const isMember = g.members.some(m => m.userId === userId)
      if (!isMember) continue
      groupCount++
      const expenses = await ExpenseModel.find({ groupId: g._id }).lean() as { paidBy: string; amount: number; splits: { userId: string; amount: number; settled: boolean }[] }[]
      expenses.forEach(e => {
        e.splits.forEach(s => {
          if (s.settled) return
          if (s.userId === userId && e.paidBy !== userId) totalOwed -= s.amount
          else if (e.paidBy === userId && s.userId !== userId) totalOwed += s.amount
        })
      })
    }

    return { totalOwed, groupCount, userName: user?.name ?? 'Filip' }
  } catch {
    return { totalOwed: 0, groupCount: 0, userName: 'Filip' }
  }
}

export default async function Home() {
  const { totalOwed, groupCount, userName } = await getTeaserData()
  const cookieStore = await cookies()
  const lang = getLang(cookieStore.get('sv_lang')?.value)
  const t = T[lang]
  const amt = Math.abs(totalOwed).toFixed(2).replace('.', ',')
  const teaserLabel = totalOwed > 0 ? t.owedToYou(amt) : totalOwed < 0 ? t.youOwe(amt) : t.allSettled

  return (
    <TBShell>
      <SwipeLayout onSwipeLeft="/groups">
        <div className="px-4 pt-3">

          {/* Top bar — avatar absolutely centered */}
          <div className="relative flex items-center mb-5" style={{ height: '36px' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#1c1c1e' }}>
              <Mail size={18} color="#ffffff" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white" style={{ background: '#5B5EA6' }}>
              {userName.charAt(0)}
            </div>
            <Link href="/nastavenia" className="ml-auto w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#1c1c1e' }}>
              <Settings size={18} color="#ffffff" />
            </Link>
          </div>

          {/* Account identity */}
          <div className="text-center mb-1">
            <span className="text-[17px] font-bold text-white">{userName}</span>
            <div className="text-[12px]" style={{ color: '#8e8e93' }}>SK06 1100 0000 0029 3790 7102</div>
          </div>

          {/* Balance on black */}
          <div className="text-center mb-1">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-[42px] font-bold text-white tracking-tight">2 341,50</span>
              <span className="text-[22px] font-semibold" style={{ color: '#8e8e93' }}>EUR</span>
            </div>
            <div className="text-[12px]" style={{ color: '#8e8e93' }}>Účtovný zostatok platný k 18.04.2026 11:43</div>
          </div>

          {/* Sparkline */}
          <div className="h-20 mb-4 relative overflow-hidden">
            <svg viewBox="0 0 390 80" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0a84ff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0a84ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 60 Q40 55 80 50 Q120 45 140 48 Q180 52 200 40 Q230 28 260 35 Q300 42 320 25 Q350 10 390 15" fill="none" stroke="#0a84ff" strokeWidth="2" />
              <path d="M0 60 Q40 55 80 50 Q120 45 140 48 Q180 52 200 40 Q230 28 260 35 Q300 42 320 25 Q350 10 390 15 L390 80 L0 80 Z" fill="url(#cg)" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
              {['5', '23', '30', '6', '13'].map(l => (
                <span key={l} className="text-[10px]" style={{ color: '#8e8e93' }}>{l}</span>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <QuickActions />


          {/* Transactions */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[17px] font-bold text-white">{t.recentTx}</span>
            <Link href="/" className="text-[14px]" style={{ color: '#0a84ff' }}>{t.allTx}</Link>
          </div>

          <div>
            {TRANSACTIONS.map((tx, i) => (
              <Link key={tx.id} href={`/transaction/${tx.id}`}>
                <div
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: i < TRANSACTIONS.length - 1 ? '0.5px solid #38383a' : 'none' }}
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-lg" style={{ background: tx.amount < 0 ? '#3a1c1c' : '#1a3a1e' }}>
                    {CATEGORY_EMOJI[tx.category] ?? '💳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white truncate">{tx.merchant}</div>
                    <div className="text-[12px]" style={{ color: '#8e8e93' }}>{t.cardPayment} · {tx.date}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-[15px] font-semibold ${tx.amount < 0 ? 'text-[#ff3b30]' : 'text-[#30d158]'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} EUR
                    </div>
                    <div className="text-[11px]" style={{ color: '#8e8e93' }}>☁ 0,26 kg CO₂e</div>
                    {tx.canSplit && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#1c3a5e', color: '#0a84ff' }}>
                        {t.split}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="h-4" />
        </div>
      </SwipeLayout>
    </TBShell>
  )
}
