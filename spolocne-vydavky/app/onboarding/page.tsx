'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function BackgroundLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 390 500"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <line x1="-40" y1="500" x2="220" y2="-40" stroke="white" strokeWidth="52" strokeOpacity="0.04" />
      <line x1="60" y1="500" x2="320" y2="-40" stroke="white" strokeWidth="52" strokeOpacity="0.04" />
      <line x1="160" y1="500" x2="420" y2="-40" stroke="white" strokeWidth="52" strokeOpacity="0.04" />
    </svg>
  )
}

export default function Onboarding() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!phone.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      if (!res.ok) {
        setError('Číslo nenájdené. Demo: +421 900 000 001')
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
    <div className="min-h-dvh flex flex-col relative overflow-hidden" style={{ background: '#000000' }}>

      {/* Background diagonal lines — TB slash motif */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-10%', height: '65%' }}>
        <BackgroundLines />
      </div>

      {/* Logo area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8 relative z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tb.png" alt="Tatra Banka" width={160} style={{ filter: 'brightness(0) invert(1)' }} />
        <div className="mt-10 text-center">
          <h1 className="text-[26px] font-bold text-white mb-2">Spoločné výdavky</h1>
          <p className="text-[14px]" style={{ color: '#8e8e93' }}>
            Rozdeľuj náklady jednoducho a prehľadne
          </p>
        </div>
      </div>

      {/* Auth area */}
      <div className="px-6 pb-12 flex flex-col gap-4 relative z-10">
        <div>
          <div className="text-[13px] mb-2 font-medium" style={{ color: '#8e8e93' }}>
            Telefónne číslo
          </div>
          <input
            type="tel"
            placeholder="+421 900 000 001"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoComplete="tel"
            className="w-full px-4 py-4 rounded-2xl text-[17px] text-white outline-none"
            style={{ background: '#111111', border: '1px solid #2c2c2e', caretColor: '#1762D9' }}
          />
          {error && <p className="text-[13px] mt-2" style={{ color: '#ff3b30' }}>{error}</p>}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !phone.trim()}
          className="w-full py-[17px] rounded-2xl text-[17px] font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ background: '#1762D9' }}
        >
          {loading ? 'Prihlasovanie…' : 'Pokračovať'}
        </button>

        <p className="text-center text-[12px]" style={{ color: '#3a3a3c' }}>
          Prihlásením súhlasíte s podmienkami používania Tatra Banky
        </p>
      </div>
    </div>
  )
}
