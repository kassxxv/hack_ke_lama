'use client'

import { useState } from 'react'
import { X, UserPlus, Trash2, ChevronDown } from 'lucide-react'
import type { Group, Role } from '@/types'
import { useLang } from '@/lib/use-lang'

const KNOWN_CONTACTS = [
  { phone: '+421 900 333 444', name: 'Archie', userId: 'u2' },
  { phone: '+421 900 555 666', name: 'Lana',   userId: 'u3' },
  { phone: '+421 900 777 888', name: 'Fox',    userId: 'u4' },
]

export default function ManageMembersSheet({
  group,
  currentUserId,
  onClose,
  onChange,
  onToast,
}: {
  group: Group
  currentUserId: string
  onClose: () => void
  onChange: () => Promise<void>
  onToast: (msg: string) => void
}) {
  const { t } = useLang()
  const isFamily = group.type === 'family'
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [rolePickerFor, setRolePickerFor] = useState<string | null>(null)

  const normalizeRole = (r: Role): Role => {
    if (isFamily) return r
    return (r === 'parent' || r === 'child' || r === 'junior') ? 'member' : r
  }

  const roleLabel = (r: Role): string => {
    const map = t.manageMembers
    return ({ parent: map.parent, child: map.child, admin: map.admin, junior: map.junior, member: map.member } as Record<Role, string>)[r] ?? r
  }

  const roleStyle = (r: Role): { bg: string; fg: string } => {
    switch (r) {
      case 'parent': return { bg: '#0a84ff22', fg: '#0a84ff' }
      case 'child':  return { bg: '#bf5af222', fg: '#bf5af2' }
      case 'admin':  return { bg: '#1c3a5e',   fg: '#0a84ff' }
      case 'junior': return { bg: '#1a3a1e',   fg: '#30d158' }
      default:       return { bg: '#2c2c2e',   fg: '#8e8e93' }
    }
  }

  async function addMember(p: string, n?: string) {
    if (busy) return
    const trimmed = p.trim()
    if (!trimmed || trimmed.replace(/\D/g, '').length < 4) {
      onToast(t.manageMembers.errInvalidPhone)
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/groups/${group.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmed, name: n }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'already_member') onToast(t.manageMembers.errAlready)
        else if (data.error === 'invalid_phone') onToast(t.manageMembers.errInvalidPhone)
        else onToast(t.manageMembers.errGeneric)
        return
      }
      setPhone('')
      setName('')
      onToast(t.manageMembers.added(data.member?.name ?? trimmed))
      await onChange()
    } catch {
      onToast(t.manageMembers.errGeneric)
    } finally {
      setBusy(false)
    }
  }

  async function removeMember(userId: string, label: string) {
    if (busy) return
    if (!confirm(t.manageMembers.confirmRemove(label))) return
    setBusy(true)
    try {
      const res = await fetch(`/api/groups/${group.id}/members/${userId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.error === 'has_open_debt') onToast(t.manageMembers.errOpenDebt)
        else if (data.error === 'has_contribution') onToast(t.manageMembers.errContribution)
        else onToast(t.manageMembers.errGeneric)
        return
      }
      onToast(t.manageMembers.removed(label))
      await onChange()
    } catch {
      onToast(t.manageMembers.errGeneric)
    } finally {
      setBusy(false)
    }
  }

  async function changeRole(userId: string, newRole: Role, label: string) {
    setRolePickerFor(null)
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/groups/${group.id}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) { onToast(t.manageMembers.errGeneric); return }
      onToast(t.manageMembers.roleChanged(label, roleLabel(newRole)))
      await onChange()
    } catch {
      onToast(t.manageMembers.errGeneric)
    } finally {
      setBusy(false)
    }
  }

  const familyRoles: Role[] = ['parent', 'child']
  const peerRoles: Role[] = ['admin', 'member']
  const roleChoices = isFamily ? familyRoles : peerRoles

  const presentPhones = new Set(group.members.map(m => m.user.phone.replace(/\D/g, '')))
  const presentUserIds = new Set(group.members.map(m => m.user.id))
  const presentNames = new Set(group.members.map(m => m.user.name.toLowerCase()))
  const quickAdds = KNOWN_CONTACTS.filter(c =>
    !presentUserIds.has(c.userId) &&
    !presentPhones.has(c.phone.replace(/\D/g, '')) &&
    !presentNames.has(c.name.toLowerCase())
  )

  return (
    <div
      className="fixed inset-0 z-[250] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl pb-8 overflow-y-auto max-h-[85vh]"
        style={{ background: '#1c1c1e' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: '#38383a' }} />
        </div>

        <div className="px-5 pb-3 flex items-start gap-3">
          <div className="flex-1">
            <div className="text-[17px] font-bold text-white">{t.manageMembers.title}</div>
            <div className="text-[12px] mt-0.5" style={{ color: '#8e8e93' }}>
              {t.manageMembers.subtitle} · {t.manageMembers.current(group.members.length)}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#2c2c2e' }}>
            <X size={16} color="#8e8e93" />
          </button>
        </div>

        {/* Members list */}
        <div className="px-5 mb-4">
          {group.members.map((m, i) => {
            const isMe = m.user.id === currentUserId
            const displayRole = normalizeRole(m.role)
            const rs = roleStyle(displayRole)
            const picking = rolePickerFor === m.user.id
            return (
              <div key={m.user.id} className="py-3"
                style={{ borderBottom: i < group.members.length - 1 ? '0.5px solid #38383a' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold text-white flex-shrink-0"
                    style={{ background: m.user.avatarColor }}>
                    {m.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-white truncate">
                        {isMe ? `${m.user.name} (${t.manageMembers.you})` : m.user.name}
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5 truncate" style={{ color: '#8e8e93' }}>
                      {m.user.phone}
                    </div>
                  </div>
                  {/* Role pill */}
                  <button
                    onClick={() => setRolePickerFor(picking ? null : m.user.id)}
                    disabled={isMe}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 transition-opacity"
                    style={{ background: rs.bg, color: rs.fg, opacity: isMe ? 0.6 : 1 }}
                  >
                    {roleLabel(displayRole)}
                    {!isMe && (
                      <ChevronDown size={11} strokeWidth={2.4}
                        style={{ transform: picking ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    )}
                  </button>
                  {!isMe && (
                    <button
                      onClick={() => removeMember(m.user.id, m.user.name.split(' ')[0])}
                      disabled={busy}
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#2c1c1c' }}
                    >
                      <Trash2 size={14} color="#ff3b30" />
                    </button>
                  )}
                </div>
                {picking && !isMe && (
                  <div className="flex gap-2 mt-2 ml-13 pl-13">
                    {roleChoices.map(r => {
                      const s = roleStyle(r)
                      const active = displayRole === r
                      return (
                        <button
                          key={r}
                          onClick={() => changeRole(m.user.id, r, m.user.name.split(' ')[0])}
                          className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
                          style={{
                            background: active ? s.fg : s.bg,
                            color: active ? '#fff' : s.fg,
                            border: `1px solid ${s.fg}55`,
                          }}
                        >
                          {roleLabel(r)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add member */}
        <div className="px-5">
          <div className="text-[13px] font-bold text-white mb-2 flex items-center gap-1.5">
            <UserPlus size={14} color="#0a84ff" /> {t.manageMembers.addHeading}
          </div>

          {quickAdds.length > 0 && (
            <>
              <div className="text-[11px] mb-1.5" style={{ color: '#8e8e93' }}>{t.manageMembers.quickAdd}</div>
              <div className="flex flex-wrap gap-2 mb-3">
                {quickAdds.map(c => (
                  <button
                    key={c.phone}
                    disabled={busy}
                    onClick={() => addMember(c.phone, c.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-white"
                    style={{ background: '#1c3a5e', border: '1px solid #0a84ff44' }}
                  >
                    <span>+ {c.name}</span>
                    <span className="font-mono text-[10px]" style={{ color: '#8ebbf0' }}>{c.phone.slice(-7)}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <input
            type="tel"
            placeholder={t.manageMembers.phonePlaceholder}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-[14px] text-white outline-none mb-2"
            style={{ background: '#2c2c2e', border: '1px solid #38383a', caretColor: '#0a84ff' }}
          />
          <input
            type="text"
            placeholder={t.manageMembers.namePlaceholder}
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-[14px] text-white outline-none mb-3"
            style={{ background: '#2c2c2e', border: '1px solid #38383a', caretColor: '#0a84ff' }}
          />
          <button
            onClick={() => addMember(phone, name)}
            disabled={busy || !phone.trim()}
            className="w-full py-3 rounded-2xl text-[14px] font-semibold transition-all"
            style={{
              background: (busy || !phone.trim()) ? '#2c2c2e' : '#0a84ff',
              color: (busy || !phone.trim()) ? '#8e8e93' : '#fff',
            }}
          >
            {busy ? t.manageMembers.adding : t.manageMembers.addBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
