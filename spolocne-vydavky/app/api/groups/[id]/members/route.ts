import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { GroupModel } from '@/models/Group'
import { UserModel } from '@/models/User'

const AVATAR_COLORS = ['#5B5EA6', '#9B5EA6', '#5EA6A0', '#A65E5E', '#A69B5E', '#5EA65E', '#A65E8F', '#5E8FA6']

const KNOWN_CONTACTS: { phone: string; name: string; avatarColor: string; userId: string }[] = [
  { phone: '+421 900 333 444', name: 'Archie', avatarColor: '#9B5EA6', userId: 'u2' },
  { phone: '+421 900 555 666', name: 'Lana',   avatarColor: '#5EA6A0', userId: 'u3' },
  { phone: '+421 900 777 888', name: 'Fox',    avatarColor: '#A65E5E', userId: 'u4' },
]

function digits(s: string): string {
  return (s ?? '').replace(/\D/g, '')
}

function phoneMatches(a: string, b: string): boolean {
  const da = digits(a); const db = digits(b)
  if (!da || !db) return false
  return da === db || da.endsWith(db) || db.endsWith(da)
}

type MemberSub = { userId: string; name: string; phone: string; avatarColor: string; role: string; contributed?: number }
type GroupDoc = { _id: { toString(): string }; type: string; members: MemberSub[] }

async function resolveContact(phone: string, nameHint?: string): Promise<MemberSub> {
  const normalized = phone.trim()

  // 1) Existing real user
  const users = await UserModel.find().lean() as { _id: { toString(): string }; name: string; phone: string; avatarColor: string }[]
  const realUser = users.find(u => phoneMatches(u.phone, normalized))
  if (realUser) {
    return {
      userId: realUser._id.toString(),
      name: realUser.name,
      phone: realUser.phone,
      avatarColor: realUser.avatarColor,
      role: 'member',
      contributed: 0,
    }
  }

  // 2) Known synthetic contact (Archie / Lana / Fox) — keeps userId stable across groups
  const known = KNOWN_CONTACTS.find(c => phoneMatches(c.phone, normalized))
  if (known) {
    return {
      userId: known.userId,
      name: known.name,
      phone: known.phone,
      avatarColor: known.avatarColor,
      role: 'member',
      contributed: 0,
    }
  }

  // 3) Reuse subdoc from another group so balances stay consistent
  const otherGroups = await GroupModel.find().lean() as GroupDoc[]
  for (const g of otherGroups) {
    const m = g.members.find(m => phoneMatches(m.phone, normalized))
    if (m) {
      return { userId: m.userId, name: m.name, phone: m.phone, avatarColor: m.avatarColor, role: 'member', contributed: 0 }
    }
  }

  // 4) Brand new guest
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
  return {
    userId: `g_${digits(normalized) || Date.now().toString(36)}`,
    name: (nameHint?.trim()) || normalized,
    phone: normalized,
    avatarColor: color,
    role: 'member',
    contributed: 0,
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const { phone, name, role } = await req.json() as { phone: string; name?: string; role?: string }

  if (!phone || digits(phone).length < 4) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
  }

  const group = await GroupModel.findById(id) as (GroupDoc & { save: () => Promise<unknown> }) | null
  if (!group) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const phoneExists = group.members.some(m => phoneMatches(m.phone, phone))
  if (phoneExists) return NextResponse.json({ error: 'already_member' }, { status: 409 })

  const member = await resolveContact(phone, name)

  // Catches: same person (same userId) already present under a different phone,
  // e.g. Lana known-contact u3 vs seeded u5 Lana in the peers group.
  if (group.members.some(m => m.userId === member.userId)) {
    return NextResponse.json({ error: 'already_member' }, { status: 409 })
  }
  if (group.members.some(m => m.name.toLowerCase() === member.name.toLowerCase())) {
    return NextResponse.json({ error: 'already_member' }, { status: 409 })
  }

  // Role normalization by group type — never let parent/child leak into peers groups.
  const peerRoles = ['admin', 'member']
  const familyRoles = ['parent', 'child', 'admin']
  if (group.type === 'family') {
    member.role = role && familyRoles.includes(role) ? role : 'child'
  } else {
    member.role = role && peerRoles.includes(role) ? role : 'member'
  }

  group.members.push(member)
  await group.save()

  return NextResponse.json({ ok: true, member })
}
