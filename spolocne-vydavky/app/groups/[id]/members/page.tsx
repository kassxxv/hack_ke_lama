'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, UserPlus, Trash2, ChevronDown, Check } from 'lucide-react'
import TBShell from '@/components/TBShell'
import { useStore } from '@/lib/store'
import { useLang } from '@/lib/use-lang'
import type { Group, Member, Role } from '@/types'

const ROLE_COLORS: Record<Role, { color: string; bg: string }> = {
  admin:  { color: '#0a84ff', bg: '#1c3a5e' },
  member: { color: '#8e8e93', bg: '#2c2c2e' },
  junior: { color: '#30d158', bg: '#1a3a1e' },
  parent: { color: '#bf5af2', bg: '#2c1f3a' },
  child:  { color: '#30d158', bg: '#1a3a1e' },
}

const ALL_ROLES: Role[] = ['admin', 'member', 'junior', 'parent', 'child']

function RolePicker({ current, labels, onSelect, onClose }: {
  current: Role
  labels: Record<Role, { label: string; desc: string }>
  onSelect: (r: Role) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-[430px] rounded-t-3xl pb-8" style={{ background: '#1c1c1e' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-10 h-1 rounded-full" style={{ background: '#38383a' }} />
        </div>
        <div className="text-[17px] font-semibold text-white text-center mb-4">Zmeniť rolu</div>
        {ALL_ROLES.map((r, i) => {
          const { color, bg } = ROLE_COLORS[r]
          const { label, desc } = labels[r]
          return (
            <button key={r} onClick={() => onSelect(r)} className="flex items-center gap-3 w-full px-5 py-4"
              style={{ borderTop: i > 0 ? '0.5px solid #38383a' : 'none' }}>
              <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 w-16 text-center" style={{ background: bg, color }}>{label}</span>
              <span className="flex-1 text-[14px] text-white text-left">{desc}</span>
              {current === r && <Check size={18} color="#0a84ff" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function MembersPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { state } = useStore()
  const { t } = useLang()
  const ME = state.currentUser?.id ?? ''
  const tm = t.members

  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [addRole, setAddRole] = useState<Role>('member')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [toast, setToast] = useState('')
  const [rolePickerFor, setRolePickerFor] = useState<string | null>(null)
  const [addRolePicker, setAddRolePicker] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/groups/${id}`)
      .then(r => r.json())
      .then(d => { setGroup(d.group ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!toast) return
    const h = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(h)
  }, [toast])

  async function handleAdd() {
    if (!phone.trim()) return
    setAdding(true)
    setAddError('')
    const res = await fetch(`/api/groups/${id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, role: addRole }),
    })
    const data = await res.json()
    if (!res.ok) {
      setAddError(data.error === 'Already a member' ? tm.errorAlready :
        data.error === 'User not found' ? tm.errorNotFound : data.error)
      setAdding(false)
      return
    }
    setPhone('')
    setToast(tm.added(data.user.name))
    const refreshed = await fetch(`/api/groups/${id}`).then(r => r.json())
    setGroup(refreshed.group ?? null)
    setAdding(false)
  }

  async function handleRoleChange(userId: string, role: Role) {
    setRolePickerFor(null)
    const res = await fetch(`/api/groups/${id}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) { setToast('Chyba — skús znova'); return }
    setGroup(g => g ? { ...g, members: g.members.map(m => m.user.id === userId ? { ...m, role } : m) } : g)
    setToast(tm.roleChanged)
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Odstrániť ${name} zo skupiny?`)) return
    setRemoving(userId)
    const res = await fetch(`/api/groups/${id}/members/${userId}`, { method: 'DELETE' })
    if (!res.ok) { setRemoving(null); setToast('Chyba — skús znova'); return }
    setGroup(g => g ? { ...g, members: g.members.filter(m => m.user.id !== userId) } : g)
    setToast(tm.removed(name))
    setRemoving(null)
  }

  if (loading) {
    return <TBShell><div className="p-8 text-center" style={{ color: '#8e8e93' }}>{t.common.loading}</div></TBShell>
  }

  const roleInfo = (r: Role) => ({ ...ROLE_COLORS[r], ...tm.roles[r] })

  return (
    <TBShell>
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-white z-50"
          style={{ background: '#1c1c1e', border: '1px solid #38383a' }}>
          {toast}
        </div>
      )}

      {rolePickerFor && (
        <RolePicker
          current={group?.members.find(m => m.user.id === rolePickerFor)?.role ?? 'member'}
          labels={tm.roles}
          onSelect={r => handleRoleChange(rolePickerFor, r)}
          onClose={() => setRolePickerFor(null)}
        />
      )}

      {addRolePicker && (
        <RolePicker
          current={addRole}
          labels={tm.roles}
          onSelect={r => { setAddRole(r); setAddRolePicker(false) }}
          onClose={() => setAddRolePicker(false)}
        />
      )}

      <div className="px-4 pt-3 pb-10">
        <div className="flex items-center mb-6" style={{ position: 'relative' }}>
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
          </button>
          <h1 className="text-[17px] font-semibold text-white absolute left-1/2 -translate-x-1/2">{tm.title}</h1>
        </div>

        <div className="text-[12px] uppercase tracking-wide font-semibold mb-2" style={{ color: '#8e8e93' }}>
          {group?.name} · {t.membersCount(group?.members.length ?? 0)}
        </div>

        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#1c1c1e' }}>
          {(group?.members ?? []).map((m: Member, i: number) => {
            const ri = roleInfo(m.role)
            const isMe = m.user.id === ME
            return (
              <div key={m.user.id} className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < (group?.members.length ?? 1) - 1 ? '0.5px solid #38383a' : 'none' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0"
                  style={{ background: m.user.avatarColor }}>
                  {m.user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-white truncate">
                    {isMe ? tm.me(m.user.name) : m.user.name}
                  </div>
                  <div className="text-[12px] truncate" style={{ color: '#8e8e93' }}>{m.user.phone}</div>
                </div>
                <button onClick={() => setRolePickerFor(m.user.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: ri.bg }}>
                  <span className="text-[11px] font-semibold" style={{ color: ri.color }}>{ri.label}</span>
                  <ChevronDown size={10} color={ri.color} strokeWidth={2.5} />
                </button>
                {!isMe && (
                  <button onClick={() => handleRemove(m.user.id, m.user.name)}
                    disabled={removing === m.user.id}
                    className="ml-1 w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 disabled:opacity-40"
                    style={{ background: '#3a1c1c' }}>
                    <Trash2 size={14} color="#ff3b30" strokeWidth={2} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-[12px] uppercase tracking-wide font-semibold mb-2" style={{ color: '#8e8e93' }}>
          {tm.addMember}
        </div>
        <div className="rounded-2xl p-4 mb-3" style={{ background: '#1c1c1e' }}>
          <input type="tel" placeholder={tm.phonePlaceholder} value={phone}
            onChange={e => { setPhone(e.target.value); setAddError('') }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full px-3 py-3 rounded-xl text-[15px] text-white outline-none mb-3"
            style={{ background: '#2c2c2e', border: '1px solid #38383a', caretColor: '#0a84ff' }}
          />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px]" style={{ color: '#8e8e93' }}>{tm.roleLabel}</span>
            <button onClick={() => setAddRolePicker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: ROLE_COLORS[addRole].bg }}>
              <span className="text-[12px] font-semibold" style={{ color: ROLE_COLORS[addRole].color }}>
                {tm.roles[addRole].label}
              </span>
              <ChevronDown size={11} color={ROLE_COLORS[addRole].color} strokeWidth={2.5} />
            </button>
          </div>
          {addError && <p className="text-[12px] mb-2" style={{ color: '#ff3b30' }}>{addError}</p>}
          <button onClick={handleAdd} disabled={adding || !phone.trim()}
            className="w-full py-3 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: '#0a84ff' }}>
            <UserPlus size={16} strokeWidth={2} />
            {adding ? tm.adding : tm.addBtn}
          </button>
        </div>

        <p className="text-center text-[12px]" style={{ color: '#3a3a3c' }}>{tm.phoneHint}</p>
      </div>
    </TBShell>
  )
}
