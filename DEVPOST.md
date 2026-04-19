# Spoločné výdavky — Shared Expenses for Tatra Banka

**HackKosice 2026 · Tatra Banka Challenge**
**Live:** https://spolocne-vydavky-ppypl.ondigitalocean.app

---

## What We Built

A native-feeling shared expenses feature designed to live inside the Tatra Banka mobile app. We cloned the exact Tatra Banka UI aesthetic — dark mode, blue accents, flat transaction rows — so it feels like a natural extension of the bank, not a third-party bolt-on.

The core idea: split bills with family, roommates, or friends on a trip — and actually settle up, without leaving your bank app.

---

## Features (Shipped)

- **TABI-guided onboarding** — 3-slide welcome flow with the Tatra Banka mascot, phone-number login, no passwords
- **Home dashboard** — real-time balance teaser showing how much others owe you across all groups
- **Groups** — create family, roommates, or trip groups; each with its own expense ledger
- **Group detail** — per-member balances, automatic debt simplification (greedy algorithm), and one-tap settle
- **Add expense** — equal, fixed-amount, or percentage split between any group members
- **Real data** — MongoDB Atlas backend, all groups and expenses persisted

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Next.js API Routes, Mongoose |
| Database | MongoDB Atlas |
| Hosting | DigitalOcean App Platform |

---

## What We're Still Thinking About

The foundation is solid, but there's more we'd build given more time:

- **In-app payment** — trigger a real Tatra Banka transfer to settle a debt directly from the group screen, using PSD2 PIS (Payment Initiation Service). The OAuth scaffolding is already there.
- **Bill scanning** — point camera at a receipt, OCR parses line items, assign each item to a person
- **Voice summary** — ElevenLabs integration: "You owe Martin €48 for petrol, and Jana owes you €85 from the ski trip" — one tap, spoken aloud
- **Smart split suggestions** — based on who ordered what, dietary preferences, or past behavior
- **Push notifications** — remind group members when they owe money

---

## Demo Login

Phone: `+421 900 000 001`

---

*Built at HackKosice 2026 in 24 hours.*
