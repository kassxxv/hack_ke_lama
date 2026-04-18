'use client'

import TBShell from '@/components/TBShell'
import { useStore } from '@/lib/store'
import { ChevronLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GroupType } from '@/types'

const GROUP_TYPES: { type: GroupType; emoji: string; label: string; desc: string }[] = [
  { type: 'family',    emoji: '🏠', label: 'Rodina',          desc: 'Spoločný rozpočet, vreckové, úlohy pre deti' },
  { type: 'roommates', emoji: '🛋️', label: 'Spolubývajúci',   desc: 'Nájom, energie, spoločné nákupy' },
  { type: 'peers',     emoji: '✈️', label: 'Skupina',         desc: 'Výlet, udalosť, predplatné — dočasná skupina' },
]

const ME = { id: 'u1', name: 'Marek Novák', phone: '+421 900 111 222', avatarColor: '#5B5EA6' }

export default function NewGroupPage() {
  const { dispatch } = useStore()
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [groupType, setGroupType] = useState<GroupType | null>(null)
  const [name, setName] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [invites, setInvites] = useState<string[]>([])

  function addInvite() {
    const v = inviteInput.trim()
    if (v && !invites.includes(v)) {
      setInvites(prev => [...prev, v])
      setInviteInput('')
    }
  }

  function handleCreate() {
    if (!name.trim() || !groupType) return
    dispatch({
      type: 'ADD_GROUP',
      group: {
        id: `g${Date.now()}`,
        name: name.trim(),
        type: groupType,
        emoji: GROUP_TYPES.find(t => t.type === groupType)?.emoji ?? '👥',
        totalOwed: 0,
        isTemporary: groupType === 'peers',
        members: [{ user: ME, role: 'admin', balance: 0 }],
      },
    })
    router.push('/groups')
  }

  return (
    <TBShell>
      <div className="px-4 pt-3">
        <div className="flex items-center mb-6" style={{ position: 'relative' }}>
          <Link href="/groups" className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
          </Link>
          <h1 className="text-[17px] font-semibold text-white absolute left-1/2 -translate-x-1/2">Nová skupina</h1>
        </div>

        {step === 1 && (
          <>
            <div className="text-[15px] font-bold text-white mb-4">Aký typ skupiny?</div>
            <div className="space-y-3 mb-6">
              {GROUP_TYPES.map(({ type, emoji, label, desc }) => (
                <button
                  key={type}
                  onClick={() => setGroupType(type)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                  style={{ background: '#1c1c1e', border: groupType === type ? '1px solid #0a84ff' : '1px solid #38383a' }}
                >
                  <div className="text-3xl">{emoji}</div>
                  <div className="flex-1">
                    <div className="text-[15px] font-semibold text-white">{label}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: '#8e8e93' }}>{desc}</div>
                  </div>
                  {groupType === type && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#0a84ff' }}>
                      <Check size={13} color="#fff" strokeWidth={2.5} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => groupType && setStep(2)}
              className="w-full py-4 rounded-2xl font-semibold text-[16px]"
              style={{ background: groupType ? '#0a84ff' : '#2c2c2e', color: groupType ? '#fff' : '#8e8e93' }}
            >
              Ďalej
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-[15px] font-bold text-white mb-3">Pomenuj skupinu</div>
            <input
              type="text"
              placeholder="Napr. Výlet Tatry 🏔️"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-[15px] text-white outline-none mb-5"
              style={{ background: '#1c1c1e', border: '1px solid #38383a', caretColor: '#0a84ff' }}
              autoFocus
            />

            <div className="text-[15px] font-bold text-white mb-1">Pridaj členov</div>
            <div className="text-[13px] mb-3" style={{ color: '#8e8e93' }}>Menom alebo číslom — bez zadávania IBAN</div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="+421 900 000 000 alebo meno"
                value={inviteInput}
                onChange={e => setInviteInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addInvite()}
                className="flex-1 px-4 py-3 rounded-2xl text-[14px] text-white outline-none"
                style={{ background: '#1c1c1e', border: '1px solid #38383a', caretColor: '#0a84ff' }}
              />
              <button onClick={addInvite} className="px-4 py-3 rounded-2xl text-[14px] font-semibold" style={{ background: '#0a84ff', color: '#fff' }}>
                Pridať
              </button>
            </div>

            {invites.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {invites.map(inv => (
                  <span key={inv} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-white" style={{ background: '#1c3a5e' }}>
                    {inv}
                    <button onClick={() => setInvites(prev => prev.filter(i => i !== inv))} className="text-[#8e8e93]">×</button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl font-semibold text-[15px]" style={{ background: '#1c1c1e', color: '#8e8e93', border: '1px solid #38383a' }}>
                Späť
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-4 rounded-2xl font-semibold text-[15px]"
                style={{ background: name.trim() ? '#0a84ff' : '#2c2c2e', color: name.trim() ? '#fff' : '#8e8e93' }}
              >
                Vytvoriť
              </button>
            </div>
          </>
        )}
        <div className="h-4" />
      </div>
    </TBShell>
  )
}
