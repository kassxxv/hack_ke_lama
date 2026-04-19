# HackKosice 2026 — Team Brief

## Event
- **Dates:** April 18–19, 2026 · Košice, Slovakia
- **Format:** 24-hour hackathon
- **Deadline:** Sunday April 19, noon
- **Judging:** Originality, Impact, Technical Complexity, Presentation

---

## Project: Spoločné výdavky (Shared Expenses)
**Challenge:** Tatra Banka — build a shared expenses feature natively integrated into their app.

**Live deploy:** https://spolocne-vydavky-ppypl.ondigitalocean.app (auto-deploys from `filip-def` branch)
**Repo:** https://github.com/kassxxv/hack_ke_lama · branch `filip-def`
**App folder:** `/spolocne-vydavky`

---

## What's Built (Frontend — Filip)
Next.js 14 PWA with Tatra Banka UI clone. Already deployed on DigitalOcean.

### Screens done
| Route | Screen |
|---|---|
| `/` | TB Home — balance, transactions, swipe left → groups |
| `/groups` | Groups list with balances, swipe right → home |
| `/groups/[id]` | Group detail — members, "Kto komu dlhuje", expenses |
| `/groups/new` | Create group — type picker + invite by name/phone |
| `/add-expense` | Add expense — amount, who paid, split type, members |
| `/transaction/[id]` | TB Transaction detail + "Rozdeliť výdavok" CTA |
| `/api/tb/auth` | TB OAuth2 redirect (AISP) |
| `/api/tb/callback` | TB OAuth2 token exchange |
| `/api/tb/transactions` | Fetch TB transactions (returns mock if no token) |

### State
Currently uses **in-memory React Context + localStorage**. Ready to swap to real API calls — see contracts below.

### Tech stack
- Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion
- Deployed: DigitalOcean App Platform (Dockerfile in `/spolocne-vydavky/Dockerfile`)

---

## What Backend Needs to Build

### Priority 1 — Core API (needed for demo)

#### Auth
```
POST /api/auth/login     { phone: string } → { token: string, user: User }
GET  /api/auth/me        → User
```

#### Groups
```
GET    /api/groups              → Group[]
POST   /api/groups              { name, type, emoji, isTemporary } → Group
GET    /api/groups/:id          → Group (with members + balances)
POST   /api/groups/:id/members  { phone: string } → Member
```

#### Expenses
```
GET    /api/groups/:id/expenses → Expense[]
POST   /api/groups/:id/expenses { amount, paidBy, splits, merchant, category, date } → Expense
POST   /api/expenses/:id/settle { fromId, toId } → Expense
```

#### Transactions (TB API proxy)
```
GET /api/transactions  → Transaction[]   (proxies TB sandbox AISP or returns mock)
```

### Priority 2 — TB API (for Tatra Banka prize)
TB developer portal: https://developer.tatrabanka.sk
- App registered: Client ID `l70e6799a14d3c4ad1b3f2301615e7573a`
- APIs subscribed: TatraPayPlus v1.5.2 + PSD2 BGS TB Accounts API v1.1
- OAuth2 flow: authorization_code, scope=AISP
- Token URL: `https://api.tatrabanka.sk/tatrapayplus/sandbox/auth/oauth/v2/token`
- **Need from portal Wiki:** exact authorize URL + accounts/transactions endpoint URL
- Frontend OAuth callback is at `/api/tb/callback` (already built)

### Priority 3 — MongoDB Atlas (for MongoDB prize)
Collections needed:
```
users      { _id, name, phone, avatarColor, createdAt }
groups     { _id, name, type, emoji, isTemporary, memberIds[], createdAt }
members    { groupId, userId, role, balance }
expenses   { _id, groupId, amount, paidBy, splits[], merchant, category, date, isPersonal }
splits     { userId, amount, settled }
```

---

## Data Types Contract
Full types in `/spolocne-vydavky/types/index.ts`. Key shapes:

```typescript
type GroupType = 'family' | 'roommates' | 'peers'
type Role = 'admin' | 'member' | 'junior'
type SplitType = 'equal' | 'amount' | 'percent'

type User    = { id: string; name: string; phone: string; avatarColor: string }
type Member  = { user: User; role: Role; balance: number }
type Group   = { id: string; name: string; type: GroupType; members: Member[]; totalOwed: number; isTemporary: boolean; emoji: string }
type Expense = { id: string; groupId: string; amount: number; paidBy: string; splits: Split[]; merchant: string; date: string; isPersonal: boolean; category: string }
type Split   = { userId: string; amount: number; settled: boolean }
```

---

## Prize Tracks Status
| Prize | Status | What's needed |
|---|---|---|
| **DigitalOcean** ✅ | Deployed at spolocne-vydavky.ondigitalocean.app | Done |
| **MongoDB Atlas** ⏳ | Backend needs to connect Atlas | Backend task |
| **ElevenLabs** ⏳ | Voice button exists in Group Detail UI | Needs ElevenLabs SDK call |
| **Tatra Banka** ⏳ | OAuth scaffolded, TB API endpoints need correct URLs | Both |

---

## How to Run Locally
```bash
cd spolocne-vydavky
npm install
npm run dev   # → http://localhost:3000
```

Env vars needed (create `.env.local`):
```
TB_CLIENT_ID=l70e6799a14d3c4ad1b3f2301615e7573a
TB_CLIENT_SECRET=1a0f7ebde40d4fb3b90ea72734ee8fbe
TB_REDIRECT_URI=http://localhost:3000/api/tb/callback
TB_TOKEN_URL=https://api.tatrabanka.sk/tatrapayplus/sandbox/auth/oauth/v2/token
TB_ACCOUNTS_BASE=https://api.tatrabanka.sk/premium/sandbox/v1
```

---

## Remaining Frontend Tasks
1. **ElevenLabs voice** — "Hlasové zhrnutie" button in Group Detail (`/app/groups/[id]/page.tsx:50`) needs SDK call
2. **Swap mock store for real API** — replace `useStore()` calls with `fetch('/api/...')` once backend is ready
3. **Onboarding** — 3-screen TABI mascot flow (`/app/onboarding`)

---

_Last updated: 2026-04-18 · Branch: filip-def_
