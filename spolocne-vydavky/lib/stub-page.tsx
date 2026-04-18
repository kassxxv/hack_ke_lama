import TBShell from '@/components/TBShell'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function StubPage({ title }: { title: string }) {
  return (
    <TBShell>
      <div className="px-4 pt-3">
        <div className="flex items-center mb-8" style={{ position: 'relative' }}>
          <Link href="/" className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
          </Link>
          <h1 className="text-[17px] font-semibold text-white absolute left-1/2 -translate-x-1/2">{title}</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <div className="text-[17px] font-bold text-white mb-2">Už čoskoro</div>
          <div className="text-[14px]" style={{ color: '#8e8e93' }}>Táto sekcia bude dostupná čoskoro.</div>
        </div>
      </div>
    </TBShell>
  )
}
