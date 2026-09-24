# Phase 11 — White-Label Branding (C15) — Design

**Status:** design (spec) — awaiting review
**Date:** 2026-09-24
**Branch:** `claude/phase-11-white-label` (off master `cbeec66`)
**Spec context:** Product C differentiator **C15** ("White-label agent cabinet branding", Profitbase). Second of the remaining Product C phases (agreed order C11 → C15 → C12 → C13). Extends the realtor branding introduced in Phase 9 (`RealtorProfile.brandColor` + `logoUrl`, already set in the cabinet's profile editor and used on the `/r/:slug` site + Phase-10 social cards) to the two surfaces that still show the platform brand.

## Goal

Make a realtor's own brand (their `logoUrl` + `brandColor`) consistent across every surface they touch — by white-labeling the two that still show the platform's teal/violet: (1) the **client-facing presentation page** (`/p/:token`), so a client who opens a shared presentation sees the realtor's logo + brand color, not the platform's; and (2) the **realtor's own cabinet** (`/agent`), so the header + accents carry their brand.

## Architecture

Both surfaces reuse Phase 9's `brandThemeVars(hex)` — a pure function returning a `CSSProperties` object that overrides the `--color-accent` / `--color-accent-dark` / `--color-accent-soft` / `--brand` CSS custom properties on a subtree root; every reused component that styles with `bg-accent` / `text-accent` / `border-accent` / `bg-accent-soft` then rebrands automatically, with no per-component edits. Applied to the presentation page root (color from the public DTO) and the cabinet shell root (color from the realtor's profile). The realtor `logoUrl` is rendered explicitly in each header. **No database migration** (`RealtorProfile.brandColor`/`logoUrl` already exist); **no new dependencies**.

`brandThemeVars` currently lives under `apps/web/src/pages/realtor/lib`; it is relocated to `apps/web/src/shared/lib` (a page may not import another page's lib) and duplicated into `apps/agent/src/shared/lib` (FSD forbids cross-app imports — the established per-app-copy pattern).

## Tech Stack

apps/api NestJS 11 (Prisma read-only — extend one `select`), packages/shared Zod (2 additive fields), apps/web + apps/agent React 19 + Tailwind v4 CSS-var theming. No migration, no new deps.

## Global Constraints

- Code/identifiers/routes/comments in **English**; UI copy in **Uzbek**.
- **No new test files.** Verify with root turbo `yarn turbo run typecheck lint build --filter=@rieltor/shared --filter=@rieltor/api --filter=@rieltor/web --filter=@rieltor/agent` (never `yarn workspace <pkg> lint` — exit 127); plus a live browser smoke.
- **No database migration** — reuses the existing `RealtorProfile.brandColor` (`/^#[0-9a-fA-F]{6}$/`-validated on save) + `logoUrl`.
- **No new runtime dependencies.**
- **`brandColor` is data → CSS custom property only** — passed to `brandThemeVars` → inline `style` CSS vars; never interpolated into HTML/JS. `logoUrl` is a same-origin `/images/…` path rendered as an `<img src>`.
- **`from-violet-600` / any hardcoded Tailwind color is NOT a token** — the CSS-var override does not touch it (the Phase-8.1 lesson). Every hardcoded brand color on a white-labeled surface must be replaced with a token utility (`from-accent`) so it rebrands.
- **Graceful fallback** — a realtor with no `brandColor` keeps the platform default (web accent / cabinet teal); with no `logoUrl`, the header shows the platform mark (cabinet: the teal tile + "RieltorAgent"; presentation: no logo, just the name/agency line).
- `apps/crm` is not touched; the marketplace and other realtors' surfaces are unchanged.

## Non-Goals (this phase — deferred)

- **Per-agency / sub-agent white-label** (an agency brand applied to many sub-agents) — that is C12 (sub-agent hierarchy); this phase white-labels a single realtor's own brand.
- **Custom fonts, favicon, or full CSS theming** — only the accent color + logo.
- **A new contact/lead CTA on the presentation page** — the realtor site already captures leads (Phase 9); the presentation stays about the units + the "Batafsil" links.
- **White-labeling the cabinet on a custom domain**, custom login screens, or removing the platform identity entirely (a subtle platform mark may remain).
- **Marketplace / CRM / other-realtor** surfaces.

---

## Section 1 — Shared schema + `brandThemeVars` reuse

- **`packages/shared`:** `PublicPresentationSchema` gains `logoUrl: z.string().nullable()` and `brandColor: z.string().nullable()` (additive; the DTO already carries `title`, `realtorName`, `agency`, `items`).
- **Relocate (apps/web):** move `apps/web/src/pages/realtor/lib/brand-theme.ts` → `apps/web/src/shared/lib/brand-theme.ts` (unchanged content — `brandThemeVars(hex: string | null): CSSProperties | undefined` + its `shade` helper). Update the existing importers (`apps/web/src/pages/realtor/ui/realtor-page.tsx` and `.../realtor-embed.tsx`) from `../lib/brand-theme` to `@/shared/lib/brand-theme`. Delete the old file.
- **Duplicate (apps/agent):** create `apps/agent/src/shared/lib/brand-theme.ts` with the same `brandThemeVars` (cross-app import is forbidden; a per-app copy is the codebase norm, e.g. the agent `StatTile` copy).

---

## Section 2 — Presentation page white-label (`apps/api` + `apps/web`)

- **API — `PresentationsService.publicGet`:** extend the realtor select to include the branding, and add the two fields to the returned DTO:
  - `realtor: { select: { name: true, realtorProfile: { select: { agency: true, logoUrl: true, brandColor: true } } } }`
  - DTO: `logoUrl: presentation.realtor.realtorProfile?.logoUrl ?? null`, `brandColor: presentation.realtor.realtorProfile?.brandColor ?? null`.
- **Web — `apps/web/src/pages/presentation/ui/presentation-page.tsx`:**
  - Apply `style={brandThemeVars(data.brandColor)}` on the `<main>` root, so all `text-accent` / `bg-accent-soft` / `border-accent` in the item list + "Batafsil" links rebrand to the realtor's color (falls back to the web accent when null).
  - Replace the header's hardcoded `bg-linear-to-br from-violet-600 to-accent-dark` with `bg-linear-to-br from-accent to-accent-dark` (both token-driven → rebrands; `from-violet-600` would otherwise stay violet).
  - When `data.logoUrl`, render the realtor's logo in the header (a rounded `<img>` beside the "Taqdimot" eyebrow / title), so the client sees the realtor's mark. Keep the existing `{realtorName} · {agency} tayyorladi` line.
- **SSR meta (optional, minor):** `buildPresentationMetaTags` may use the realtor `logoUrl` as an `og:image` fallback when the first item has no cover — deferred as a nicety, not required.

---

## Section 3 — Cabinet chrome white-label (`apps/agent`)

- **`apps/agent/src/app/cabinet-shell.tsx`:** read the realtor profile (`useProfile`) and apply `style={brandThemeVars(profile?.brandColor)}` on the outer `<div className="flex min-h-dvh flex-col">`. The CSS vars cascade to `CabinetHeader` (its `from-accent` brand tile, `bg-accent-soft`/`text-accent` active nav + account avatar) and to every cabinet page's accent usage → the whole cabinet adopts the realtor's color (teal fallback when null). CabinetShell renders only under `CabinetGuard` (active realtor), so the profile is available.
- **`apps/agent/src/widgets/cabinet-header/ui/cabinet-header.tsx` — the `Brand` lockup:** read `useProfile`; when `profile.logoUrl` is set, render the realtor's logo (a rounded `<img>` in place of the teal `homeSolid` tile) + the `profile.agency` (or the realtor's name) as the wordmark — the realtor's brand, not "RieltorAgent". When no logo/agency, keep the current platform default (teal tile + "RieltorAgent"). The lockup stays a `<Link to="/">`.

---

## Section 4 — Seed (so the logo path demos)

The seed realtor (`998900000003`) has `brandColor: '#7c3aed'` (violet) and no `logoUrl`, so today only the color path would demo — and the violet seed makes the presentation rebrand _unfalsifiable_, because `#7c3aed` equals both Tailwind's `violet-600` (the hardcoded header color this phase replaces) and the violet web accent (the broken-override fallback): a forgotten replacement, a broken CSS-var override, and a correct rebrand would all render the same purple. In `apps/api/prisma/seed-realtor.ts`, therefore: (1) change `brandColor` to a **non-violet, non-teal** demo hue (`#e11d48`, rose) so the rebrand is visibly falsifiable in the smoke; and (2) add a `logoUrl` — an existing image variant as a stand-in (e.g. `logoUrl: '/images/bx-001/01-360.webp'`) — so the presentation header + cabinet header both show a logo. Additive, inside the existing `subscription.count()` idempotency guard.

## Testing / Verification

No new test files. Per task + at phase end:

1. `yarn turbo run typecheck lint build --filter=@rieltor/shared --filter=@rieltor/api --filter=@rieltor/web --filter=@rieltor/agent` green (watch for orphaned imports after the brand-theme relocation — the Phase-8.3 lesson).
2. **Live browser smoke** (dev API on a free port serving built dist against the seeded throwaway DB):
   - **Presentation** `/p/<seed token>`: the header shows the realtor's logo + a **brand-color** (`#e11d48`, rose) background — NOT violet (proving `from-violet-600` was replaced) and NOT the teal cabinet default (proving the override reached the gradient); the item "Rieltor izohi" chips, "Batafsil" links, and accents are brand-colored; the `realtorName · agency tayyorladi` line is intact.
   - **Cabinet** (`/agent`, realtor `998900000003`): the header brand tile shows the realtor's logo + agency; the active nav pill, account avatar, and page accents are brand-colored (`#e11d48`), not teal.
   - **Fallback:** a realtor / presentation with `brandColor = null` renders the platform default (web accent / cabinet teal) and the platform mark; confirm the null path in review or by temporarily clearing the seed color.
   - 0 console errors; existing presentation analytics (opens/dwell) still fire.

## Decomposition note

Phase 11, one plan, ~4 tasks: shared schema + brand-theme relocation/copy + presentation DTO/API (one green commit — the required nullable fields make api red until the DTO returns them, so schema + API land together) → presentation-page white-label → cabinet shell + header white-label → seed + smoke. The standard flow applies (spec → plan → multi-lens critique → SDD per-task review → whole-branch review → live smoke → merge on explicit authorization → memory update). C12 (sub-agent hierarchy — which generalizes white-label to an agency) and C13 (training) are later phases.
