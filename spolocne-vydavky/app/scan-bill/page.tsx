'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import TBShell from '@/components/TBShell'
import { ChevronLeft, Camera, Check, Upload, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import type { Group } from '@/types'
import type { ScannedReceipt } from '@/app/api/scan-receipt/route'
import { useLang } from '@/lib/use-lang'

type BillItem = {
  id: string
  name: string
  price: number
  qty: number
  assignedTo: string[]
}

const MOCK_RECEIPT: ScannedReceipt = {
  merchant: 'Reštaurácia Bratislava',
  date: '2026-04-19',
  total: 51.10,
  items: [
    { id: 'i1', name: 'Margherita Pizza',  price: 9.90,  qty: 1 },
    { id: 'i2', name: 'Pepperoni Pizza',   price: 11.50, qty: 1 },
    { id: 'i3', name: 'Pasta Carbonara',   price: 10.90, qty: 1 },
    { id: 'i4', name: 'Caesar Salát',      price: 7.50,  qty: 1 },
    { id: 'i5', name: 'Pivo Pilsner',      price: 2.90,  qty: 2 },
    { id: 'i6', name: 'Coca-Cola',         price: 2.50,  qty: 1 },
    { id: 'i7', name: 'Tiramisu',          price: 5.90,  qty: 1 },
  ],
}

function receiptToItems(r: ScannedReceipt): BillItem[] {
  return r.items.map(i => ({ ...i, assignedTo: [] }))
}

function ScanBillInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const groupId = searchParams.get('groupId') ?? ''
  const { state } = useStore()
  const { t } = useLang()
  const ME = state.currentUser?.id ?? ''

  const [group, setGroup] = useState<Group | null>(null)
  const [items, setItems] = useState<BillItem[]>(receiptToItems(MOCK_RECEIPT))
  const [merchant, setMerchant] = useState(MOCK_RECEIPT.merchant)
  const [receiptDate, setReceiptDate] = useState(MOCK_RECEIPT.date)
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false) // true = real scan done
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!groupId) return
    fetch(`/api/groups/${groupId}`)
      .then(r => r.json())
      .then(d => setGroup(d.group ?? null))
  }, [groupId])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  async function handleFile(file: File) {
    setScanning(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/scan-receipt', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const data: ScannedReceipt = await res.json()
      if (data.items.length === 0) throw new Error('no items')
      setItems(receiptToItems(data))
      setMerchant(data.merchant)
      setReceiptDate(data.date)
      setScanned(true)
      setToast(t.scanBill.scanSuccess)
    } catch {
      setToast(t.scanBill.scanFail)
    } finally {
      setScanning(false)
    }
  }

  function toggleAssign(itemId: string, userId: string) {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const has = item.assignedTo.includes(userId)
      return { ...item, assignedTo: has ? item.assignedTo.filter(id => id !== userId) : [...item.assignedTo, userId] }
    }))
  }

  function assignAll(itemId: string) {
    if (!group) return
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const allIds = group.members.map(m => m.user.id)
      const allAssigned = allIds.every(id => item.assignedTo.includes(id))
      return { ...item, assignedTo: allAssigned ? [] : allIds }
    }))
  }

  const members = group?.members ?? []
  const totals: Record<string, number> = {}
  for (const m of members) totals[m.user.id] = 0
  for (const item of items) {
    if (item.assignedTo.length === 0) continue
    const share = (item.price * item.qty) / item.assignedTo.length
    for (const uid of item.assignedTo) totals[uid] = (totals[uid] ?? 0) + share
  }

  const billTotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const assignedTotal = Object.values(totals).reduce((s, v) => s + v, 0)
  const unassigned = billTotal - assignedTotal
  const allAssigned = items.every(i => i.assignedTo.length > 0)
  const unassignedCount = items.filter(i => i.assignedTo.length === 0).length

  async function handleCreate() {
    if (!group || !ME) return
    setSaving(true)
    try {
      const splits = members.map(m => ({
        userId: m.user.id,
        amount: parseFloat((totals[m.user.id] ?? 0).toFixed(2)),
        settled: m.user.id === ME,
      }))
      await fetch(`/api/groups/${groupId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(billTotal.toFixed(2)),
          paidBy: ME,
          merchant,
          date: receiptDate,
          isPersonal: false,
          category: 'food',
          splits,
        }),
      })
      router.push('/groups')
    } catch {
      setToast(t.scanBill.saveError)
      setSaving(false)
    }
  }

  return (
    <TBShell>
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-white z-50"
          style={{ background: '#1c1c1e', border: '1px solid #38383a' }}>
          {toast}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      <div className="px-4 pt-3 pb-8">
        {/* Header */}
        <div className="flex items-center mb-5" style={{ position: 'relative' }}>
          <Link href="/groups" className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
          </Link>
          <h1 className="text-[17px] font-semibold text-white absolute left-1/2 -translate-x-1/2">
            {t.scanBill.title}
          </h1>
        </div>

        {/* Scan card */}
        <div className="rounded-2xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{ background: '#1c1c1e', border: '1px solid #38383a' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: scanned ? '#30d15822' : '#0a84ff22' }}>
            {scanning
              ? <Loader2 size={20} color="#0a84ff" strokeWidth={1.8} className="animate-spin" />
              : <Camera size={20} color={scanned ? '#30d158' : '#0a84ff'} strokeWidth={1.8} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-white truncate">{merchant}</div>
            <div className="text-[12px] mt-0.5" style={{ color: '#8e8e93' }}>
              {receiptDate} · {billTotal.toFixed(2).replace('.', ',')} €
            </div>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold flex-shrink-0"
            style={{ background: '#0a84ff22', color: '#0a84ff' }}
          >
            <Upload size={13} strokeWidth={2} />
            {scanned ? t.scanBill.scanAgain : t.scanBill.scanCta}
          </button>
        </div>

        {scanning && (
          <div className="flex items-center justify-center gap-3 py-6">
            <Loader2 size={20} color="#0a84ff" className="animate-spin" />
            <span className="text-[14px]" style={{ color: '#8e8e93' }}>{t.scanBill.scanning}</span>
          </div>
        )}

        {!scanning && (
          <>
            {/* Member legend */}
            {members.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {members.map(m => (
                  <div key={m.user.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                    style={{ background: m.user.avatarColor + '22', border: `1px solid ${m.user.avatarColor}44` }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: m.user.avatarColor }}>
                      {m.user.name.charAt(0)}
                    </div>
                    <span className="text-[12px] font-medium text-white">
                      {m.user.id === ME ? t.common.you : m.user.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Items */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[15px] font-bold text-white">{t.scanBill.items}</span>
                <button
                  onClick={() => {
                    if (!group) return
                    const allIds = group.members.map(m => m.user.id)
                    setItems(prev => prev.map(i => ({ ...i, assignedTo: allIds })))
                  }}
                  className="text-[13px]" style={{ color: '#0a84ff' }}>
                  {t.scanBill.assignAll}
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ background: '#1c1c1e' }}>
                {items.map((item, idx) => (
                  <div key={item.id}
                    style={{ borderBottom: idx < items.length - 1 ? '0.5px solid #38383a' : 'none' }}>
                    <div className="px-4 pt-3 pb-2.5">
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="flex-1 min-w-0 pr-3">
                          <span className="text-[14px] font-medium text-white">{item.name}</span>
                          {item.qty > 1 && (
                            <span className="text-[12px] ml-1.5" style={{ color: '#8e8e93' }}>×{item.qty}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.assignedTo.length > 0 && item.assignedTo.length < members.length && (
                            <span className="text-[11px]" style={{ color: '#8e8e93' }}>
                              {((item.price * item.qty) / item.assignedTo.length).toFixed(2).replace('.', ',')} €/os.
                            </span>
                          )}
                          <span className="text-[14px] font-mono font-semibold text-white">
                            {(item.price * item.qty).toFixed(2).replace('.', ',')} €
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {members.map(m => {
                          const assigned = item.assignedTo.includes(m.user.id)
                          return (
                            <button
                              key={m.user.id}
                              onClick={() => toggleAssign(item.id, m.user.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all"
                              style={{
                                background: assigned ? m.user.avatarColor : '#2c2c2e',
                                border: `1.5px solid ${assigned ? m.user.avatarColor : '#38383a'}`,
                              }}
                            >
                              <span className="text-[11px] font-semibold text-white">
                                {m.user.id === ME ? t.common.you : m.user.name.split(' ')[0]}
                              </span>
                              {assigned && <Check size={10} color="#fff" strokeWidth={3} />}
                            </button>
                          )
                        })}
                        <button
                          onClick={() => assignAll(item.id)}
                          className="px-2.5 py-1.5 rounded-full text-[11px] font-medium"
                          style={{
                            background: item.assignedTo.length === members.length ? '#38383a' : '#2c2c2e',
                            color: '#8e8e93',
                            border: '1.5px solid #38383a',
                          }}
                        >
                          {t.scanBill.everyone}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-person summary */}
            {members.length > 0 && (
              <div className="rounded-2xl p-4 mb-5" style={{ background: '#1c1c1e' }}>
                <div className="text-[13px] font-bold text-white mb-3">{t.scanBill.perPersonSummary}</div>
                <div className="space-y-2.5">
                  {members.map(m => {
                    const amt = totals[m.user.id] ?? 0
                    return (
                      <div key={m.user.id} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                          style={{ background: m.user.avatarColor }}>
                          {m.user.name.charAt(0)}
                        </div>
                        <span className="text-[13px] font-medium text-white flex-1">
                          {m.user.id === ME ? t.common.you : m.user.name.split(' ')[0]}
                        </span>
                        <div className="flex-1 mx-2">
                          <div className="h-1 rounded-full" style={{ background: '#2c2c2e' }}>
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${billTotal > 0 ? (amt / billTotal) * 100 : 0}%`, background: m.user.avatarColor }} />
                          </div>
                        </div>
                        <span className="text-[14px] font-mono font-semibold text-white flex-shrink-0">
                          {amt.toFixed(2).replace('.', ',')} €
                        </span>
                      </div>
                    )
                  })}
                </div>
                {unassigned > 0.01 && (
                  <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '0.5px solid #38383a' }}>
                    <span className="text-[12px]" style={{ color: '#ff9f0a' }}>{t.scanBill.unassigned}</span>
                    <span className="text-[13px] font-mono font-semibold" style={{ color: '#ff9f0a' }}>
                      {unassigned.toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Total row */}
            <div className="flex items-center justify-between mb-6 px-1">
              <span className="text-[15px] font-bold text-white">{t.scanBill.total}</span>
              <span className="text-[18px] font-bold font-mono text-white">
                {billTotal.toFixed(2).replace('.', ',')} €
              </span>
            </div>

            {/* CTA */}
            <button
              onClick={handleCreate}
              disabled={saving || !allAssigned || !group}
              className="w-full py-4 rounded-2xl font-semibold text-[16px] transition-all"
              style={{ background: allAssigned && group ? '#0a84ff' : '#2c2c2e', color: allAssigned && group ? '#fff' : '#8e8e93' }}
            >
              {saving ? t.scanBill.saving : !allAssigned ? t.scanBill.assignRemaining(unassignedCount) : t.scanBill.createExpense}
            </button>
          </>
        )}
      </div>
    </TBShell>
  )
}

export default function ScanBillPage() {
  return (
    <Suspense>
      <ScanBillInner />
    </Suspense>
  )
}
