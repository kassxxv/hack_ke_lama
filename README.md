# Spoločné výdavky — Shared Expenses

> Built at **HackKosice 2026** · 24 hours · Tatra Banka Challenge · Košice, Slovakia

**Live:** https://spolocne-vydavky-ppypl.ondigitalocean.app  
**Demo login:** `+421 900 000 001`

---

## The Problem

**25%** of people use payment links — but find them too limited.  
**60%** manage shared expenses manually or rely on external apps.  
**15%** don't track them at all.

Banks see every transaction. They know what you spend. But they don't help you split it.

---

## Our Solution

A shared expenses feature that lives **inside** the Tatra Banka app — same design language, same dark aesthetic, zero friction. Beyond just splitting — it helps users **track and manage** shared finances across groups, subscriptions, and a shared pot.

**Select a purpose → Create your group → Invite members → Manage expenses instantly.**

---

## What's Actually Built

### Groups & Members
- Create groups — **family**, **roommates**, or **peers/trip**
- Role system: admin / member / junior / parent / child (stored in DB, shown in UI)
- Joint account view for family groups — shared pot with balance and target

### Expense Splitting
- Add expenses with **equal**, **custom amount**, or **custom percent** splits
- Live per-person calculation as you type
- Server-side debt algorithm minimises total number of transfers needed
- One-tap **Settle Up** — marks splits as settled, updates balances in real time

### Receipt Scanning
- Upload or photograph a paper receipt
- **Gemini 2.5 Flash** parses the image → extracts line items automatically
- Tap to assign each item to the person who ordered it
- Sends the calculated split to the whole group instantly
- Falls back to a mock receipt if Gemini is not configured

### Group Subscriptions
- Add shared subscriptions (Netflix, Spotify, etc.)
- Track: monthly cost, who pays, who it's shared with, next billing date
- Credentials vault per subscription (show/hide password)
- Full CRUD — create and delete from the UI

### Shared Pot (Family groups)
- Members contribute money to a shared fund
- Track contributed amount per member with progress bars
- Set a pot target and see how close the group is

### Expense Report
- Per-group report view at `/groups/[id]/report`

### Bilingual UI
- Full **Slovak / English** translations across all screens
- Language toggle persisted in localStorage

### Onboarding
- TABI-guided onboarding flow on first launch

---

## What's Not Built Yet

| Feature | Status | Notes |
|---|---|---|
| **Voice summary** | Button exists, shows "coming soon" | ElevenLabs SDK not integrated |
| **Real bank transfer** | Settle Up tracks debt in DB only | No actual payment triggered |
| **Spending limits & alerts** | Designed in slides, not implemented | No budget cap or push notifications |
| **Debt reminders** | Not implemented | No scheduled notifications |
| **Tatra Banka OAuth** | Route scaffolded, not wired | No real TB API connection |
| **Analytics** | Stub page ("Coming soon") | — |
| **Cards / Bank / Pay tabs** | Stub pages | Tatra Banka nav shell only |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | MongoDB Atlas (Mongoose) |
| Hosting | DigitalOcean App Platform |
| Receipt OCR | Google Gemini 2.5 Flash |
| Design | Tatra Banka aesthetic — pure black, blue CTAs, clean cards |

---

## Design System

Pixel-matched to Tatra Banka's real mobile app:

| Token | Value | Usage |
|---|---|---|
| Background | `#000000` | Pure black — body and pages |
| Surface | `#1c1c1e` | Cards, action buttons |
| Blue | `#0a84ff` | CTAs, active nav, charts |
| Green | `#30d158` | Positive balances, income |
| Red | `#ff3b30` | Debts, negative amounts |
| Muted | `#8e8e93` | Labels, subtitles |

Font: **Inter** — large hero numbers with EUR suffix, monospace for row alignment.

---

## API Routes

```
GET/POST  /api/groups                    — list and create groups
GET       /api/groups/[id]               — group detail with computed balances
PATCH     /api/groups/[id]               — update group (pot balance, settings)
GET/POST  /api/groups/[id]/members       — view and manage group members
GET/POST  /api/groups/[id]/expenses      — list and add expenses
GET/POST  /api/groups/[id]/subscriptions — list and add subscriptions
DELETE    /api/groups/[id]/subscriptions/[subId] — delete subscription
POST      /api/scan-receipt              — parse receipt image via Gemini
GET       /api/health                    — DB connection health check
POST      /api/seed                      — seed realistic demo data
```

---

## Team

Built in 24 hours at HackKosice 2026 for the Tatra Banka Challenge.
