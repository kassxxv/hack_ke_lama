'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Users, Zap, HandCoins } from 'lucide-react'

function TabiMascot({ size = 160 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      {/* Head */}
      <rect x="30" y="10" width="100" height="90" rx="28" fill="#5AC8C8" />
      {/* Eyes */}
      <circle cx="58" cy="48" r="14" fill="white" fillOpacity="0.9" />
      <circle cx="102" cy="48" r="14" fill="white" fillOpacity="0.9" />
      <circle cx="58" cy="48" r="7" fill="#2c7a7a" />
      <circle cx="102" cy="48" r="7" fill="#2c7a7a" />
      <circle cx="61" cy="45" r="3" fill="white" />
      <circle cx="105" cy="45" r="3" fill="white" />
      {/* Smile */}
      <path d="M62 76 Q80 90 98 76" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* Antenna */}
      <line x1="80" y1="10" x2="80" y2="0" stroke="#5AC8C8" strokeWidth="4" strokeLinecap="round" />
      <circle cx="80" cy="0" r="5" fill="#A78BFA" />
      {/* Body */}
      <rect x="38" y="108" width="84" height="46" rx="18" fill="#7C3AED" />
      {/* Dots */}
      <circle cx="58" cy="131" r="7" fill="#A78BFA" />
      <circle cx="80" cy="131" r="7" fill="#C4B5FD" />
      <circle cx="102" cy="131" r="7" fill="#A78BFA" />
      {/* Neck */}
      <rect x="68" y="98" width="24" height="14" rx="6" fill="#4AACAC" />
    </svg>
  )
}

const SLIDES = [
  {
    title: 'Vitaj u TABI!',
    subtitle: 'Tvoj asistent pre spoločné výdavky. Rozdeľuj náklady jednoducho a prehľadne.',
  },
  {
    title: 'Ako to funguje?',
    subtitle: null,
    bullets: [
      { icon: Users, text: 'Vytvor skupinu — rodina, spolubývajúci, výlet' },
      { icon: HandCoins, text: 'Pridaj výdavok a vyber, kto platí' },
      { icon: Zap, text: 'TABI vypočíta dlhy a navrhne vyrovnanie' },
    ],
  },
  {
    title: 'Zadaj svoje číslo',
    subtitle: 'Prihlás sa telefónnym číslom. Žiadne heslo, žiadna registrácia.',
  },
]

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const slide = SLIDES[step]

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      if (!res.ok) {
        setError('Číslo nebolo nájdené. Skús +421 900 000 001')
        setLoading(false)
        return
      }
      router.push('/')
    } catch {
      setError('Chyba pripojenia. Skús znova.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between px-6 py-12" style={{ background: '#000000' }}>

      {/* Skip */}
      <div className="w-full flex justify-end">
        {step < 2 && (
          <button onClick={() => setStep(2)} className="text-[14px]" style={{ color: '#8e8e93' }}>
            Preskočiť
          </button>
        )}
      </div>

      {/* TABI + content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-sm">
        <TabiMascot size={160} />

        <div className="text-center">
          <h1 className="text-[28px] font-bold text-white mb-3">{slide.title}</h1>
          {slide.subtitle && (
            <p className="text-[15px] leading-relaxed" style={{ color: '#8e8e93' }}>{slide.subtitle}</p>
          )}
          {slide.bullets && (
            <div className="flex flex-col gap-4 mt-2 text-left">
              {slide.bullets.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#1c1c1e' }}>
                    <Icon size={20} color="#0a84ff" />
                  </div>
                  <span className="text-[14px] text-white">{text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phone input on last slide */}
        {step === 2 && (
          <div className="w-full flex flex-col gap-3">
            <input
              type="tel"
              placeholder="+421 900 000 001"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl text-[16px] text-white outline-none"
              style={{ background: '#1c1c1e', border: '1px solid #38383a' }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className="text-[13px] text-center" style={{ color: '#ff3b30' }}>{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading || !phone.trim()}
              className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white disabled:opacity-40"
              style={{ background: '#0a84ff' }}
            >
              {loading ? 'Prihlasujem…' : 'Prihlásiť sa'}
            </button>
          </div>
        )}
      </div>

      {/* Dots + next button */}
      <div className="w-full flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === step ? 20 : 8,
                height: 8,
                background: i === step ? '#0a84ff' : '#38383a',
              }}
            />
          ))}
        </div>

        {step < 2 && (
          <button
            onClick={() => setStep(s => s + 1)}
            className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: '#1c1c1e' }}
          >
            Ďalej <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
