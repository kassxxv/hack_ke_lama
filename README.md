# Spoločné výdavky

Shared expenses app built for the **Tatra Banka challenge** at HackKosice 2026.

**Live:** https://spolocne-vydavky-ppypl.ondigitalocean.app
**Demo login:** `+421 900 000 001`

---

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** + shadcn/ui
- **MongoDB Atlas** (Mongoose)
- **DigitalOcean App Platform** (auto-deploys from `filip-def`)

---

## Running Locally

```bash
cd spolocne-vydavky
npm install
npm run dev        # → http://localhost:3000
```

Create `.env.local`:
```
MONGODB_URI=your_atlas_uri
```

Seed the DB (run once):
```
GET http://localhost:3000/api/seed
```

---

## What's Built

| Route | Screen |
|---|---|
| `/onboarding` | TABI mascot welcome + phone login |
| `/` | Home dashboard — balance, transactions, groups teaser |
| `/groups` | Groups list with total balance |
| `/groups/[id]` | Group detail — members, debts, expenses |
| `/groups/new` | Create group (family / roommates / trip) |
| `/add-expense` | Add expense with equal / amount / percent split |
| `/transaction/[id]` | Transaction detail with split CTA |

### API Routes

```
POST /api/auth/login           { phone } → sets sv_user_id cookie
GET  /api/auth/me              → current user
GET  /api/groups               → all groups with computed balances
POST /api/groups               → create group
GET  /api/groups/[id]          → group + expenses + balances
GET  /api/groups/[id]/expenses → expense list
POST /api/groups/[id]/expenses → add expense
POST /api/groups/[id]/settle   → settle debt between two users
GET  /api/seed                 → reset + seed demo data
```

---

## What's Not There Yet

- **In-app payment** — settling a debt via real Tatra Banka PIS transfer (PSD2 OAuth scaffolded, sandbox auth wasn't resolving in time)
- **Bill scanning** — OCR receipt → line-item split
- **Voice summary** — ElevenLabs "You owe X €Y for Z"
- **Push notifications** — debt reminders

---

## Repo Structure

```
hack_ke_lama/
└── spolocne-vydavky/       ← Next.js app
    ├── app/                ← Pages + API routes
    ├── components/         ← TBShell, GroupCard, ExpenseRow, etc.
    ├── lib/                ← store, mongoose, debt algorithm
    ├── models/             ← User, Group, Expense (Mongoose)
    └── types/              ← Shared TypeScript types
```
