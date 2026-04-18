'use client'

import TBShell from '@/components/TBShell'
import { createGroup } from '@/lib/api'
import { ChevronLeft, Check, PiggyBank, Users, Plane } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

type AppGroupType = 'joint' | 'friends' | 'trip'

const GROUP_OPTIONS: {
  id: AppGroupType
  emoji: string
  icon: React.ElementType
  label: string
  subtitle: string
  features: string[]
  color: string
}[] = [
  {
    id: 'joint',
    emoji: '🏠',
    icon: PiggyBank,
    label: 'Spoločný účet',
    subtitle: 'Rodina · Spolubývajúci',
    features: ['Zdieľaný fond, do ktorého všetci prispievajú', 'Výdavky sa platia z fondu', 'Prehľad príspevkov každého člena'],
    color: '#30d158',
  },
  {
    id: 'friends',
    emoji: '👫',
    icon: Users,
    label: 'Skupina priateľov',
    subtitle: 'Priatelia · Kolegovia',
    features: ['Každý platí sám, sledujeme kto komu dlhuje', 'Jasný prehľad dlhov', 'Jednoduché vyrovnanie jedným kliknutím'],
    color: '#0a84ff',
  },
  {
    id: 'trip',
    emoji: '✈️',
    icon: Plane,
    label: 'Výlet / Udalosť',
    subtitle: 'Dočasná skupina · Cestovanie',
    features: ['Sleduje kto čo zaplatil za skupinu', 'Na konci ukáže % príspevok každého', 'Tlačidlo na okamžité vyrovnanie všetkých naraz'],
    color: '#bf5af2',
  },
]

function toDbType(t: AppGroupType) {
  if (t === 'joint') return 'family'
  return 'peers'
}

export default function NewGroupPage() {
  const router = useRouter()
  const { state } = useStore()
  const ME = state.currentUser
  const [step, setStep] = useState<1 | 2>(1)
  const [appType, setAppType] = useState<AppGroupType | null>(null)
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

  async function handleCreate() {
    if (!name.trim() || !appType || !ME) return
    const selected = GROUP_OPTIONS.find(o => o.id === appType)!
    await createGroup({
      name: name.trim(),
      type: toDbType(appType),
      emoji: selected.emoji,
      isTemporary: appType === 'trip',
      members: [{ userId: ME.id, name: ME.name, phone: ME.phone, avatarColor: ME.avatarColor, role: 'admin' }],
    })
    router.push('/groups')
  }

  const placeholders: Record<AppGroupType, string> = {
    joint: 'Napr. Rodina Novák 🏠',
    friends: 'Napr. Párty u Tomáša 🎉',
    trip: 'Napr. Výlet Tatry 🏔️',
  }

  return (
    <TBShell>
      <div className="px-4 pt-3 pb-8">
        {/* Header */}
        <div className="flex items-center mb-6" style={{ position: 'relative' }}>
          {step === 1 ? (
            <Link href="/groups" className="w-8 h-8 flex items-center justify-center">
              <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
            </Link>
          ) : (
            <button onClick={() => setStep(1)} className="w-8 h-8 flex items-center justify-center">
              <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
            </button>
          )}
          <h1 className="text-[17px] font-semibold text-white absolute left-1/2 -translate-x-1/2">
            Nová skupina
          </h1>
        </div>

        {step === 1 && (
          <>
            <div className="text-[15px] font-bold text-white mb-1">Aký typ skupiny?</div>
            <div className="text-[13px] mb-5" style={{ color: '#8e8e93' }}>
              Podľa toho nastavíme správny režim
            </div>

            <div className="space-y-3 mb-6">
              {GROUP_OPTIONS.map(({ id, emoji, label, subtitle, features, color }) => {
                const active = appType === id
                return (
                  <button
                    key={id}
                    onClick={() => setAppType(id)}
                    className="w-full p-4 rounded-2xl text-left transition-all"
                    style={{
                      background: '#1c1c1e',
                      border: active ? `1.5px solid ${color}` : '1px solid #38383a',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[28px] leading-none">{emoji}</span>
                      <div className="flex-1">
                        <div className="text-[15px] font-bold text-white">{label}</div>
                        <div className="text-[12px] mt-0.5" style={{ color: '#8e8e93' }}>{subtitle}</div>
                      </div>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: active ? color : '#2c2c2e', border: active ? 'none' : '1.5px solid #38383a' }}
                      >
                        {active && <Check size={12} color="#fff" strokeWidth={2.8} />}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {features.map(f => (
                        <div key={f} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                          <span className="text-[12px]" style={{ color: '#8e8e93' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => appType && setStep(2)}
              className="w-full py-4 rounded-2xl font-semibold text-[16px] transition-all"
              style={{ background: appType ? '#0a84ff' : '#2c2c2e', color: appType ? '#fff' : '#8e8e93' }}
            >
              Ďalej
            </button>
          </>
        )}

        {step === 2 && appType && (
          <>
            {/* Selected type badge */}
            <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl w-fit"
              style={{ background: '#1c1c1e' }}>
              <span className="text-[16px]">{GROUP_OPTIONS.find(o => o.id === appType)!.emoji}</span>
              <span className="text-[13px] font-medium" style={{ color: GROUP_OPTIONS.find(o => o.id === appType)!.color }}>
                {GROUP_OPTIONS.find(o => o.id === appType)!.label}
              </span>
            </div>

            <div className="text-[15px] font-bold text-white mb-3">Pomenuj skupinu</div>
            <input
              type="text"
              placeholder={placeholders[appType]}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-[15px] text-white outline-none mb-5"
              style={{ background: '#1c1c1e', border: '1px solid #38383a', caretColor: '#0a84ff' }}
              autoFocus
            />

            <div className="text-[15px] font-bold text-white mb-1">Pridaj členov</div>
            <div className="text-[13px] mb-3" style={{ color: '#8e8e93' }}>
              Menom alebo číslom
            </div>
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
              <button
                onClick={addInvite}
                className="px-4 py-3 rounded-2xl text-[14px] font-semibold"
                style={{ background: '#0a84ff', color: '#fff' }}
              >
                Pridať
              </button>
            </div>

            {invites.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {invites.map(inv => (
                  <span key={inv} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-white"
                    style={{ background: '#1c3a5e' }}>
                    {inv}
                    <button onClick={() => setInvites(prev => prev.filter(i => i !== inv))} className="text-[#8e8e93]">×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Trip hint */}
            {appType === 'trip' && (
              <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: '#2c1f3a', border: '1px solid #bf5af233' }}>
                <div className="text-[12px] font-semibold mb-0.5" style={{ color: '#bf5af2' }}>Dočasná skupina</div>
                <div className="text-[12px]" style={{ color: '#8e8e93' }}>
                  Skupina sa dá finalizovať keď je výlet hotový — ukáže kto prispel koľko % a vyrovná zostatky naraz.
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl font-semibold text-[15px]"
                style={{ background: '#1c1c1e', color: '#8e8e93', border: '1px solid #38383a' }}
              >
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
      </div>
    </TBShell>
  )
}
