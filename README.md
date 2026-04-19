# Spoločné výdavky

> Shared expenses — built into the Tatra Banka app experience.  
> **HackKosice 2026 · 24 hours · Tatra Banka Challenge**

**Live:** https://spolocne-vydavky-ppypl.ondigitalocean.app  
**Demo login:** `+421 900 000 001`

---

Banks see every transaction. They know what you spend. But they don't help you split it.

**Spoločné výdavky** is a shared expenses layer that fits naturally inside Tatra Banka — same dark aesthetic, same UX patterns. Create a group, add expenses, settle up. No external apps, no manual spreadsheets.

---

## What it does

- **Groups** — family, roommates, or friends. Role-based (admin / member / parent / child)
- **Expense splitting** — equal, custom amount, or custom percent. Debt algorithm minimises the number of transfers
- **Settle Up** — one tap marks a debt as settled, balances update instantly
- **Receipt scanning** — photograph a receipt, Gemini 2.5 Flash extracts line items, assign to people
- **Shared pot** — family groups contribute to a joint fund with a target and progress tracking
- **Subscriptions** — track Netflix, Spotify etc. per group — cost, who pays, next billing date
- **Budget limits** — set monthly category limits, get warned at 80%, flagged at 100%
- **SK / EN** — full bilingual UI, persisted per device

---

## Stack

Next.js 14 · TypeScript · Tailwind · MongoDB Atlas · DigitalOcean · Gemini 2.5 Flash

---

## Team

Filip · Archie · Ilya · Demyd — HackKosice 2026
