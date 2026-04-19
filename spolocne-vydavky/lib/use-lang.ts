'use client'

import { useEffect, useState } from 'react'
import { T, getLang, type Lang } from '@/lib/i18n'

export function useLang(): { lang: Lang; t: typeof T.sk } {
  const [lang, setLang] = useState<Lang>('sk')

  useEffect(() => {
    const read = () => setLang(getLang(localStorage.getItem('lang') ?? undefined))
    read()
    const onStorage = (e: StorageEvent) => { if (e.key === 'lang') read() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('lang-change', read)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('lang-change', read)
    }
  }, [])

  return { lang, t: T[lang] }
}
