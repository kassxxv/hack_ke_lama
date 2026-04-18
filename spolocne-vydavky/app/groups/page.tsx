'use client'

import TBShell from '@/components/TBShell'
import SwipeLayout from '@/components/SwipeLayout'
import GroupCard from '@/components/GroupCard'
import { fetchGroups } from '@/lib/api'
import { Plus, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Group } from '@/types'

const ME = 'u1'

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }, [])

  const totalOwed = groups.reduce((sum, g) => {
    const me = g.members.find(m => m.user.id === ME)
    return sum + (me?.balance ?? 0)
  }, 0)

  return (
    <TBShell>
      <SwipeLayout onSwipeRight="/">
        <div className="px-4 pt-3">
          <div className="flex items-center mb-5" style={{ position: 'relative' }}>
            <Link href="/" className="w-8 h-8 flex items-center justify-center">
              <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
            </Link>
            <h1 className="text-[17px] font-semibold text-white absolute left-1/2 -translate-x-1/2">Skupiny</h1>
            <Link href="/groups/new" className="ml-auto w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#0a84ff' }}>
              <Plus size={18} color="#fff" strokeWidth={2.5} />
            </Link>
          </div>

          <div className="text-center mb-5">
            <div className="text-[13px] mb-1" style={{ color: '#8e8e93' }}>Celkové saldo</div>
            <div className="flex items-baseline justify-center gap-2">
              <span className={`text-[38px] font-bold tracking-tight ${totalOwed >= 0 ? 'text-[#30d158]' : 'text-[#ff3b30]'}`}>
                {totalOwed >= 0 ? '+' : ''}{Math.abs(totalOwed).toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[20px] font-semibold" style={{ color: '#8e8e93' }}>EUR</span>
            </div>
            <div className="text-[12px] mt-1" style={{ color: '#8e8e93' }}>
              {totalOwed > 0 ? 'Ostatní ti dlhujú' : totalOwed < 0 ? 'Ty dlhuješ ostatným' : 'Všetko vyrovnané 🎉'}
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[17px] font-bold text-white">Moje skupiny</span>
            <Link href="/add-expense">
              <span className="text-[14px]" style={{ color: '#0a84ff' }}>+ Výdavok</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-10 text-center" style={{ color: '#8e8e93' }}>Načítavam...</div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <div className="text-[17px] font-bold text-white mb-2">Žiadne skupiny</div>
              <div className="text-[14px] mb-6" style={{ color: '#8e8e93' }}>Vytvor svoju prvú skupinu a začni deliť výdavky</div>
              <Link href="/groups/new">
                <button className="px-6 py-3 rounded-2xl font-semibold text-[15px] text-white" style={{ background: '#0a84ff' }}>
                  Vytvoriť skupinu
                </button>
              </Link>
            </div>
          ) : (
            <div>
              {groups.map((group, i) => (
                <div key={group.id} style={{ borderBottom: i < groups.length - 1 ? '0.5px solid #38383a' : 'none' }}>
                  <GroupCard group={group} currentUserId={ME} />
                </div>
              ))}
            </div>
          )}
        </div>
      </SwipeLayout>
    </TBShell>
  )
}
