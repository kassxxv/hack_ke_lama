'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Plus, Eye, EyeOff, Copy, Trash2, Check, X } from 'lucide-react'
import TBShell from '@/components/TBShell'
import { useLang } from '@/lib/use-lang'
import { useStore } from '@/lib/store'
import { fetchSubscriptions, createSubscription, deleteSubscription } from '@/lib/api'
import type { Group, Subscription } from '@/types'

const EMOJI_OPTIONS = ['💳', '🎬', '🎵', '📺', '☁️', '🎮', '📚', '🏋️', '📰', '🍿']

export default function SubscriptionsPage() {
  const { t } = useLang()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const groupId = params.id
  const { state } = useStore()
  const ME = state.currentUser?.id ?? ''

  const [group, setGroup] = useState<Group | null>(null)
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const gRes = await fetch(`/api/groups/${groupId}`).then(r => r.json())
        const subList = await fetchSubscriptions(groupId)
        if (cancelled) return
        setGroup(gRes.group ?? null)
        setSubs(subList)
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [groupId])

  useEffect(() => {
    if (!toast) return
    const h = setTimeout(() => setToast(''), 2000)
    return () => clearTimeout(h)
  }, [toast])

  const monthlyTotal = useMemo(() => subs.reduce((s, x) => s + (x.monthlyCost || 0), 0), [subs])

  function toggleReveal(id: string) {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      setToast(t.subscriptions.copied)
    } catch { /* ignore */ }
  }

  async function handleDelete(subId: string) {
    if (!window.confirm(t.subscriptions.deleteConfirm)) return
    await deleteSubscription(groupId, subId)
    setSubs(prev => prev.filter(s => s.id !== subId))
    setToast(t.subscriptions.deleted)
  }

  async function handleCreate(data: Omit<Subscription, 'id' | 'groupId' | 'createdAt'>) {
    const created = await createSubscription(groupId, data)
    setSubs(prev => [...prev, created])
    setSheetOpen(false)
  }

  if (loading) {
    return (
      <TBShell>
        <div className="p-8 text-center" style={{ color: '#8e8e93' }}>{t.common.loading}</div>
      </TBShell>
    )
  }

  if (!group) {
    return (
      <TBShell>
        <div className="p-8 text-center" style={{ color: '#8e8e93' }}>{t.common.error}</div>
      </TBShell>
    )
  }

  return (
    <TBShell>
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-2xl text-[13px] font-medium text-white z-[80]"
          style={{ background: '#1c1c1e', border: '1px solid #38383a' }}>
          {toast}
        </div>
      )}

      <div className="px-4 pt-3">
        {/* Header */}
        <div className="flex items-center mb-5" style={{ position: 'relative' }}>
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={22} color="#0a84ff" strokeWidth={2.2} />
          </button>
          <h1 className="text-[17px] font-semibold text-white absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
            {t.subscriptions.title}
          </h1>
          <button
            onClick={() => setSheetOpen(true)}
            className="ml-auto w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#0a84ff' }}
          >
            <Plus size={18} color="#fff" strokeWidth={2.5} />
          </button>
        </div>

        {/* Group label */}
        <div className="text-center text-[13px] mb-5" style={{ color: '#8e8e93' }}>
          {group.emoji} {group.name}
        </div>

        {/* Monthly total hero */}
        <div className="text-center mb-6">
          <div className="text-[13px] mb-1.5" style={{ color: '#8e8e93' }}>{t.subscriptions.monthlyTotal}</div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-[38px] font-bold tracking-tight leading-none text-white">
              {monthlyTotal.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[20px] font-semibold" style={{ color: '#8e8e93' }}>EUR</span>
          </div>
          {group.members.length > 1 && monthlyTotal > 0 && (
            <div className="text-[12px] mt-1" style={{ color: '#30d158' }}>
              ≈ {t.subscriptions.perPerson((monthlyTotal / group.members.length).toFixed(2).replace('.', ','))}
            </div>
          )}
        </div>

        {subs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <div className="text-[16px] font-bold text-white mb-2">{t.subscriptions.empty}</div>
            <div className="text-[13px] mb-6 max-w-[280px]" style={{ color: '#8e8e93' }}>
              {t.subscriptions.emptyHint}
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              className="px-6 py-3 rounded-2xl font-semibold text-[15px] text-white"
              style={{ background: '#0a84ff' }}
            >
              {t.subscriptions.addCta}
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {subs.map(sub => {
              const payer = group.members.find(m => m.user.id === sub.paidBy)
              const sharedCount = sub.sharedWith.length || group.members.length
              const isRevealed = revealed.has(sub.id)
              return (
                <div key={sub.id} className="rounded-2xl p-4" style={{ background: '#1c1c1e' }}>
                  {/* Header row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[22px] flex-shrink-0"
                      style={{ background: '#2c2c2e' }}>
                      {sub.emoji || '💳'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-white truncate">{sub.name}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: '#8e8e93' }}>
                        {t.subscriptions.membersBadge(sharedCount)}
                        {sub.nextBillingDate ? ` · ${t.subscriptions.nextBilling}: ${sub.nextBillingDate}` : ''}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[15px] font-mono font-semibold text-white">
                        {sub.monthlyCost.toFixed(2).replace('.', ',')} €
                      </div>
                      <div className="text-[11px]" style={{ color: '#8e8e93' }}>/mo</div>
                    </div>
                  </div>

                  {/* Payer */}
                  {payer && (
                    <div className="flex items-center gap-2 mb-3 text-[12px]" style={{ color: '#8e8e93' }}>
                      <span>{t.subscriptions.paidByLabel}:</span>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: payer.user.avatarColor }}>
                        {payer.user.name.charAt(0)}
                      </div>
                      <span className="text-white text-[12px] font-medium">
                        {payer.user.id === ME ? t.common.you : payer.user.name.split(' ')[0]}
                      </span>
                    </div>
                  )}

                  {/* Credentials */}
                  {(sub.username || sub.password) && (
                    <div className="rounded-xl p-3 mb-3" style={{ background: '#2c2c2e' }}>
                      <div className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: '#8e8e93' }}>
                        {t.subscriptions.credentials}
                      </div>
                      {sub.username && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px]" style={{ color: '#8e8e93' }}>{t.subscriptions.username}</div>
                            <div className="text-[13px] text-white font-mono truncate">{sub.username}</div>
                          </div>
                          <button
                            onClick={() => copy(sub.username)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: '#38383a' }}
                            aria-label={t.subscriptions.copy}
                          >
                            <Copy size={14} color="#0a84ff" />
                          </button>
                        </div>
                      )}
                      {sub.password && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px]" style={{ color: '#8e8e93' }}>{t.subscriptions.password}</div>
                            <div className="text-[13px] text-white font-mono truncate">
                              {isRevealed ? sub.password : '•'.repeat(Math.min(sub.password.length, 12))}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleReveal(sub.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: '#38383a' }}
                            aria-label={isRevealed ? t.subscriptions.hide : t.subscriptions.show}
                          >
                            {isRevealed ? <EyeOff size={14} color="#0a84ff" /> : <Eye size={14} color="#0a84ff" />}
                          </button>
                          <button
                            onClick={() => copy(sub.password)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: '#38383a' }}
                            aria-label={t.subscriptions.copy}
                          >
                            <Copy size={14} color="#0a84ff" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: '#8e8e93' }}>
                      {t.subscriptions.securityNote}
                    </span>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ml-2"
                      style={{ background: '#ff3b3022' }}
                      aria-label={t.common.remove}
                    >
                      <Trash2 size={13} color="#ff3b30" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="h-4" />
      </div>

      {sheetOpen && (
        <AddSubscriptionSheet
          group={group}
          me={ME}
          onClose={() => setSheetOpen(false)}
          onSave={handleCreate}
        />
      )}
    </TBShell>
  )
}

function AddSubscriptionSheet({
  group,
  me,
  onClose,
  onSave,
}: {
  group: Group
  me: string
  onClose: () => void
  onSave: (data: Omit<Subscription, 'id' | 'groupId' | 'createdAt'>) => Promise<void>
}) {
  const { t } = useLang()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0])
  const [cost, setCost] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [paidBy, setPaidBy] = useState(me || group.members[0]?.user.id || '')
  const [sharedWith, setSharedWith] = useState<Set<string>>(new Set(group.members.map(m => m.user.id)))
  const [nextBillingDate, setNextBillingDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const monthly = parseFloat(cost.replace(',', '.')) || 0

  function toggleMember(id: string) {
    setSharedWith(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError(t.subscriptions.nameRequired)
      return
    }
    setError('')
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        emoji,
        monthlyCost: monthly,
        username: username.trim(),
        password,
        paidBy,
        sharedWith: [...sharedWith],
        nextBillingDate: nextBillingDate.trim(),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl pb-8 overflow-y-auto max-h-[90vh]"
        style={{ background: '#1c1c1e' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: '#38383a' }} />
        </div>

        <div className="flex items-center px-5 pb-4">
          <div className="text-[17px] font-semibold text-white">{t.subscriptions.addTitle}</div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#2c2c2e' }}>
            <X size={16} color="#8e8e93" />
          </button>
        </div>

        <div className="px-5 space-y-4">
          {/* Emoji picker */}
          <div>
            <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>
              {t.subscriptions.emojiLabel}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-[20px]"
                  style={{
                    background: emoji === e ? '#0a84ff22' : '#2c2c2e',
                    border: emoji === e ? '1px solid #0a84ff' : '1px solid transparent',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>
              {t.subscriptions.nameLabel}
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.subscriptions.namePlaceholder}
              className="w-full px-4 py-3 rounded-2xl text-[15px] text-white outline-none"
              style={{ background: '#2c2c2e', caretColor: '#0a84ff' }}
            />
          </div>

          {/* Monthly cost */}
          <div>
            <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>
              {t.subscriptions.monthlyCostLabel}
            </div>
            <div className="flex items-baseline gap-2 rounded-2xl px-4 py-3" style={{ background: '#2c2c2e' }}>
              <input
                type="text"
                inputMode="decimal"
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder={t.subscriptions.costPlaceholder}
                className="flex-1 bg-transparent text-[22px] font-bold text-white outline-none w-full"
                style={{ caretColor: '#0a84ff' }}
              />
              <span className="text-[16px] font-semibold" style={{ color: '#8e8e93' }}>EUR</span>
            </div>
          </div>

          {/* Username */}
          <div>
            <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>
              {t.subscriptions.username}
            </div>
            <input
              type="text"
              autoComplete="off"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-[15px] text-white outline-none font-mono"
              style={{ background: '#2c2c2e', caretColor: '#0a84ff' }}
            />
          </div>

          {/* Password */}
          <div>
            <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>
              {t.subscriptions.password}
            </div>
            <div className="flex items-center gap-2 rounded-2xl pr-2" style={{ background: '#2c2c2e' }}>
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="flex-1 px-4 py-3 bg-transparent text-[15px] text-white outline-none font-mono"
                style={{ caretColor: '#0a84ff' }}
              />
              <button
                onClick={() => setShowPw(v => !v)}
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: '#38383a' }}
                aria-label={showPw ? t.subscriptions.hide : t.subscriptions.show}
              >
                {showPw ? <EyeOff size={15} color="#0a84ff" /> : <Eye size={15} color="#0a84ff" />}
              </button>
            </div>
          </div>

          {/* Next billing date */}
          <div>
            <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>
              {t.subscriptions.nextBillingLabel}
            </div>
            <input
              type="date"
              value={nextBillingDate}
              onChange={e => setNextBillingDate(e.target.value)}
              placeholder={t.subscriptions.nextBillingPlaceholder}
              className="w-full px-4 py-3 rounded-2xl text-[15px] text-white outline-none"
              style={{ background: '#2c2c2e', caretColor: '#0a84ff', colorScheme: 'dark' }}
            />
          </div>

          {/* Paid by */}
          <div>
            <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>
              {t.subscriptions.paidByPicker}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {group.members.map(m => (
                <button
                  key={m.user.id}
                  onClick={() => setPaidBy(m.user.id)}
                  className="flex items-center gap-2 flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all"
                  style={{
                    background: paidBy === m.user.id ? '#0a84ff' : '#2c2c2e',
                    color: paidBy === m.user.id ? '#fff' : '#8e8e93',
                    border: paidBy === m.user.id ? 'none' : '1px solid #38383a',
                  }}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: m.user.avatarColor }}>
                    {m.user.name.charAt(0)}
                  </div>
                  {m.user.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Shared with */}
          <div>
            <div className="text-[12px] mb-1.5 uppercase tracking-wide font-semibold" style={{ color: '#8e8e93' }}>
              {t.subscriptions.sharedWithPicker}
            </div>
            <div className="space-y-2">
              {group.members.map(m => {
                const isSel = sharedWith.has(m.user.id)
                return (
                  <button
                    key={m.user.id}
                    onClick={() => toggleMember(m.user.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                    style={{
                      background: '#2c2c2e',
                      border: isSel ? '1px solid #0a84ff44' : '1px solid transparent',
                    }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                      style={{ background: m.user.avatarColor }}>
                      {m.user.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-[14px] font-medium text-white">{m.user.name}</div>
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isSel ? '#0a84ff' : '#38383a' }}>
                      {isSel && <Check size={13} color="#fff" strokeWidth={2.5} />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {error && <div className="text-[13px] text-[#ff3b30]">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-4 rounded-2xl font-semibold text-[16px] text-white transition-opacity"
            style={{ background: saving ? '#2c2c2e' : '#0a84ff', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? t.subscriptions.saving : t.subscriptions.saveBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
