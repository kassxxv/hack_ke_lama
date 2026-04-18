import Link from 'next/link'
import type { Group } from '@/types'
import RoleBadge from './RoleBadge'

interface GroupCardProps {
  group: Group
  currentUserId: string
}

export default function GroupCard({ group, currentUserId }: GroupCardProps) {
  const me = group.members.find(m => m.user.id === currentUserId)
  const balance = me?.balance ?? 0
  const isPositive = balance > 0
  const isNeutral = balance === 0

  return (
    <Link href={`/groups/${group.id}`}>
      <div className="flex items-center gap-3 py-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: '#1c1c1e' }}
        >
          {group.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-[15px] truncate">{group.name}</span>
            {me && <RoleBadge role={me.role} />}
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: '#8e8e93' }}>
            {group.members.length} členov
            {group.isTemporary && (
              <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: '#2c2c2e', color: '#8e8e93' }}>
                dočasná
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {isNeutral ? (
            <span className="text-[14px]" style={{ color: '#8e8e93' }}>Vyrovnaný</span>
          ) : (
            <>
              <div className={`text-[15px] font-semibold ${isPositive ? 'text-[#30d158]' : 'text-[#ff3b30]'}`}>
                {isPositive ? '+' : ''}{balance.toFixed(2).replace('.', ',')} EUR
              </div>
              <div className="text-[11px]" style={{ color: '#8e8e93' }}>
                {isPositive ? 'dostaneš' : 'dlhuješ'}
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
