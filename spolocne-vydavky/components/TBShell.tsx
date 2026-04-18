'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart2, CreditCard, Landmark } from 'lucide-react'
import { useEffect, useState } from 'react'
import { T, getLang } from '@/lib/i18n'

function PlatbaIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="2" y="2" width="22" height="22" rx="6" stroke="#ffffff" strokeWidth="1.8" />
      <path d="M13 18V8M13 8L8.5 12.5M13 8L17.5 12.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function TBShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [nav, setNav] = useState(T.sk.nav)

  useEffect(() => {
    const lang = getLang(localStorage.getItem('lang') ?? undefined)
    setNav(T[lang].nav)
  }, [])

  const NAV = [
    { label: nav.home, href: '/', icon: Home },
    { label: nav.analytics, href: '/prehlady', icon: BarChart2 },
    { label: nav.pay, href: '/platba', isPrimary: true },
    { label: nav.cards, href: '/karty', icon: CreditCard },
    { label: nav.bank, href: '/banka', icon: Landmark },
  ]

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: '#000000' }}>
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />
      <main className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: '80px' }}>
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(20px)', borderTop: '0.5px solid #38383a' }}
      >
        <div className="flex items-end justify-around px-1 pt-2 pb-1">
          {NAV.map(({ label, href, icon: Icon, isPrimary }) => {
            const active = pathname === href
            if (isPrimary) {
              return (
                <Link key={label} href={href} className="flex flex-col items-center gap-1 pb-1">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: active ? '#0a84ff' : '#1c1c1e', border: '1px solid #38383a' }}
                  >
                    <PlatbaIcon />
                  </div>
                  <span className="text-[10px]" style={{ color: active ? '#0a84ff' : '#8e8e93' }}>{label}</span>
                </Link>
              )
            }
            return (
              <Link key={label} href={href} className="flex flex-col items-center gap-1 min-w-[52px] pb-1">
                {Icon && <Icon size={24} color={active ? '#0a84ff' : '#8e8e93'} strokeWidth={active ? 2.2 : 1.8} />}
                <span className="text-[10px]" style={{ color: active ? '#0a84ff' : '#8e8e93' }}>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
