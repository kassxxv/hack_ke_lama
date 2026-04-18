import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { StoreProvider } from '@/lib/store'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Spoločné výdavky',
  description: 'Rozdeľte výdavky jednoducho s priateľmi, rodinou a spolubývajúcimi.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Výdavky',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" className={inter.variable}>
      <body><StoreProvider>{children}</StoreProvider></body>
    </html>
  )
}
