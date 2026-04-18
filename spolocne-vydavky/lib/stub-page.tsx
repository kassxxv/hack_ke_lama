'use client'

import TBShell from '@/components/TBShell'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getLang } from '@/lib/i18n'

const TITLES: Record<string, { sk: string; en: string }> = {
  Karty:    { sk: 'Karty',    en: 'Cards' },
  Banka:    { sk: 'Banka',    en: 'Bank' },
  Prehľady: { sk: 'Prehľady', en: 'Analytics' },
  Platba:   { sk: 'Platba',   en: 'Pay' },
}

export default function StubPage({ title }: { title: string }) {
  const [lang, setLang] = useState<'sk' | 'en'>('sk')

  useEffect(() => {
    setLang(getLang(localStorage.getItem('lang') ?? undefined))
  }, [])

  const translatedTitle = TITLES[title]?.[lang] ?? title
  const comingSoon = lang === 'en' ? 'Coming soon' : 'Už čoskoro'
  const subtitle = lang === 'en' ? 'This section will be available soon.' : 'Táto sekcia bude dostupná čoskoro.'

  return (
    <TBShell>
      <div className="px-4 pt-3">
        <div className="flex items-center mb-8" style={{ position: 'relative' }}>
          <Link href="/" className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
          </Link>
          <h1 className="text-[17px] font-semibold text-white absolute left-1/2 -translate-x-1/2">{translatedTitle}</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <div className="text-[17px] font-bold text-white mb-2">{comingSoon}</div>
          <div className="text-[14px]" style={{ color: '#8e8e93' }}>{subtitle}</div>
        </div>
      </div>
    </TBShell>
  )
}
