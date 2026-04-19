import type { Role } from '@/types'

const CONFIG: Record<Role, { label: string; bg: string; color: string }> = {
  admin:  { label: 'Admin',  bg: '#1c3a5e', color: '#0a84ff' },
  member: { label: 'Člen',   bg: '#2c2c2e', color: '#8e8e93' },
  junior: { label: 'Junior', bg: '#1a3a1e', color: '#30d158' },
}

export default function RoleBadge({ role }: { role: Role }) {
  const { label, bg, color } = CONFIG[role]
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  )
}
