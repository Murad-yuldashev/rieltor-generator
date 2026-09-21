# Phase 9 — Realtor Site Generator (MVP) — Design

**Status:** design (spec) — awaiting review
**Date:** 2026-09-21
**Branch:** `claude/phase-9-realtor-site-generator` (off master `5e611ed`)
**Spec context:** implements platform-spec item **C1** ("Site generator — realtor gets `ali.domen.uz`, own logo, brand colour, catalogue auto-updates"), the flagship of Product C (the realtor platform). Follows Phase 8 (cabinet desktop). Custom domain + XML feed are split into a later Phase 9.2.

## Goal

Turn the existing public realtor microsite (`/r/:slug`) into a full **branded, filterable catalogue site** — the realtor's paid, auto-updating storefront — with **contact + lead capture** (a site visitor becomes a lead in the realtor's cabinet), **gated on an active subscription**. Slug-based this phase; custom domain deferred.

Today `/r/:slug` renders a single branded header + a flat grid of the realtor's PUBLISHED listings + reviews, is public regardless of subscription, and has no filtering, no contact affordance, and only logo+one-colour branding. Phase 9 closes those gaps.

## Architecture

The site's data spine already exists: `RealtorProfile` → `GET /api/r/:slug` (`PublicRealtorSchema`) → `apps/web` `RealtorPage`. Phase 9 **extends that spine, it does not replace it**:

- **Config** lives on `RealtorProfile` (additive columns: branding, contact, SEO, publish flag) — the single source of branding truth, edited in the agent cabinet `/profile`.
- **The public page** becomes a branded catalogue by **reusing the marketplace filter stack client-side** over the listings already in the `/r/:slug` payload (`filterListings` + `FilterPanel` + `SortSelect` + `ListingFacets` + `useInfiniteScroll`), themed by **overriding `--color-accent`/`-dark`/`-soft` on the site root** so every reused card/filter auto-rebrands with zero component edits (plus the existing `--brand` var).
- **Lead capture:** a new public `POST /api/r/:slug/inquiry` upserts the visitor by phone (the auth-service pattern) and creates a **realtor-attributed `PropertyRequest`** (`claimedById = realtor`, `outcomeStage NEW`) so it lands in the realtor's existing `/leads` cabinet, then notifies the realtor.
- **Gating:** `SubscriptionService.isActive()` is checked on all three public surfaces (the API read, the SSR meta filter, the SPA route); an inactive/unpublished site serves a minimal placeholder, never a 404.

## Tech Stack

React 19, React Router 7, Tailwind v4 (`@theme` tokens + `--color-accent`/`--brand` CSS-var theming), TanStack Query 5, FSD; apps/api NestJS + Prisma 6 (one additive migration). **No new runtime dependencies.**

## Global Constraints

- Code/identifiers/comments **English**; UI copy **Uzbek**.
- **No new test files.** Verify with root turbo `yarn turbo run typecheck lint build --filter=@rieltor/web --filter=@rieltor/agent --filter=@rieltor/api` (never `yarn workspace <pkg> lint` — exit 127); plus a live browser smoke. Editing existing fixtures/seed is allowed.
- **Additive migration only** — new nullable/defaulted columns on `RealtorProfile` + one additive `NotificationType` enum member. No column drops, no type changes to existing columns. BigInt money stays a **string** end-to-end (never `Number()`).
- **Reuse the marketplace filter/catalogue stack** (`features/listing-filters`, `entities/listing` `ListingCard`) — do NOT rebuild search. Catalogue filtering/sort/search runs **client-side** over the realtor's listing array in the payload (small per-realtor sets).
- **`brandColor`/theme is data → CSS custom property only**, never injected into raw DOM/CSS (preserve the existing XSS discipline; server hex-validates). New URL/phone fields are validated (URL, canonical phone) server- and client-side via shared Zod schemas.
- **Privacy:** the public payload never leaks internal fields (`userId`/`authorId`/internal). Contact fields (phone/telegram/whatsapp/socials) are **opt-in** columns the realtor chooses to publish — never a raw `User` join. The public inquiry endpoint is **rate-limited** and phone-validated.
- **Routing trap:** `r` is BOTH an API `@Controller('r')` (`/api/r/:slug`) and the public SPA/SSR path. The new inquiry route is an `/api/r/:slug/inquiry` controller route (not added to `SPA_ROUTES`); any SSR handling stays in the `not-found-shell` filter (per the documented SPA_ROUTES-vs-@Controller trap).
- `apps/crm` and unrelated apps are **not touched**.

## Non-Goals (this phase — explicitly deferred)

- **Custom domain** (host-header → realtor routing, domain column + DNS/TLS/verification, per-host SSR/base-URL) — Phase 9.2.
- **XML feed / embeddable catalogue widget** (C2) — Phase 9.2.
- **Multi-template themes / brand kit beyond one accent + cover** (secondary palette, fonts) — later.
- **Real billing/payment** — `SubscriptionService.activate()` stays the platform-wide stub; gating uses `isActive()` only.
- Sub-agent hierarchy (C12), white-label cabinet branding (C15), training centre (C13), AI social content (C11) — separate phases.

---

## Section 0 — Data model (`RealtorProfile` additive columns + notification type)

Additive Prisma migration (all nullable or defaulted; no existing column changes):

- `coverImageUrl String?` — hero/cover image (stored as a renderable relative URL, like `logoUrl`).
- `tagline String?` — short headline under the name.
- `contactPhone String?` — public contact number, **opt-in** (distinct from login `User.phone`).
- `contactTelegram String?` — Telegram username/handle (stored without `@`; link built client-side).
- `contactWhatsapp String?` — WhatsApp number (opt-in).
- `instagramUrl String?`, `telegramChannelUrl String?` — social links (validated URLs).
- `seoTitle String?`, `seoDescription String?` — SEO/OG overrides (fallback to derived name/agency/bio).
- `sitePublished Boolean @default(true)` — the realtor's on/off switch for the public site.

Plus: add a `NotificationType` enum member (e.g. `LEAD_INQUIRY`) and widen `NotificationsService.notify()`'s `type` union to include it (the service already writes a `Notification` row + Telegram push). No other model changes. `PropertyRequest` is reused as-is (site inquiries are attributed leads — Section 4).

---

## Section 1 — Shared Zod contract (`packages/shared/src/schemas.ts`)

Every new field is added in the coordinated places the codebase already uses (client + server import the same schemas, so validation cannot drift):

- **`PublicRealtorSchema`** (read, public) — add `coverImageUrl`, `tagline`, `contactPhone`, `contactTelegram`, `contactWhatsapp`, `instagramUrl`, `telegramChannelUrl` (all nullable), and a `siteActive: boolean` flag (see Section 6). SEO fields are NOT exposed here (server-only, used for meta). Preserve the no-internal-leak discipline.
- **`RealtorProfileSchema`** (read, cabinet) + **`RealtorProfileUpdateSchema`** (write, all-optional PATCH) — add the new editable fields with validation: `brandColor` hex regex (existing model), URLs validated with `z.string().url()`, phones canonicalised, `sitePublished` boolean, `seoTitle`/`seoDescription` length-bounded.
- **New `RealtorInquiryCreateSchema`** (public inquiry body): `{ name: string (1..80), phone: string (canonical UZ), message: string (1..1000), listingId?: string, deal?: Deal }`.

---

## Section 2 — Public read API + subscription gating (`apps/api/src/realtor-public`)

`GET /api/r/:slug` (`RealtorPublicService.getBySlug`) extends its current behaviour:

- Compute `siteActive = owner.role === 'REALTOR' && SubscriptionService.isActive(subscription) && profile.sitePublished`.
- **When `siteActive`:** return the full `PublicRealtor` incl. the new branding/contact fields + the listings (as today: `ownerId === userId`, `status: 'PUBLISHED'`, `toListingSummary`) + reviews.
- **When NOT `siteActive`:** return a **reduced** payload — `siteActive: false`, `name`/`agency`/`verified` only, `listings: []`, `reviews: []`, branding/contact nulled — so the SPA renders a minimal placeholder. **Never 404 a known slug** (preserve the existing invariant; only an unknown slug 404s). `SubscriptionService` is injected into `RealtorPublicModule` (exported from `AgentModule`).

This keeps the catalogue client-side (listings ship in the payload); no new listing-query params this phase.

---

## Section 3 — Branded catalogue (public page, `apps/web/src/pages/realtor`)

Upgrade `RealtorPage` into a branded, filterable catalogue by reuse:

- **Theme root:** wrap the page in a root element that redefines `--color-accent`, `--color-accent-dark`, `--color-accent-soft` from `brandColor` (derive `-dark`/`-soft` by simple luminance shift/alpha), plus keep the existing `--brand` var. This auto-rebrands every reused `ListingCard`/filter control. Keep the data→CSS-var-only discipline.
- **Header/hero:** cover image (`coverImageUrl`) as a hero band, logo, name, `tagline`, agency, verified pill, bio, region pills.
- **Catalogue:** reuse `filterListings` + `EMPTY_CRITERIA` + `useListingFilters` over `data.listings`, with `FilterPanel` + `SortSelect` + `ListingFacets` + `useInfiniteScroll` and the `ListingCard` grid (links to `/obj/:id`). **Add a district facet** (the one gap — derive present districts from the realtor's listings). Empty/loading/404 states preserved. Responsive desktop layout (grid tiers `md:2 lg:3 desk:4`).
- **Reviews:** existing `ReviewsSection`, re-skinned to the brand theme.
- **Placeholder:** when `siteActive === false`, render a minimal card (name + "Bu sayt hozircha mavjud emas") instead of the catalogue.

No favourites/auth-gated features on the public site unless a logged-out path is handled (keep it out, as today).

---

## Section 4 — Contact CTA + lead capture (public inquiry)

- **Contact CTA** (public page): a contact bar/section rendering only the opt-in fields present — call (`contactPhone` → `tel:`), Telegram (`contactTelegram` → `https://t.me/…`), WhatsApp (`contactWhatsapp` → `https://wa.me/…`), and social links. Themed with the brand accent.
- **"Qo'ng'iroq so'rash" form:** name, phone, message; a hidden `listingId` when opened from a specific `ListingCard`'s "So'rov yuborish" action (else a general inquiry). Submits to the new endpoint.
- **`POST /api/r/:slug/inquiry`** (public, no auth; a method route on the existing `@Controller('r')`, **rate-limited**): validates `RealtorInquiryCreateSchema`; resolves the realtor by slug and requires `siteActive` (else 403/placeholder); **upserts the visitor `User` by `canonicalizePhone`** (the `auth.service` upsert pattern, setting `name` when new); creates a **`PropertyRequest`** with `authorId = visitorUser.id`, `claimedById = realtor.userId`, `claimedAt = now`, `outcomeStage = 'NEW'`, `status = 'CLAIMED'`, `deal` (from the linked listing's `deal` when `listingId` given, else `body.deal ?? 'SALE'`), `note` = the visitor's message prefixed with a `[Sayt so'rovi]` marker (and the listing title when linked), and the existing `computeLeadScore`/`priceSom` pipeline. Then **notify the realtor**: `NotificationsService.notify(realtor.userId, { type: 'LEAD_INQUIRY', title, body, targetId: lead.id })` (writes a `Notification` + Telegram push if `telegramId`).
- The new lead surfaces in the realtor's existing `/leads` cabinet (revealed phone, since `claimedById === realtor`), closing the loop **site visitor → lead → cabinet**. No new cabinet UI required this phase.

---

## Section 5 — Branding editor (agent cabinet, `apps/agent/src/pages/profile`)

Extend the profile editor (Phase 8.3's form + `ProfilePreview`) with the new config, reusing the changed-fields PATCH + validation:

- **Cover image** upload — reuse the `setLogo`/`processImage` pipeline with an OG-sized variant (`makeOg: true`); a new `POST /api/agent/profile/cover` (JwtGuard + RealtorGuard), mirroring `setLogo`.
- **Fields:** `tagline`, `contactPhone`, `contactTelegram`, `contactWhatsapp`, `instagramUrl`, `telegramChannelUrl`, `seoTitle`, `seoDescription`, and a **`sitePublished` toggle**.
- **Live preview + link:** `ProfilePreview` reflects the new fields; show the public URL (`/r/:slug`) with an "Ochish" link and the live/paused state (tied to `sitePublished` + subscription).
- All new inputs mirror server validation via the shared schemas; `imageVariantSrc` widths ∈ {360,720,1200}.

---

## Section 6 — Subscription gating across the three public surfaces

`SubscriptionService.isActive()` is the single source; applied at:

1. **API** — `getBySlug` returns the reduced payload when not `siteActive` (Section 2).
2. **SSR meta** — `not-found-shell` filter / `buildRealtorMetaTags` emits minimal meta (name only, no rich OG) when not `siteActive`.
3. **SPA** — `RealtorPage` renders the placeholder when `payload.siteActive === false`.

Cabinet side: the `/profile` site section shows the live URL + "Sayt faol" only when active; when the subscription is inactive, an upsell/paused state (reuse `useSubscription`). No hard block on editing config while paused (the site just isn't public).

---

## Section 7 — SEO / OG (`apps/api/src/ssr`)

Extend `buildRealtorMetaTags`: `og:site_name` = agency (not hardcoded "Rieltor"), OG image = `coverImageUrl ?? logoUrl`, `<title>`/description from `seoTitle`/`seoDescription` when set (else derived), and emit `RealEstateAgent` JSON-LD structured data. `baseUrl` stays env-derived (`PUBLIC_BASE_URL`) this phase (per-host baseUrl is a 9.2 custom-domain concern).

---

## Section 8 — Seed (so `/r/:slug` renders populated)

Extend `seedRealtorCabinet` (`apps/api/prisma/seed-realtor.ts`, additive/idempotent): give the seed realtor (`998900000003`, slug `aziz-rieltor`) a populated site — set the new branding/contact fields (cover, tagline, contactPhone/Telegram, socials, `sitePublished: true`) and make a handful of `SEED_LISTINGS` **owned by the realtor** so the catalogue is non-empty. Because the public seller resolver only shows a realtor as seller when `owner.role === 'REALTOR'` AND `profile.slug` is set, set those listings' `ownerId = SEED_REALTOR_ID` and `status: 'PUBLISHED'` (a few across deal/type/district so facets have options). No new listing rows needed. Keep it additive + idempotent.

---

## Testing / Verification

No new test files. Per task + at phase end:

1. `yarn turbo run typecheck lint build --filter=@rieltor/web --filter=@rieltor/agent --filter=@rieltor/api` green (api for the migration + endpoints; agent for the editor; web for the site).
2. Migration applies cleanly (`prisma migrate`) and the seed runs idempotently twice (realtor now owns a few PUBLISHED listings + branding).
3. **Live browser smoke** (worktree API serving built dist; anonymous visitor):
   - `/r/aziz-rieltor` at phone (375) / laptop (1200) / desk (1440): branded hero + catalogue renders populated; the brand accent themes the reused cards/filters; filter/sort/search + district facet work; no horizontal overflow; cover/listing image widths ∈ {360,720,1200}; 0 console errors; SEO/OG meta correct (view-source).
   - Contact CTA renders only the opt-in fields; the "Qo'ng'iroq so'rash" form submits → then, logged in as the realtor (`998900000003`), the inquiry appears in `/leads` (revealed phone) and a notification is recorded.
   - Set `sitePublished=false` (or simulate an inactive subscription) → `/r/:slug` shows the minimal placeholder, not the catalogue, and the inquiry endpoint is refused.

## Decomposition note

Phase 9.1 (this spec) is one plan: data model + shared schema → public read API + gating → branded catalogue → contact/inquiry → branding editor → SEO/OG → seed. The standard flow applies (spec → plan → multi-lens critique → SDD per-task review → whole-branch review → live smoke → merge on explicit authorization → memory update). Custom domain + XML feed/embeddable widget become **Phase 9.2**.
