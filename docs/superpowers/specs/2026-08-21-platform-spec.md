# RieltorApp Platform — Product Spec v1.0

**Date:** 2026-08-21
**Status:** approved for phased implementation
**Supersedes:** `2026-07-28-rieltor-generator-design.md` (demo scope)

---

## 1. What we are building

Three products that feed each other in a closed loop:

```
              ┌──────────────────────────────────────────┐
              │                                          │
              ▼                                          │
  A. MARKETPLACE  ──leads──▶  C. LEAD MARKET ──▶ B. CRM ──┘
  (public site)                (realtor buys)     (developer/agency
       ▲                            │              closes the deal)
       │                            ▼
       └────listings────  C. REALTOR TOOLKIT
                          (site generator, presentations)
```

The loop is what makes the business defensible. A marketplace alone is a
classifieds board; a CRM alone is software nobody discovers. Together, every
buyer who fills a quiz becomes inventory for the lead market, every developer on
the CRM becomes inventory for the marketplace, and every realtor becomes a
distribution channel for both.

### 1.1 Market position

The reference competitor is `uysot.uz` (analysed 2026-08-21). It runs the same
loop but has **61 residential complexes across all of Uzbekistan, ~23 of them in
Tashkent city**. By comparison Krisha.kz lists 3212 and Homsters.kz 1100 in
Kazakhstan. Uysot is a monopolist in an empty market, and the regions —
Samarkand, Bukhara, the Fergana valley, Navoi — are effectively uncovered.

**We compete in new builds AND secondary, starting from the regions.**

### 1.2 Our one structural advantage

No competitor in UZ/KZ/RU is Telegram-native. Realtors in this market actually
live in Telegram; every platform treats it as a share button. We already inject
per-listing OG tags server-side. Every feature below must answer: _does this
work when a realtor pastes a link into a Telegram chat?_

---

## 2. Design system

**Layout and widget placement: `cian.ru`. Colours, typography and radii: ours.**

We keep the existing palette (`--color-accent: #6d28d9` violet, grey `#f4f4f7`
surface, white cards, 18px card radius, Inter). We adopt CIAN's _information
architecture_ — what sits where, how dense a row is, what a seller panel
contains.

### 2.1 Global frame

| Element       | Spec                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Breakpoint    | Single desktop breakpoint at **1440px** (`desk:`). Below it, the existing 480px phone column is untouched.                     |
| Content width | Max 1440px, 32px side padding                                                                                                  |
| Header row 1  | Logo · (spacer) · AI-assistant pill · icon cluster (compare, chat, favourites, bell) · primary CTA button · "Kirish"           |
| Header row 2  | Horizontal section nav, borderless, active item tinted                                                                         |
| Filter bar    | Sticky third row on list pages: pill buttons, then free-text input, then region/district/metro links, then "Qidiruvni saqlash" |

### 2.2 Search-result row (the most important widget)

CIAN's result row is three columns. This is denser than a card grid and is the
layout we adopt for `/search` and all list pages:

```
┌─────────────┬────────────────────────────────┬──────────────────┐
│ photo 310px │ title (link, 20px bold)        │ ♡  ⇄             │
│             │ "2-xona, 49,7 m², 2/31-qavat"  │ [seller logo]    │
│ ┌──┬──┬──┐  │ [badge][badge][badge]          │ QURUVCHI         │
│ │  │  │  │  │ ЖК link                        │ Mangazeya        │
│ └──┴──┴──┘  │ 📍 metro · walk time           │ ✓ hujjat tekshir.│
│  thumbnails │ full address (grey)            │ barcha obyektlar │
│             │ PRICE 28px bold  [-10%]        │ ┌──────────────┐ │
│             │ price/m² (grey)                │ │ +998 90 ••• │ │
│             │ description, 4 lines clamped   │ └──────────────┘ │
│             │ "ЖК'da yana 7 ta"    2 hafta   │ [ Yozish ]       │
└─────────────┴────────────────────────────────┴──────────────────┘
```

Mandatory elements, because each one is a trust or conversion lever we currently
lack: photo-count/3D/video badges, promo badges, **masked phone** (reveal is a
tracked event), seller-type label, verification badge, "all objects by this
seller" link, relative freshness ("2 hafta oldin").

### 2.3 Listing detail

Left column ~700px, right column ~380px **sticky**:

- **Left:** breadcrumbs, view counter ("3407 marta ko'rildi, bugun 93"), title,
  address + "Xaritada", metro rows, action row (compare/share/print/complain),
  gallery with **Planirovka / Qavat rejasi** tabs and a thumbnail strip, then
  "Kvartira haqida" / "Uy haqida" as two definition lists.
- **Right (sticky):** price card — old price struck through, discount badge, big
  price, then stacked link rows (aksiya, ipoteka, m² narxi, bitim shartlari),
  primary button, secondary button, then a seller card with rating and stats.

This is already 80% built (see §7.1) — it needs the tabs, thumbnails,
definition lists and the badge/promo rows.

### 2.4 Home page

Full-bleed hero photo, centred heading, one big natural-language search bar with
an arrow submit and a "Xaritada" button, quick-filter pills underneath. Then
stacked widget bands, each a titled section:

1. "Sizga mos kelishi mumkin" — personalised 4-column card grid
2. "Ommabop turar-joy majmualari" — tinted band, horizontal carousel of complexes
3. Continued recommendation grid
4. Journal / region links / app download

### 2.5 Card (grid variant)

Borderless — image, heart top-right, price 20px bold, one grey spec line, geo
line with coloured icon, address. No border, no shadow, generous whitespace.
This replaces our current bordered `shadow-card` treatment **on desktop only**;
the phone card stays as it is.

---

## 3. Product A — Marketplace

### 3.1 Already built (demo scope)

Listings list, filters (deal/type/text/sort), search page with advanced filters,
favourites, listing detail with gallery and sticky CTA, contact, offer, 404,
view counter, Telegram OG injection, image pipeline, desktop layout at 1440px.

### 3.2 To build — parity with Uysot

| #   | Feature                                                                        | Notes                                                                         |
| --- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| A1  | Auth: phone OTP + **Telegram Login**                                           | Telegram first — it is our positioning                                        |
| A2  | User cabinet: profile, favourites, saved searches, chat, bonuses, referrals    |                                                                               |
| A3  | Listing creation wizard, 6 steps                                               | deal+category → location → parameters → photos → price → contacts             |
| A4  | **Voice input** for listing creation                                           | Web Speech API, Uzbek                                                         |
| A5  | **Telegram-bot listing creation**                                              | bot walks the same 6 steps                                                    |
| A6  | **AI description writer** ("Menga tavsif yozib ber")                           |                                                                               |
| A7  | Moderation queue                                                               | listing states: draft → moderation → published → archived                     |
| A8  | Masked phone + reveal tracking                                                 | the reveal event is the lead                                                  |
| A9  | In-platform chat (buyer ↔ seller)                                              |                                                                               |
| A10 | Map with clustered price pins                                                  |                                                                               |
| A11 | Mortgage calculator: 3 tabs, bank comparison table, full amortisation schedule |                                                                               |
| A12 | Residential-complex (ЖК) pages                                                 | documents, construction progress, installment terms, verified-developer badge |
| A13 | **Interactive site plan → building → floor → unit** (showroom)                 | SVG polygon hotspots over a render                                            |
| A14 | Floor-plan catalogue (`/planirovka`)                                           |                                                                               |
| A15 | Reels — short vertical video feed                                              |                                                                               |
| A16 | Journal / blog with SEO landing pages                                          |                                                                               |
| A17 | Multi-language UZ/RU/EN + currency switch                                      |                                                                               |
| A18 | Promoted listings ("TOP")                                                      |                                                                               |
| A19 | Referral programme + loyalty coin                                              |                                                                               |
| A20 | Mobile app (iOS/Android)                                                       | later phase                                                                   |

### 3.3 To build — features Uysot does NOT have

These are the wedge. Ranked by leverage:

| #       | Feature                                                                                       | Why it wins                                                                                                                                              |
| ------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A21** | **Free AI valuation** — "Uyingiz qancha turadi?" 3 questions, no documents, comparables-based | The #1 entry point for a seller. Krisha has it, Uysot has nothing. Runs in the Telegram bot too.                                                         |
| **A22** | **"Mening uyim" — owner cabinet**                                                             | Owner adds their property even when not selling; gets a monthly price update. Captures the seller _years_ before the transaction. Nobody in UZ has this. |
| **A23** | "Sotish yaxshimi yoki ijaraga berish?" income comparison                                      |                                                                                                                                                          |
| **A24** | Best-moment-to-sell forecast                                                                  |                                                                                                                                                          |
| **A25** | **Reverse listings — "Qidiryapman"**                                                          | Buyer posts requirements; this is free lead inventory that feeds the lead market.                                                                        |
| **A26** | Daily/short-term rent segment                                                                 |                                                                                                                                                          |
| **A27** | Foreign property (Dubai, Turkey)                                                              | Uzbeks buy there heavily                                                                                                                                 |
| **A28** | Ready-business and parking-space categories                                                   |                                                                                                                                                          |
| **A29** | Legal/cadastre check report                                                                   | Uysot only has a "cadastre yes/no" filter                                                                                                                |
| **A30** | Price history and district analytics                                                          |                                                                                                                                                          |
| **A31** | Auction for urgent sales                                                                      |                                                                                                                                                          |

**Explicitly deferred** (need partners, not code — see `deferred-features` memory):
title insurance, trade-in, general insurance, contractor-services marketplace.

---

## 4. Product B — Developer CRM

Target: full parity with `app.uysot.uz`, whose client bundle exposes **154
permission constants**. Grouped into shippable modules:

### 4.1 Sales core

- **Shaxmatka** — unit grid per building/floor/line, status colours, bulk edit
- **Showroom** — 3D render with clickable buildings → floors → units
- **Booking** — configurable hold duration, minimum price, cancellation reasons,
  per-user booking limits
- **Contracts** — templates, variations, multi-currency, auto-numbering,
  **online signing** with national ID (JSHSHIR) verification
- **Dynamic pricing** — rules + demand-based suggestions
- **Discounts** — fixed, percentage, time-limited promotions

### 4.2 Finance

- Payment schedules, prepayment, late-payment penalties and penalty waiver
- Multi-payment contracts, payment types, branch attribution
- Payment-provider integrations: Click, Payme, Uzum, Apelsin, Paylov
- QR payment
- 1C accounting export
- Debtor register + bulk SMS + task assignment

### 4.3 CRM / marketing

- Lead pipeline (voronka) with configurable stages
- Plan-vs-fact reporting, sales targets, employee KPI
- Omnichannel inbox: Telegram, Instagram, Facebook Lead Forms, WhatsApp, web forms
- IP telephony: call recording, click-to-call, missed-call follow-up
- Task engine: kanban, auto-tasks, triggers, robot calls
- Mandatory lead assignment rules

### 4.4 AI layer

- In-CRM assistant panel
- **Call analysis and manager scoring**
- Lead auto-fill and next-action suggestions
- Summary insights, macro analytics

### 4.5 Construction

- Live site cameras
- Construction stage reports by building
- Construction timeline published to the marketplace ЖК page

### 4.6 Administration

- Branches, granular role permissions, activity audit log
- Device limits, push notifications
- Custom report builder (Excel constructor), Power BI connector, open API

### 4.7 Gaps to add beyond Uysot

- **Transparent public pricing tiers** (Uysot hides pricing behind a demo form;
  Krisha publishes a three-tier matrix — copy Krisha)
- **Monthly performance report** delivered to the developer automatically
- **Social-media promotion as a service** (Instagram/TikTok + first-line lead
  qualification, like Krisha)
- **"Turnkey sales"** — our sales team sells the complex (like Homsters)
- Key-handover module
- Partner-solution marketplace + referral programme

---

## 5. Product C — Realtor platform

The least contested segment. Uysot's own lead market shows **0 leads in the
secondary tab** — the whole industry chases new builds because that is where the
developer pays. Secondary-market realtors currently work from OLX and Telegram
by hand.

| #   | Feature                                                                                                               | Reference                                   |
| --- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| C1  | **Site generator** — realtor gets `ali.domen.uz`, own logo, brand colour, own domain optional; catalogue auto-updates | Нмаркет "Сайт.ПРО", 4600 ₽/mo               |
| C2  | Embeddable catalogue widget + XML feed for external sites                                                             | Нмаркет "Каталог.ПРО" / "База.ПРО"          |
| C3  | **Client presentation** — pick units into a cart, send one link                                                       | Нмаркет / Profitbase                        |
| C4  | **Presentation analytics** — which unit the client opened, how long                                                   | Нмаркет "отслеживайте реакции"              |
| C5  | Telegram-native sharing of that presentation                                                                          | **ours alone**                              |
| C6  | **Client fixation with uniqueness check** against the developer's CRM                                                 | Profitbase — settles "whose client is this" |
| C7  | Commission visible per unit; filter the showcase **by commission**                                                    | Нмаркет                                     |
| C8  | **Immediate commission payout**, without waiting for the developer                                                    | Нмаркет                                     |
| C9  | Private notes on a listing                                                                                            | Krisha "Заметка"                            |
| C10 | Saved collections per client                                                                                          | Krisha "Подборка"                           |
| C11 | **AI social content** — ready Stories/posts per unit                                                                  | Нмаркет                                     |
| C12 | Sub-agent hierarchy                                                                                                   | Profitbase                                  |
| C13 | Training centre + certification                                                                                       | Нмаркет / CIAN "Суперагент"                 |
| C14 | Public realtor/agency profile with verification badge and rating                                                      | CIAN                                        |
| C15 | White-label agent cabinet branding                                                                                    | Profitbase                                  |
| C16 | **Lead market** — buy hot leads, per-lead price, conversion tracking                                                  | Uysot: 4795 leads, $2.25–3.75 each          |

---

## 6. Architecture

### 6.1 Keep

Yarn 4 workspaces + Turborepo; React 19 · Vite 6 · TypeScript · Tailwind v4 ·
React Router 7 · TanStack Query 5 · Feature-Sliced Design with ESLint
`boundaries` enforcement; NestJS 11 · Node 22 · Prisma 6 · PostgreSQL 16 · Zod
as the single source for env, DTO and Swagger; `@rieltor/shared` shared between
front and back.

### 6.2 Add

| Concern         | Choice                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Apps            | `apps/web` (marketplace), `apps/crm` (developer CRM), `apps/agent` (realtor cabinet), `apps/api`        |
| Auth            | Phone OTP + Telegram Login widget; JWT access/refresh; RBAC with granular permissions                   |
| Files           | S3-compatible object storage (MinIO in dev)                                                             |
| Search          | Postgres full-text first; migrate to a search engine only when listing count demands it                 |
| Maps            | Yandex Maps (best UZ coverage)                                                                          |
| Realtime        | WebSocket gateway for chat and lead notifications                                                       |
| Background jobs | BullMQ + Redis — image processing, price recalculation, monthly owner emails                            |
| AI              | **Google Gemini API** for description writing, valuation explanation, call analysis (chosen 2026-08-24) |
| Payments        | Click / Payme / Uzum                                                                                    |
| SMS             | Play Mobile or Eskiz                                                                                    |

### 6.3 Data model additions

Beyond today's `Agent` / `Listing` / `Image`:

`User`, `Session`, `Organization` (developer or agency), `Membership` (user↔org
with role), `Complex`, `Building`, `Floor`, `Unit`, `UnitStatus`, `Booking`,
`Contract`, `PaymentSchedule`, `Payment`, `Lead`, `LeadPurchase`, `Pipeline`,
`PipelineStage`, `Task`, `Call`, `Message`, `Presentation`,
`PresentationItem`, `PresentationView`, `Fixation`, `SavedSearch`,
`OwnedProperty` (for "Mening uyim"), `Valuation`, `PriceHistory`,
`WantedListing` (reverse listings), `AgentSite`, `Subscription`, `Invoice`.

---

## 7. Phasing

Each phase ships something usable on its own. **Each phase needs its own
implementation plan** — this spec is the source they all argue from.

### Phase 1 — Marketplace foundation _(plan written: `2026-08-21-phase-1-marketplace-foundation.md`)_

CIAN-style desktop redesign · auth (phone + Telegram) · user cabinet · listing
creation wizard with moderation · masked phone with reveal tracking · saved
searches. **Deliverable:** real users can register and publish listings.

### Phase 2 — Seller capture

AI valuation · "Mening uyim" owner cabinet · monthly price notifications ·
reverse listings ("Qidiryapman") · price history. **Deliverable:** we own the
seller relationship before the competitor sees it.

### Phase 3 — Realtor toolkit

Realtor cabinet · site generator · presentations with analytics · Telegram
sharing · notes and collections · public realtor profiles. **Deliverable:** the
first paid subscription product.

### Phase 4 — Lead market

Lead capture quiz · lead scoring · lead marketplace with balance and per-lead
pricing · conversion tracking · fixation with uniqueness check. **Deliverable:**
second revenue stream, and the loop closes.

### Phase 5 — Developer CRM, part 1

Organizations · complexes, buildings, units · shaxmatka · booking · marketplace
publishing from the CRM. **Deliverable:** developers put real inventory in.

### Phase 6 — Developer CRM, part 2

Contracts · payment schedules · debtors · payment integrations · KPI and
reporting.

### Phase 7 — Growth layer

Showroom 3D · mortgage calculator with bank table · map · reels · journal ·
mobile app · AI assistant · omnichannel inbox · telephony.

---

## 8. Non-goals for v1

- Title insurance, trade-in, insurance products, contractor marketplace —
  partner-dependent, revisit after Phase 4
- Foreign property — after Phase 4
- Auction — after Phase 5
- Native mobile app — Phase 7; PWA until then

---

## 9. Global constraints

- **Code in English only** — identifiers, routes, comments, test names. Only
  user-facing copy is Uzbek. (Standing project rule.)
- **Tests are not written unless explicitly requested.** Verification steps in
  plans use lint, typecheck, and real browser checks instead. (Standing project
  rule; overrides the TDD default of the writing-plans skill.)
- **Below 1440px nothing changes** without an explicit decision — the phone
  layout is the product's core and is already validated.
- Every listing URL must produce a correct Telegram preview.
- Mobile-first: 360px is a supported width, LCP < 2.5s.
