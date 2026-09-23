# Phase 10 — AI Social Content (C11) — Design

**Status:** design (spec) — awaiting review
**Date:** 2026-09-23
**Branch:** `claude/phase-10-ai-social-content` (off master `55be4ff`)
**Spec context:** Product C differentiator **C11** ("AI social content — ready Stories/posts per unit", Нмаркет parity). First of the remaining Product C phases (agreed order: C11 → C15 → C12 → C13). Builds on Phase 7.2c's AI content generator (`apps/api/src/ai`) and the Phase 9/9.2 realtor site (the closed-loop target).

## Goal

Let a realtor, from their cabinet, turn one of their own PUBLISHED listings into **ready-to-post social content** — a branded Story (1080×1920) and square post (1080×1080) image card plus an Uzbek caption + hashtags — and share it, so the content drives traffic back to the realtor's own site (a lead). One click on a listing → preview, download the card, copy the caption, share to Telegram.

## Architecture

The branded card is rendered **client-side in an HTML `<canvas>`** inside the agent cabinet (`apps/agent`) — this sidesteps a server-side font dependency (sharp/librsvg would need a Cyrillic/Latin font bundled into both the Docker image and the Netlify function, with text otherwise rendering as boxes) and gives a live preview. The server does only two small things: (a) list the realtor's own PUBLISHED listings for the cabinet, and (b) generate the caption + hashtags + the closed-loop share URL, reusing the existing `GeminiService` + `buildContentPrompt`/`buildContentTemplate`/`parseContent` (Phase 7.2c). **No database changes** — content is generated on demand and never persisted (YAGNI). **No new dependencies** — `<canvas>` is native, Gemini already exists.

A dedicated NestJS module `apps/api/src/realtor-content` owns the two endpoints; it imports `AiModule` (for `GeminiService`) and `AgentModule` (for `RealtorGuard`) — avoiding the `AiModule ↔ AgentModule` cycle that would arise from adding these to `AgentController` (AiModule already imports AgentModule).

## Tech Stack

apps/api NestJS 11 (new `realtor-content` module; reuse `GeminiService` + `ai-content.*` builders; Prisma read-only), packages/shared Zod; apps/agent React 19 + React Router 7 + TanStack Query 5 + native Canvas 2D. No migration, no new runtime deps.

## Global Constraints

- Code/identifiers/routes/comments in **English**; UI copy + the generated caption/hashtags in **Uzbek** (the existing `buildContentPrompt` already instructs Gemini in Uzbek; `buildContentTemplate` is the Uzbek fallback).
- **No new test files.** Verify with root turbo `yarn turbo run typecheck lint build --filter=@rieltor/shared --filter=@rieltor/api --filter=@rieltor/agent` (never `yarn workspace <pkg> lint` — exit 127); plus a live browser smoke.
- **No database migration** — this phase reads listings + the realtor profile and generates on demand; nothing is persisted.
- **No new runtime dependencies** — native `<canvas>` for the card; `GeminiService` already present; `sharp` is deliberately NOT used (server-font risk).
- **BigInt money as string** — `priceSom` crosses the wire as a string and is formatted with `formatPriceSom` (RENT carries `/oy`); never `Number()` it.
- **`brandColor` is data → canvas only** — the hex is server-validated (`/^#[0-9a-fA-F]{6}$/`, already enforced on save) and only ever passed to Canvas 2D fill/stroke; never interpolated into DOM/HTML/CSS. The generated caption/hashtags are drawn/rendered as text, never as HTML.
- **Ownership + gating** — the content endpoints require an active realtor subscription (`RealtorGuard`) and the target listing must be the caller's OWN PUBLISHED listing (else 404 — never reveal another realtor's or a draft listing).
- **Same-origin images** — the card loads the listing cover from `/images/…` (served by the same origin as `/agent`), so the canvas is not tainted and `toBlob` works.
- `apps/web` and `apps/crm` are not touched.

## Non-Goals (this phase — deferred)

- **Persisting** generated content, a content history/library, or regeneration diffing.
- **Scheduling / auto-posting** and any social-network API integration (Instagram/Telegram Graph) — output is manual download + share.
- **Per-platform caption variants** (one Uzbek caption + hashtags serves both formats), carousels, video, or a QR code on the card.
- **Landscape / other sizes** beyond Story 1080×1920 and square 1080×1080.
- **Content for listings the realtor does not own** (marketplace-wide promotion) — the closed loop targets the realtor's own site.
- Server-side image composition (sharp) — explicitly rejected for the font risk.

---

## Section 1 — Shared schema (`packages/shared`)

Additive Zod (no breaking changes):

- `RealtorOwnListingSchema` — a card-ready view of the realtor's own listing:
  ```
  { id: string, title: string, priceSom: string /* BigInt-as-string */, deal: DealSchema,
    type: ListingTypeSchema, rooms: number|null, areaM2: number, district: string,
    imageUrl: string|null /* same-origin 1200 variant, or null when no cover */ }
  ```
- `AiSocialContentSchema` — the generate response: the existing `AiContentResponseSchema` shape (`{ ai: boolean, caption: string, hashtags: string }`) plus `shareUrl: string` (the closed-loop URL). Reuse `AiContentResponseSchema` by extension (`AiContentResponseSchema.extend({ shareUrl: z.string() })`).
- Export types `RealtorOwnListing`, `AiSocialContent`.

No new request schema is needed — the generate endpoint takes only the listing id from the path.

---

## Section 2 — Server: `realtor-content` module (`apps/api`)

New module `apps/api/src/realtor-content/` with a controller + service, registered in `AppModule`. Imports `AiModule` (exports `GeminiService`) + `AgentModule` (exports `RealtorGuard`); `PrismaModule` is `@Global`. `ConfigService` for `PUBLIC_BASE_URL`.

- **`GET /api/agent/content/listings`** (`@Controller('agent/content')`, class-level `JwtGuard` + method `RealtorGuard`) → `RealtorOwnListing[]`: the caller's own `status: 'PUBLISHED'` listings (`where: { ownerId: userId, status: 'PUBLISHED' }`, `orderBy: { listedAt: 'desc' }`, `include: { images: { where: { position: 1 }, take: 1 } }`), mapped to the card fields. `imageUrl` = `imageVariantSrc(firstImage.base, 1200)` (relative `/images/…`) or `null`. (`/api/agent/content/*` does not collide with `AgentController('agent')`'s routes — distinct subpath.)
- **`POST /api/agent/content/listings/:id/social`** (`JwtGuard` + `RealtorGuard`, ownership-checked) → `AiSocialContent`: load `{ id, ownerId, status, type, deal, district, rooms, areaM2, priceSom }`; if not found OR `ownerId !== userId` OR `status !== 'PUBLISHED'` → `NotFoundException` (no cross-realtor/draft leak). Build `AiContentRequest` from the row, then `parseContent(await gemini.generate(buildContentPrompt(req), { maxTokens: 400 }), buildContentTemplate(req))` — same graceful path as `AiContentController` (Gemini null/garbled → the Uzbek template; never throws). Compute `shareUrl` = `profile.customDomain && profile.customDomainVerified ? \`https://${profile.customDomain}/obj/${id}\` : \`${PUBLIC_BASE_URL}/r/${profile.slug}\``(deep link to the listing on a verified custom domain — realtor mode; else the realtor's site catalogue, which attributes inquiries). Return`{ ai, caption, hashtags, shareUrl }`.

The prompt/template builders are imported as plain functions from `../ai/ai-content.parse` and `../ai/ai-content.template` (they are already exported); `GeminiService` is injected from `AiModule`.

---

## Section 3 — Client: the branded card (`apps/agent`, Canvas 2D)

A `SocialCard` unit (`apps/agent/src/features/social-content/social-card.tsx`) that draws to a `<canvas>` and exposes the current canvas for download.

- **Inputs:** the `RealtorOwnListing`; branding — `agency`, `logoUrl`, `brandColor` from the existing `useProfile` (`RealtorProfile`), and the display **name** from the cabinet session (`me`, since `name` lives on `User`, not `RealtorProfile`); the `AiSocialContent` (`shareUrl`); and `format: 'story' | 'post'`.
- **Sizes:** `story` = 1080×1920, `post` = 1080×1080. Rendered at full pixel size on an offscreen/hidden canvas; displayed scaled-down via CSS (`max-width`, `aspect-ratio`).
- **Layout (top→bottom):** the cover image drawn **cover-fit** (crop to fill, preserve aspect); a bottom vertical gradient (transparent → rgba(0,0,0,.72)) for legibility; the **price** (`formatPriceSom(priceSom, deal)`, large bold, RENT shows `/oy`); a params line `{rooms ? rooms+" xona · " : ""}{areaM2} m² · {district}`; the realtor **logo** (top-left, rounded, drawn only if `logoUrl`) with the **agency** (always present) and the **name** when the session supplies one; a **brand-color** accent (a pill/bar filled with `brandColor` — falls back to the cabinet teal `#0d9488` when null); the **site host** text at the bottom (derived from `shareUrl`, e.g. `ali.uz` or `rieltor.uz/r/aziz-rieltor`). All text uses the browser's system font stack (no server font).
- **No cover (`imageUrl === null`):** fill the background with `brandColor` (or teal) instead of the photo; keep the gradient + text.
- **Download:** `canvas.toBlob(blob => …, 'image/png')` → an `<a download="<slug>-<id>-<format>.png">` on a blob URL (real SPA, downloads allowed). Re-render on `format` change.
- **Robustness:** load the cover with `new Image()` (`img.decoding='async'`); draw only after `onload`; same-origin so no `crossOrigin`/taint. Guard `getContext('2d')` null.

---

## Section 4 — Client: "Mening e'lonlarim" page + modal (`apps/agent`)

- **Data hooks** (`apps/agent/src/features/social-content/use-social-content.ts`): `useOwnListings()` (`GET /api/agent/content/listings`, parsed with `z.array(RealtorOwnListingSchema)`, `staleTime` ~60s) and `useGenerateContent()` (a mutation `POST /api/agent/content/listings/:id/social` → `AiSocialContent`).
- **Page** (`apps/agent/src/pages/my-listings/`): a responsive grid of the realtor's own PUBLISHED listings (title, cover thumb, price, district), each card with a **"Kontent yaratish"** button. Empty state ("Hali PUBLISHED e'loningiz yo'q") when none. Loading skeletons; error fallback.
- **Modal** (opened per listing): on open, fire `useGenerateContent(listing.id)`; show the `SocialCard` preview with a **Story / Post toggle**, a **"Yuklab olish"** button (downloads the current format), the **caption + hashtags** in a read-only block with **"Nusxalash"** (clipboard) buttons, and a **"Telegram'da ulash"** link (`telegramShareUrl(shareUrl, caption)` — reused from `@/features/presentations`). While the caption is generating, show a spinner; the card (which needs no AI) can render immediately from listing + profile, with the caption filling in when ready.
- **Nav:** add a **"Mening e'lonlarim"** (or "Kontent") entry to the agent cabinet header nav (`apps/agent/src/widgets/cabinet-header`, the Phase-8.1 nav list of `{ to, icon, label }`), routed under the cabinet guard like the other pages. Use an **existing** icon glyph — `camera` (media/content) fits and avoids the Phase-8.1 `name≠IconName` typecheck trap; do not invent a glyph name.

---

## Section 5 — Graceful degradation & error handling

- **AI unavailable / bad output:** `GeminiService.generate` returns null (no `GEMINI_API_KEY`, timeout, error) → `parseContent` falls back to the Uzbek `buildContentTemplate`; the response's `ai: false` flag lets the UI optionally note "shablon" — the caption is always usable.
- **No cover image:** the card renders a brand-color background variant (Section 3); the listing grid shows a placeholder thumb.
- **No brand color / logo:** default to the cabinet teal and omit the logo; the card still reads correctly.
- **Ownership / gating:** a non-owned, draft, or unknown `:id` → 404 (surfaced as "E'lon topilmadi"); an inactive subscription is already blocked by `RealtorGuard` (the cabinet guard redirects to `/subscribe` before this page loads).
- **Clipboard/canvas:** wrap `navigator.clipboard.writeText` and `canvas.toBlob` in try/catch; on failure show a copyable text area / a retry.

---

## Section 6 — Seed & testing

No seed changes needed: the seed realtor (`998900000003`) already owns 8 PUBLISHED listings with a cover, brand color (`#7c3aed`), logo, slug (`aziz-rieltor`), and a verified custom domain (`aziz-rieltor.uz`, Phase 9.2) — so the page, cards (both formats, with/without cover), captions, and both `shareUrl` branches (custom-domain `/obj/:id` vs `/r/:slug`) all demo.

**Testing (no new test files):**

1. `yarn turbo run typecheck lint build --filter=@rieltor/shared --filter=@rieltor/api --filter=@rieltor/agent` green.
2. **curl smoke:** `GET /api/agent/content/listings` (realtor token) → own PUBLISHED listings with `imageUrl` + BigInt-string price; `POST /api/agent/content/listings/<id>/social` → `{ ai, caption, hashtags, shareUrl }` with a Uzbek caption and the correct `shareUrl` (custom-domain `/obj/:id` for the seed realtor); a non-owned or draft id → 404.
3. **Live browser smoke:** cabinet → "Mening e'lonlarim" → a listing's "Kontent yaratish" → the modal shows the branded card with the cover photo, price (RENT `/oy`), params, logo, brand-color accent, and site host; Story↔Post toggle re-renders at the right aspect; "Yuklab olish" saves a PNG; caption + hashtags appear (AI or template) and copy works; "Telegram'da ulash" opens `t.me/share/url` with the shareUrl + caption; a listing with no cover renders the brand-color variant. 0 console errors.

## Decomposition note

Phase 10, one plan, ~6 tasks: shared schema → `realtor-content` module (own-listings endpoint) → social-content endpoint (reuse AI builders + shareUrl) → `SocialCard` canvas unit → "Mening e'lonlarim" page + modal + hooks + nav → live smoke. The standard flow applies (spec → plan → multi-lens critique → SDD per-task review → whole-branch review → live smoke → merge on explicit authorization → memory update). C15 / C12 / C13 are separate later phases.
