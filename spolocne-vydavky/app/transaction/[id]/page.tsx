'use client'

import TBShell from '@/components/TBShell'
import { ChevronLeft, Split, FileText, Cloud } from 'lucide-react'
import Link from 'next/link'
import { use, useState, useEffect } from 'react'

const TRANSACTIONS = [
  { id: 't1', merchant: 'KAUFLAND Poprad', amount: -12.33, date: '18. apríl 2026', category: 'Potraviny', canSplit: true },
  { id: 't2', merchant: 'Shell — Ružomberok', amount: -48.00, date: '17. apríl 2026', category: 'Doprava', canSplit: true },
  { id: 't3', merchant: 'Tatranská Lomnica', amount: -89.00, date: '16. apríl 2026', category: 'Zábava', canSplit: true },
  { id: 't4', merchant: 'Lidl Košice', amount: -23.45, date: '15. apríl 2026', category: 'Potraviny', canSplit: true },
  { id: 't5', merchant: 'Netflix', amount: -15.99, date: '1. apríl 2026', category: 'Predplatné', canSplit: false },
]

export default function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const tx = TRANSACTIONS.find(t => t.id === id) ?? TRANSACTIONS[0]
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <TBShell>
      <div className="px-4 pt-3">
        {/* Header */}
        <div className="flex items-center mb-4" style={{ position: 'relative' }}>
          <Link href="/" className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
          </Link>
          <h1 className="text-[17px] font-semibold text-white absolute left-1/2 -translate-x-1/2">Detail pohybu</h1>
        </div>

        {/* Merchant + amount */}
        <div className="mb-5 pt-2" style={{ borderBottom: '0.5px solid #38383a', paddingBottom: '20px' }}>
          <div className="text-[17px] font-bold text-white mb-4">{tx.merchant}</div>
          <div className="text-[13px] mb-1" style={{ color: '#8e8e93' }}>Suma</div>
          <div className="flex items-baseline gap-2">
            <span className="text-[42px] font-bold text-[#ff3b30] tracking-tight">
              {tx.amount < 0 ? '– ' : '+ '}{Math.abs(tx.amount).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[22px] font-semibold text-[#ff3b30]">EUR</span>
          </div>
        </div>

        {/* PDF export */}
        <div
          className="flex flex-col items-center py-4 mb-2 cursor-pointer"
          style={{ borderBottom: '0.5px solid #38383a' }}
          onClick={() => setToast('Export do PDF bude čoskoro dostupný')}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1" style={{ background: '#1c1c1e' }}>
            <FileText size={24} color="#0a84ff" strokeWidth={1.8} />
          </div>
          <span className="text-[12px] text-center" style={{ color: '#8e8e93' }}>Exportovať<br />do PDF</span>
        </div>

        {/* CO2 card */}
        <div className="rounded-2xl p-4 flex items-center gap-3 mb-2" style={{ background: '#1c1c1e' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#1c3a5e' }}>
            <Cloud size={18} color="#0a84ff" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-white">14,59 kg CO₂e</div>
            <div className="text-[12px] mt-0.5" style={{ color: '#8e8e93' }}>
              Ekvivalent 1 043 minút prevádzky rúry na 60 °C
            </div>
          </div>
          <ChevronLeft size={16} color="#0a84ff" style={{ transform: 'rotate(180deg)' }} />
        </div>

        {/* Detail rows */}
        <div>
          {[
            { label: 'Dátum spracovania', value: '18.04.2026' },
            { label: 'Dátum zúčtovania', value: '16.04.2026' },
            { label: 'Typ transakcie', value: 'Debet' },
            { label: 'Názov obchodníka', value: tx.merchant + ', KOŠICE' },
            { label: 'Kategória', value: tx.category },
          ].map(({ label, value }, i, arr) => (
            <div key={label} className="py-3" style={{ borderBottom: i < arr.length - 1 ? '0.5px solid #38383a' : 'none' }}>
              <div className="text-[13px] mb-1" style={{ color: '#8e8e93' }}>{label}</div>
              <div className="text-[15px] font-medium text-white">{value}</div>
            </div>
          ))}
        </div>

        {/* Split CTA */}
        {tx.canSplit && (
          <div className="mt-6">
            <Link href={`/add-expense?amount=${Math.abs(tx.amount)}&merchant=${encodeURIComponent(tx.merchant)}`}>
              <button className="w-full py-4 rounded-2xl font-semibold text-[16px] flex items-center justify-center gap-2 text-white" style={{ background: '#0a84ff' }}>
                <Split size={18} />
                Rozdeliť výdavok
              </button>
            </Link>
          </div>
        )}

        <div className="h-4" />
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-white z-50" style={{ background: '#1c1c1e', border: '1px solid #38383a' }}>
          {toast}
        </div>
      )}
    </TBShell>
  )
}
