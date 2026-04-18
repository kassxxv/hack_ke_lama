# CLAUDE.md — HackKosice 2026

## Event Context
- **Hackathon:** HackKosice 2026, April 18–19, Košice, Slovakia
- **Format:** 24-hour hackathon
- **Submission deadline:** Sunday, April 19, noon
- **Judging criteria:** Originality, Impact, Technical Complexity, Presentation

---

## Project: Shared Expenses App — Tatra Banka Challenge

### What We're Building
An app that simplifies shared expenses for groups (family, roommates, friends on trips, colleagues).
- Transparently manages shared finances
- Automatically calculates debts
- Makes settling payments easy and frictionless

### Sponsor: Tatra Banka
- Premium Slovak bank, strong design brand (black/white, minimalist, triple-slash logo)
- Has a mascot called **TABI** (colorful 3D robot) — can use as empty states, onboarding, loaders
- Existing app aesthetic: dark mode, donut charts, clean dashboard cards
- Tagline: "Spolu sme jedna banka" / "#prirodzenenajlepsi"

### Team Structure
- **This user:** Frontend only — builds all UI from Figma designs
- **Backend teammate:** Handles API routes, DB, auth — frontend should expose clear data contracts

---

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (never use `any`)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** MongoDB Atlas (Mongoose) — backend owns this
- **Hosting:** DigitalOcean App Platform — deploy landing page in first 4 hours
- **Voice:** ElevenLabs SDK — integrate in a core flow (e.g., voice summary of debts)

---

## Design System — Tatra Banka Aesthetic (verified from real screenshots)

### Exact Color Tokens
```
BG:           #000000  — pure black, body + page bg
Surface:      #1c1c1e  — cards, quick action buttons, CO2 card
Surface2:     #2c2c2e  — inner chips, secondary elements
Blue:         #0a84ff  — active nav, CTAs, links, chevrons, charts
White:        #ffffff  — primary text
Muted:        #8e8e93  — labels, subtitles, inactive nav
Red:          #ff3b30  — negative amounts, debit indicators
Green:        #30d158  — positive amounts, income
Divider:      #38383a  — thin 0.5px row separators
```

### Layout Rules (from real TB screenshots)
- **Balance on black** — the main account balance sits directly on #000000, NOT inside a card
- **Transaction rows are flat** — no card wrapper, just rows separated by 0.5px `#38383a` dividers on black bg
- **Section headers** — white bold left, blue "Všetky pohyby" right — no background
- **Quick action buttons** — row of square rounded icons (#1c1c1e bg, ~64×64), blue line-art icon on top, small white label below
- **Transaction row anatomy**: colored circle avatar (red circle with "–" for debit, green "+" for credit) | merchant bold white, card/date subtitle muted | amount red right-aligned, CO2 tiny below amount
- **Transaction detail anatomy**: "Suma" muted label → huge red amount ("– 12,33 EUR") → divider → PDF export button → CO2 card → flat detail rows (label left muted, value right white, thin dividers)
- **Month pill selector**: outlined pills (border white/muted), active = solid #0a84ff fill white text
- **Segment control**: pill outline buttons horizontally, active has dark bg (#1c1c1e) + white border

### Typography
- Font: **Inter** (clean, matches Tatra Banka's web)
- Balance: ~38–42px, bold, no font-mono (uses comma decimal: "320,59 EUR")
- "EUR" suffix: same line, muted gray, ~22–24px
- Headings: font-bold, tracking-tight
- Numbers/amounts in rows: font-mono for alignment, ~15px

### Design Principles
1. **Dark mode only** — matches Tatra Banka brand
2. **Numbers are heroes** — debt amounts must be instantly readable, large, clear
3. **Simplicity** — one action per screen, no clutter
4. **Frictionless settlement** — paying back should feel like one tap
5. **TABI mascot** — use for empty states and onboarding moments

### Core Screens (to be designed in Figma first)
1. **Home / Dashboard** — group list, total balance, who owes you
2. **Group Detail** — expenses list, per-person balances, settle button
3. **Add Expense** — amount, split type (equal / custom), participants
4. **Settle Up** — who pays whom, how much, confirm
5. **Activity Feed** — transaction history per group
6. **Onboarding** — TABI-guided, 2-3 screens max

---

## Figma MCP — Primary Workflow
Figma MCP is **installed and active**. Design happens in Figma first, then Claude converts to code.

**Workflow:**
1. Designer creates screen in Figma
2. User shares Figma URL with Claude
3. Claude calls `get_design_context` → generates exact component code
4. Claude adapts to: shadcn/ui components, project color tokens, TypeScript
5. User drops component into Next.js page

**When given a Figma URL:**
- Extract `fileKey` and `nodeId` from the URL
- Always pixel-match the design
- Prefer shadcn/ui primitives (Card, Button, Dialog, etc.) as base
- Output ready-to-use `.tsx` component files

---

## Frontend API Contract (for backend handoff)
When implementing UI, define data shapes clearly so backend teammate can match them:

```typescript
// Example — expose these types in /types/index.ts
type Group = { id: string; name: string; members: User[]; totalBalance: number }
type Expense = { id: string; amount: number; paidBy: string; splits: Split[]; date: string }
type Split = { userId: string; amount: number; settled: boolean }
```
Frontend uses mock data until backend routes are ready — never block on backend.

---

## Priority Prize Tracks
| Track | Integration | Deadline |
|---|---|---|
| **DigitalOcean** | Deploy landing page / MVP to App Platform | First 4 hours |
| **ElevenLabs** | Voice debt summary ("You owe Jan €12.50 for dinner") | Before submission |
| **MongoDB Atlas** | All groups/expenses/users stored in Atlas | Before submission |

---

## Claude Behavior Rules
- **No unnecessary comments** — well-named identifiers speak for themselves
- **Ship fast** — working code over perfect code, always
- **Reuse before building** — shadcn/ui first, then custom
- **Mobile-first** — design for 375px, scale up
- **Mock data first** — never block on backend; use realistic fake data
- **After every UI change** — one sentence describing what changed visually
- **Types in /types/index.ts** — keep data contracts centralized for backend handoff

---

## AI Tools
| Tool | Best For |
|---|---|
| **Claude** | Frontend, components, CSS, Figma-to-code, TypeScript |
| **Gemini** | Analyzing large codebases, multimodal tasks |
| **GPT** | Python scripts, fast prototyping |