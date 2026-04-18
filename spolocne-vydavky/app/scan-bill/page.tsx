'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import TBShell from '@/components/TBShell'
import { ChevronLeft, Camera, Check, Minus, Plus } from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import type { Group } from '@/types'

type BillItem = {
  id: string
  name: string
  price: number
  qty: number
  assignedTo: string[] // userIds
}

// Mock scanned receipt — swap this out when OCR is ready
const MOCK_RECEIPT: Omit<BillItem, 'assignedTo'>[] = [
  { id: 'i1', name: 'Margherita Pizza',   price: 9.90,  qty: 1 },
  { id: 'i2', name: 'Pepperoni Pizza',    price: 11.50, qty: 1 },
  { id: 'i3', name: 'Pasta Carbonara',    price: 10.90, qty: 1 },
  { id: 'i4', name: 'Caesar Salát',       price: 7.50,  qty: 1 },
  { id: 'i5', name: 'Pivo Pilsner',       price: 2.90,  qty: 2 },
  { id: 'i6', name: 'Coca-Cola',          price: 2.50,  qty: 1 },
  { id: 'i7', name: 'Tiramisu',           price: 5.90,  qty: 1 },
]

const MOCK_MERCHANT = 'Reštaurácia Bratislava'
const MOCK_DATE = '2026-04-19'

function ScanBillInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const groupId = searchParams.get('groupId') ?? ''
  const { state } = useStore()
  const ME = state.currentUser?.id ?? ''

  const [group, setGroup] = useState<Group | null>(null)
  const [items, setItems] = useState<BillItem[]>(
    MOCK_RECEIPT.map(i => ({ ...i, assignedTo: [] }))
  )
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!groupId) return
    fetch(`/api/groups/${groupId}`)
      .then(r => r.json())
      .then(d => setGroup(d.group ?? null))
  }, [groupId])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2000)
    return () => clearTimeout(t)
  }, [toast])

  function toggleAssign(itemId: string, userId: string) {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const has = item.assignedTo.includes(userId)
      return {
        ...item,
        assignedTo: has
          ? item.assignedTo.filter(id => id !== userId)
          : [...item.assignedTo, userId],
      }
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

  // per-person totals
  const members = group?.members ?? []
  const totals: Record<string, number> = {}
  for (const m of members) totals[m.user.id] = 0
  for (const item of items) {
    if (item.assignedTo.length === 0) continue
    const share = (item.price * item.qty) / item.assignedTo.length
    for (const uid of item.assignedTo) {
      totals[uid] = (totals[uid] ?? 0) + share
    }
  }

  const billTotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const assignedTotal = Object.values(totals).reduce((s, v) => s + v, 0)
  const unassigned = billTotal - assignedTotal

  const allAssigned = items.every(i => i.assignedTo.length > 0)

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
          merchant: MOCK_MERCHANT,
          date: MOCK_DATE,
          isPersonal: false,
          category: 'food',
          splits,
        }),
      })
      router.push('/groups')
    } catch {
      setToast('Chyba pri ukladaní')
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

      <div className="px-4 pt-3 pb-8">
        {/* Header */}
        <div className="flex items-center mb-5" style={{ position: 'relative' }}>
          <Link href={groupId ? `/groups` : '/groups'} className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
          </Link>
          <h1 className="text-[17px] font-semibold text-white absolute left-1/2 -translate-x-1/2">
            Rozdeliť účet
          </h1>
        </div>

        {/* Mock scan banner */}
        <div className="rounded-2xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{ background: '#1c1c1e', border: '1px solid #38383a' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#0a84ff22' }}>
            <Camera size={20} color="#0a84ff" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-white">{MOCK_MERCHANT}</div>
            <div className="text-[12px] mt-0.5" style={{ color: '#8e8e93' }}>
              Naskenovaný účet · {MOCK_DATE} · {billTotal.toFixed(2).replace('.', ',')} €
            </div>
          </div>
          <div className="px-2 py-1 rounded-lg text-[11px] font-semibold" style={{ background: '#30d15822', color: '#30d158' }}>
            MOCK
          </div>
        </div>

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
                  {m.user.id === ME ? 'Ty' : m.user.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Bill items */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] font-bold text-white">Položky</span>
            <button
              onClick={() => {
                if (!group) return
                const allIds = group.members.map(m => m.user.id)
                setItems(prev => prev.map(i => ({ ...i, assignedTo: allIds })))
              }}
              className="text-[13px]" style={{ color: '#0a84ff' }}>
              Priradiť všetkým
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: '#1c1c1e' }}>
            {items.map((item, idx) => (
              <div key={item.id}
                style={{ borderBottom: idx < items.length - 1 ? '0.5px solid #38383a' : 'none' }}>
                <div className="px-4 pt-3 pb-2">
                  {/* Item row */}
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex-1 min-w-0 pr-3">
                      <span className="text-[14px] font-medium text-white">{item.name}</span>
                      {item.qty > 1 && (
                        <span className="text-[12px] ml-1.5" style={{ color: '#8e8e93' }}>×{item.qty}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.assignedTo.length > 0 && item.assignedTo.length < (members.length) && (
                        <span className="text-[11px]" style={{ color: '#8e8e93' }}>
                          {((item.price * item.qty) / item.assignedTo.length).toFixed(2).replace('.', ',')} € / os.
                        </span>
                      )}
                      <span className="text-[14px] font-mono font-semibold text-white">
                        {(item.price * item.qty).toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                  </div>

                  {/* Member assign buttons */}
                  <div className="flex gap-2 flex-wrap pb-1">
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
                            {m.user.id === ME ? 'Ty' : m.user.name.split(' ')[0]}
                          </span>
                          {assigned && <Check size={10} color="#fff" strokeWidth={3} />}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => assignAll(item.id)}
                      className="px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all"
                      style={{
                        background: item.assignedTo.length === members.length ? '#38383a' : '#2c2c2e',
                        color: '#8e8e93',
                        border: '1.5px solid #38383a',
                      }}
                    >
                      Všetci
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
            <div className="text-[13px] font-bold text-white mb-3">Súhrn na osobu</div>
            <div className="space-y-2.5">
              {members.map((m, i) => {
                const amt = totals[m.user.id] ?? 0
                return (
                  <div key={m.user.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                      style={{ background: m.user.avatarColor }}>
                      {m.user.name.charAt(0)}
                    </div>
                    <span className="text-[13px] font-medium text-white flex-1">
                      {m.user.id === ME ? 'Ty' : m.user.name.split(' ')[0]}
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
                <span className="text-[12px]" style={{ color: '#ff9f0a' }}>Nepriradené</span>
                <span className="text-[13px] font-mono font-semibold" style={{ color: '#ff9f0a' }}>
                  {unassigned.toFixed(2).replace('.', ',')} €
                </span>
              </div>
            )}
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between mb-6 px-1">
          <span className="text-[15px] font-bold text-white">Celkom</span>
          <span className="text-[18px] font-bold font-mono text-white">
            {billTotal.toFixed(2).replace('.', ',')} €
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={handleCreate}
          disabled={saving || !allAssigned || !group}
          className="w-full py-4 rounded-2xl font-semibold text-[16px] transition-all"
          style={{
            background: allAssigned && group ? '#0a84ff' : '#2c2c2e',
            color: allAssigned && group ? '#fff' : '#8e8e93',
          }}
        >
          {saving ? 'Ukladám...' : !allAssigned ? `Priraď všetky položky` : 'Vytvoriť výdavok'}
        </button>
        {!allAssigned && (
          <div className="text-center mt-2 text-[12px]" style={{ color: '#8e8e93' }}>
            {items.filter(i => i.assignedTo.length === 0).length} položiek ešte nie je priradených
          </div>
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
