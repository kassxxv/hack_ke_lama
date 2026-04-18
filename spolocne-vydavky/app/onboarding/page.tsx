'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function TBLogo() {
  return (
    <svg width="140" height="100" viewBox="0 0 140 100" fill="none">
      {/* Outer rectangle border */}
      <rect x="1" y="1" width="98" height="68" stroke="white" strokeWidth="2.2" fill="none" />
      {/* Triple diagonal slashes */}
      <line x1="10" y1="69" x2="54" y2="1" stroke="white" strokeWidth="12" strokeLinecap="butt" />
      <line x1="32" y1="69" x2="76" y2="1" stroke="white" strokeWidth="12" strokeLinecap="butt" />
      <line x1="54" y1="69" x2="98" y2="1" stroke="white" strokeWidth="12" strokeLinecap="butt" />
      {/* Black mask so TB text reads cleanly */}
      <rect x="57" y="28" width="44" height="38" fill="black" />
      {/* TB text */}
      <text x="61" y="61" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontSize="30" fontWeight="800" fill="white">TB</text>
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
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: '#000000' }}
    >
      {/* Logo area — top half */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8">
        <TBLogo />
        <div className="mt-6 text-center">
          <div
            className="text-[13px] font-bold tracking-[4px] uppercase mb-6"
            style={{ color: '#ffffff' }}
          >
            TATRA BANKA
          </div>
          <div className="text-[13px]" style={{ color: '#ffffff', opacity: 0.45, letterSpacing: '1px' }}>
            Spoločné výdavky
          </div>
        </div>
      </div>

      {/* Auth area — bottom */}
      <div className="px-6 pb-12 flex flex-col gap-4">
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
            style={{
              background: '#111111',
              border: '1px solid #2c2c2e',
              caretColor: '#1762D9',
            }}
          />
          {error && (
            <p className="text-[13px] mt-2" style={{ color: '#ff3b30' }}>{error}</p>
          )}
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
