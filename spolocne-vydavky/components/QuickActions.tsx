'use client'

import { useState, useEffect } from 'react'
import { Share2, Download, Monitor, Clock, Repeat } from 'lucide-react'

const ACTIONS = [
  { icon: Share2, label: 'Zdieľať IBAN' },
  { icon: Download, label: 'Vyžiadať platbu' },
  { icon: Monitor, label: 'Výber z bankomatu' },
  { icon: Clock, label: 'Čakajúce platby' },
  { icon: Repeat, label: 'Trvalé príkazy' },
]

export default function QuickActions() {
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <>
      <div className="flex gap-3 overflow-x-auto no-scrollbar mb-5 pb-1">
        {ACTIONS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => setToast('Táto funkcia bude čoskoro dostupná')}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#1c1c1e' }}>
              <Icon size={22} color="#0a84ff" strokeWidth={1.8} />
            </div>
            <span className="text-[11px] text-white text-center w-16 leading-tight">{label}</span>
          </button>
        ))}
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
