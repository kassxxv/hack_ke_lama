'use client'

import TBShell from '@/components/TBShell'
import { ChevronLeft, LogOut, Globe } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Lang = 'sk' | 'en'

const T = {
  sk: {
    title: 'Nastavenia',
    language: 'Jazyk',
    profile: 'Profil',
    about: 'O aplikácii',
    version: 'Spoločné výdavky · v1.0',
    hackathon: 'HackKosice 2026 · Tatra Banka Challenge',
    logout: 'Odhlásiť sa',
    logoutConfirm: 'Naozaj sa chcete odhlásiť?',
  },
  en: {
    title: 'Settings',
    language: 'Language',
    profile: 'Profile',
    about: 'About',
    version: 'Shared Expenses · v1.0',
    hackathon: 'HackKosice 2026 · Tatra Banka Challenge',
    logout: 'Log out',
    logoutConfirm: 'Are you sure you want to log out?',
  },
}

export default function SettingsPage() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('sk')
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved) setLang(saved)
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(u => setUser(u)).catch(() => {})
  }, [])

  function toggleLang() {
    const next: Lang = lang === 'sk' ? 'en' : 'sk'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/onboarding')
  }

  const t = T[lang]

  return (
    <TBShell>
      <div className="px-4 pt-3 pb-10">
        {/* Header */}
        <div className="flex items-center mb-6" style={{ position: 'relative' }}>
          <Link href="/" className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
          </Link>
          <h1 className="text-[17px] font-semibold text-white absolute left-1/2 -translate-x-1/2">{t.title}</h1>
        </div>

        {/* Profile */}
        {user && (
          <div className="mb-6">
            <div className="text-[12px] uppercase tracking-wide font-semibold mb-2" style={{ color: '#8e8e93' }}>{t.profile}</div>
            <div className="rounded-2xl px-4 py-4 flex items-center gap-3" style={{ background: '#1c1c1e' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-bold text-white flex-shrink-0" style={{ background: '#5B5EA6' }}>
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="text-[16px] font-semibold text-white">{user.name}</div>
                <div className="text-[13px]" style={{ color: '#8e8e93' }}>{user.phone}</div>
              </div>
            </div>
          </div>
        )}

        {/* Language */}
        <div className="mb-6">
          <div className="text-[12px] uppercase tracking-wide font-semibold mb-2" style={{ color: '#8e8e93' }}>{t.language}</div>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#1c1c1e' }}>
            <button
              onClick={toggleLang}
              className="w-full flex items-center justify-between px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <Globe size={20} color="#0a84ff" />
                <span className="text-[15px] text-white">{lang === 'sk' ? '🇸🇰 Slovenčina' : '🇬🇧 English'}</span>
              </div>
              <div className="flex rounded-full p-0.5 gap-0.5" style={{ background: '#2c2c2e' }}>
                <div
                  className="px-3 py-1 rounded-full text-[12px] font-semibold transition-all"
                  style={{ background: lang === 'sk' ? '#0a84ff' : 'transparent', color: lang === 'sk' ? '#fff' : '#8e8e93' }}
                >SK</div>
                <div
                  className="px-3 py-1 rounded-full text-[12px] font-semibold transition-all"
                  style={{ background: lang === 'en' ? '#0a84ff' : 'transparent', color: lang === 'en' ? '#fff' : '#8e8e93' }}
                >EN</div>
              </div>
            </button>
          </div>
        </div>

        {/* About */}
        <div className="mb-8">
          <div className="text-[12px] uppercase tracking-wide font-semibold mb-2" style={{ color: '#8e8e93' }}>{t.about}</div>
          <div className="rounded-2xl px-4 py-3 space-y-2" style={{ background: '#1c1c1e' }}>
            <div className="flex justify-between items-center">
              <span className="text-[14px] text-white">{t.version}</span>
            </div>
            <div className="text-[12px]" style={{ color: '#8e8e93' }}>{t.hackathon}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full py-4 rounded-2xl font-semibold text-[16px] flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: '#3a1c1c', color: '#ff3b30', border: '1px solid #ff3b3033' }}
        >
          <LogOut size={18} />
          {loggingOut ? '...' : t.logout}
        </button>
      </div>
    </TBShell>
  )
}
