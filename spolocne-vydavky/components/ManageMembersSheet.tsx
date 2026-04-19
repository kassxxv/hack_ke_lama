'use client'

import { useState, useEffect } from 'react'
import { X, UserPlus, Trash2, ChevronDown } from 'lucide-react'
import { useLang } from '@/lib/use-lang'
import type { Role } from '@/types'

type UserEntry = {
  id: string
  name: string
  phone: string
  avatarColor: string
  isMember: boolean
}

const ROLES: Role[] = ['admin', 'member', 'junior', 'parent', 'child']

export default function ManageMembersSheet({
  groupId,
  currentUserId,
  onClose,
  onChanged,
}: {
  groupId: string
  currentUserId: string
  onClose: () => void
  onChanged: (msg: string) => void
}) {
  const { t } = useLang()
  const mm = t.manageMembers
  const [users, setUsers] = useState<UserEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [roleOpen, setRoleOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/groups/${groupId}/members`)
      .then(r => r.json())
      .then((data: unknown) => { if (Array.isArray(data)) setUsers(data as UserEntry[]) })
      .finally(() => setLoading(false))
  }, [groupId])

  async function patch(body: Record<string, unknown>, userId: string) {
    setBusy(userId)
    await fetch(`/api/groups/${groupId}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const fresh = await fetch(`/api/groups/${groupId}/members`).then(r => r.json())
    if (Array.isArray(fresh)) setUsers(fresh as UserEntry[])
    setBusy(null)
  }

  async function add(u: UserEntry) {
    await patch({ action: 'add', userId: u.id, name: u.name, phone: u.phone, avatarColor: u.avatarColor }, u.id)
    onChanged(mm.added(u.name.split(' ')[0]))
  }

  async function remove(u: UserEntry) {
    if (!confirm(mm.confirmRemove(u.name.split(' ')[0]))) return
    await patch({ action: 'remove', userId: u.id }, u.id)
    onChanged(mm.removed(u.name.split(' ')[0]))
  }

  async function changeRole(u: UserEntry, role: Role) {
    setRoleOpen(null)
    await patch({ action: 'role', userId: u.id, role }, u.id)
    onChanged(mm.roleChanged(u.name.split(' ')[0], role))
  }

  const members = users.filter(u => u.isMember)
  const others = users.filter(u => !u.isMember)

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      admin: mm.admin, member: mm.member, junior: mm.junior, parent: mm.parent, child: mm.child,
    }
    return map[role] ?? role
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-[430px] rounded-t-3xl overflow-y-auto"
        style={{ background: '#1c1c1e', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#38383a' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <div className="text-[17px] font-bold text-white">{mm.title}</div>
            <div className="text-[12px] mt-0.5" style={{ color: '#8e8e93' }}>{mm.current(members.length)}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#2c2c2e' }}>
            <X size={16} color="#8e8e93" />
          </button>
        </div>

        <div style={{ height: '0.5px', background: '#38383a', margin: '0 0 4px' }} />

        {loading ? (
          <div className="py-10 text-center text-[14px]" style={{ color: '#8e8e93' }}>Načítavam…</div>
        ) : (
          <div className="pb-10">
            {/* Current members */}
            <div className="px-5 pt-3 pb-1 text-[12px] font-semibold uppercase tracking-wide" style={{ color: '#8e8e93' }}>
              {mm.current(members.length)}
            </div>
            {members.map((u, i) => {
              const isMe = u.id === currentUserId
              return (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3"
                  style={{ borderTop: i > 0 ? '0.5px solid #38383a' : 'none' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0"
                    style={{ background: u.avatarColor }}>
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white">{isMe ? mm.you : u.name.split(' ')[0]}</div>
                    <div className="text-[11px]" style={{ color: '#8e8e93' }}>{u.phone}</div>
                  </div>
                  {/* Role picker */}
                  <div className="relative">
                    <button
                      onClick={() => setRoleOpen(roleOpen === u.id ? null : u.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: '#2c2c2e', color: '#0a84ff' }}
                    >
                      {roleLabel('member')}
                      <ChevronDown size={11} />
                    </button>
                    {roleOpen === u.id && (
                      <div className="absolute right-0 top-8 z-10 rounded-2xl overflow-hidden shadow-xl"
                        style={{ background: '#2c2c2e', minWidth: 130 }}>
                        {ROLES.map(r => (
                          <button key={r} onClick={() => changeRole(u, r)}
                            className="block w-full text-left px-4 py-2.5 text-[13px] text-white"
                            style={{ borderBottom: '0.5px solid #38383a' }}>
                            {roleLabel(r)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {!isMe && (
                    <button onClick={() => remove(u)} disabled={busy === u.id}
                      className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ background: '#ff3b3022' }}>
                      <Trash2 size={14} color="#ff3b30" />
                    </button>
                  )}
                </div>
              )
            })}

            {/* Add from existing users */}
            {others.length > 0 && (
              <>
                <div className="px-5 pt-5 pb-1 text-[12px] font-semibold uppercase tracking-wide" style={{ color: '#8e8e93' }}>
                  {mm.quickAdd}
                </div>
                {others.map((u, i) => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3"
                    style={{ borderTop: i > 0 ? '0.5px solid #38383a' : 'none', opacity: busy === u.id ? 0.5 : 1 }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0"
                      style={{ background: u.avatarColor }}>
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-white">{u.name.split(' ')[0]}</div>
                      <div className="text-[11px]" style={{ color: '#8e8e93' }}>{u.phone}</div>
                    </div>
                    <button onClick={() => add(u)} disabled={busy === u.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                      style={{ background: '#0a84ff22', color: '#0a84ff' }}>
                      <UserPlus size={13} />
                      Pridať
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
