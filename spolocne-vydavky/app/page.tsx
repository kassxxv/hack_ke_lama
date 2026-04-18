import TBShell from '@/components/TBShell'
import SwipeLayout from '@/components/SwipeLayout'
import { ChevronRight, Mail, Settings, Share2, Download, Monitor, Clock, Repeat, Link2 } from 'lucide-react'
import Link from 'next/link'
import { cookies } from 'next/headers'

const QUICK_ACTIONS = [
  { icon: Share2, label: 'Zdieľať IBAN' },
  { icon: Download, label: 'Vyžiadať platbu' },
  { icon: Monitor, label: 'Výber z bankomatu' },
  { icon: Clock, label: 'Čakajúce platby' },
  { icon: Repeat, label: 'Trvalé príkazy' },
]

const CATEGORY_EMOJI: Record<string, string> = {
  Potraviny: '🛒', Doprava: '⛽', Zábava: '🎭',
  Bývanie: '🏠', Služby: '📡', Predplatné: '📺', Iné: '💳',
}

type TxItem = { id: string; merchant: string; amount: number; date: string; category: string; canSplit: boolean }

async function getTransactions(): Promise<{ items: TxItem[]; live: boolean }> {
  const cookieStore = await cookies()
  const token = cookieStore.get('tb_token')?.value

  if (!token) return { items: getMock(), live: false }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/tb/transactions`, {
      headers: { Cookie: `tb_token=${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return { items: getMock(), live: false }
    const data = await res.json()
    return { items: data.transactions, live: data.source === 'live' }
  } catch {
    return { items: getMock(), live: false }
  }
}

function getMock(): TxItem[] {
  return [
    { id: 't1', merchant: 'KAUFLAND Poprad', amount: -12.33, date: '18. apríl 2026', category: 'Potraviny', canSplit: true },
    { id: 't2', merchant: 'Shell — Ružomberok', amount: -48.00, date: '17. apríl 2026', category: 'Doprava', canSplit: true },
    { id: 't3', merchant: 'Tatranská Lomnica', amount: -89.00, date: '16. apríl 2026', category: 'Zábava', canSplit: true },
    { id: 't4', merchant: 'Lidl Košice', amount: -23.45, date: '15. apríl 2026', category: 'Potraviny', canSplit: true },
    { id: 't5', merchant: 'Netflix', amount: -15.99, date: '1. apríl 2026', category: 'Predplatné', canSplit: true },
  ]
}

export default async function Home() {
  const { items: transactions, live } = await getTransactions()

  return (
    <TBShell>
      <SwipeLayout onSwipeLeft="/groups">
        <div className="px-4 pt-3">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#1c1c1e' }}>
                <Mail size={18} color="#ffffff" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: '#0a84ff' }}>2</div>
            </div>
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-[13px] font-bold text-white" style={{ background: '#5B5EA6' }}>M</div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#1c1c1e' }}>
              <Settings size={18} color="#ffffff" />
            </div>
          </div>

          {/* Account identity */}
          <div className="text-center mb-1">
            <div className="flex items-center justify-center gap-1">
              <span className="text-[17px] font-bold text-white">Marek Novák</span>
              <ChevronRight size={16} color="#0a84ff" />
            </div>
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
          <div className="flex gap-3 overflow-x-auto no-scrollbar mb-5 pb-1">
            {QUICK_ACTIONS.map(({ icon: Icon, label }) => (
              <button key={label} className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#1c1c1e' }}>
                  <Icon size={22} color="#0a84ff" strokeWidth={1.8} />
                </div>
                <span className="text-[11px] text-white text-center w-16 leading-tight">{label}</span>
              </button>
            ))}
          </div>

          {/* TB Connect banner — shown when not connected */}
          {!live && (
            <a href="/api/tb/auth">
              <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: '#1c1c1e', border: '1px solid #38383a' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1c3a5e' }}>
                  <Link2 size={18} color="#0a84ff" />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-white">Pripojiť Tatra Banku</div>
                  <div className="text-[12px]" style={{ color: '#8e8e93' }}>Zobraziť skutočné pohyby z účtu</div>
                </div>
                <ChevronRight size={16} color="#0a84ff" />
              </div>
            </a>
          )}
          {live && (
            <div className="rounded-xl px-3 py-2 mb-4 flex items-center gap-2" style={{ background: '#1a3a1e' }}>
              <div className="w-2 h-2 rounded-full bg-[#30d158]" />
              <span className="text-[12px] font-medium text-[#30d158]">Tatra Banka prepojená · živé dáta</span>
            </div>
          )}

          {/* Groups teaser */}
          <Link href="/groups">
            <div className="rounded-2xl p-4 mb-5 flex items-center justify-between" style={{ background: '#1c1c1e', border: '1px solid #0a84ff33' }}>
              <div>
                <div className="text-[11px] font-semibold mb-0.5 uppercase tracking-wide" style={{ color: '#0a84ff' }}>Spoločné výdavky</div>
                <div className="text-[15px] font-semibold text-white">Dlhuješ celkom <span className="font-mono text-[#ff3b30]">120,00 €</span></div>
                <div className="text-[12px] mt-0.5" style={{ color: '#8e8e93' }}>3 skupiny · potiahnuť doľava →</div>
              </div>
              <ChevronRight size={20} color="#0a84ff" />
            </div>
          </Link>

          {/* Transactions */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[17px] font-bold text-white">Posledné pohyby</span>
            <span className="text-[14px]" style={{ color: '#0a84ff' }}>Všetky pohyby</span>
          </div>

          <div>
            {transactions.map((tx, i) => (
              <Link key={tx.id} href={`/transaction/${tx.id}`}>
                <div
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: i < transactions.length - 1 ? '0.5px solid #38383a' : 'none' }}
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-lg" style={{ background: tx.amount < 0 ? '#3a1c1c' : '#1a3a1e' }}>
                    {CATEGORY_EMOJI[tx.category] ?? '💳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white truncate">{tx.merchant}</div>
                    <div className="text-[12px]" style={{ color: '#8e8e93' }}>Platba kartou · {tx.date}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-[15px] font-semibold ${tx.amount < 0 ? 'text-[#ff3b30]' : 'text-[#30d158]'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} EUR
                    </div>
                    <div className="text-[11px]" style={{ color: '#8e8e93' }}>☁ 0,26 kg CO₂e</div>
                    {tx.canSplit && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#1c3a5e', color: '#0a84ff' }}>
                        Rozdeliť
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
