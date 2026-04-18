'use client'

import { useState, useEffect } from 'react'
import { Download, Monitor, Repeat, Users } from 'lucide-react'
import Link from 'next/link'
import { T, getLang } from '@/lib/i18n'

export default function QuickActions() {
  const [toast, setToast] = useState('')
  const [lang, setLang] = useState<'sk' | 'en'>('sk')

  useEffect(() => {
    setLang(getLang(localStorage.getItem('lang') ?? undefined))
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2000)
    return () => clearTimeout(t)
  }, [toast])

  const t = T[lang]

  const ACTIONS = [
    { icon: Download, label: t.requestPayment, action: () => setToast(t.comingSoon) },
    { icon: Monitor, label: t.atm, action: () => setToast(t.comingSoon) },
    { icon: Repeat, label: t.standingOrders, action: () => setToast(t.comingSoon) },
  ]

  return (
    <>
      <div className="flex gap-3 overflow-x-auto no-scrollbar mb-5 pb-1">
        {ACTIONS.map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#1c1c1e' }}>
              <Icon size={22} color="#0a84ff" strokeWidth={1.8} />
            </div>
            <span className="text-[11px] text-white text-center w-16 leading-tight">{label}</span>
          </button>
        ))}

        {/* Spoločné výdavky shortcut */}
        <Link href="/groups" className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#1a3a1e' }}>
            <Users size={22} color="#30d158" strokeWidth={1.8} />
          </div>
          <span className="text-[11px] text-center w-16 leading-tight" style={{ color: '#30d158' }}>{t.sharedExpenses}</span>
        </Link>
      </div>

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-white z-50 text-center"
          style={{ background: '#1c1c1e', border: '1px solid #38383a', maxWidth: '280px' }}
        >
          {toast}
        </div>
      )}
    </>
  )
}
