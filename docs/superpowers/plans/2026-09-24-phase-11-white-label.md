# Phase 11 — White-Label Branding (C15) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend a realtor's own brand (`logoUrl` + `brandColor`) to the two surfaces that still show the platform brand — the client presentation page (`/p/:token`) and the realtor's cabinet chrome (`/agent`) — by reusing Phase 9's `brandThemeVars` CSS-var override.

**Architecture:** `brandThemeVars(hex)` returns a `CSSProperties` object overriding `--color-accent`/`-dark`/`-soft`/`--brand` on a subtree root, so reused `bg-accent`/`text-accent`/`border-accent` components rebrand with no per-component edits. Applied to the presentation `<main>` (color from the public DTO) and the cabinet shell root (color from the realtor's profile), with the realtor `logoUrl` rendered in each header. No migration, no new deps.

**Tech Stack:** apps/api NestJS 11 (extend one Prisma select), packages/shared Zod (2 additive fields), apps/web + apps/agent React 19 + Tailwind v4 CSS-var theming.

**Spec:** [docs/superpowers/specs/2026-09-24-phase-11-white-label-design.md](../specs/2026-09-24-phase-11-white-label-design.md)

## Global Constraints

- Code/identifiers/routes/comments **English**; UI copy **Uzbek**.
- **No new test files.** Verify each task with the root turbo command (never `yarn workspace <pkg> lint` — exit 127), plus the task's live smoke:
  - `yarn turbo run typecheck lint build --filter=@rieltor/shared --filter=@rieltor/api --filter=@rieltor/web --filter=@rieltor/agent` (subset the `--filter`s to the packages touched).
- **No database migration** — reuses existing `RealtorProfile.brandColor` (`/^#[0-9a-fA-F]{6}$/`-validated on save) + `logoUrl`.
- **No new runtime dependencies.**
- **`brandColor` is data → CSS custom property only** (via `brandThemeVars` → inline `style`); never into HTML/JS. `logoUrl` is a same-origin `/images/…` `<img src>`.
- **`from-violet-600` / any hardcoded Tailwind color is NOT a token** — the CSS-var override does not touch it; replace with a token utility (`from-accent`) so it rebrands.
- **Graceful fallback** — no `brandColor` → platform default (web accent / cabinet teal); no `logoUrl` → platform mark (cabinet teal tile + "RieltorAgent"; presentation: no logo).
- **FSD boundaries** — `brandThemeVars` moves to each app's `shared/lib` (a page/widget may import `shared`; cross-app import is forbidden, so apps/agent gets its own copy). `useProfile` is a feature — importable by the cabinet shell (app layer) and the header (widget).
- Commit WITHOUT `--no-verify` (husky/prettier hook), or `yarn prettier --write` first. `apps/crm` untouched.

## Review Focus

No new unit tests are allowed, so each item is pinned to its owning task's **live smoke** (not a unit test):

- **`brandColor === null`** (realtor never set one) → presentation + cabinet fall back to the platform default (web accent / cabinet teal), never a blank/`undefined` style. → Task 3 + Task 4 smoke.
- **`logoUrl === null`** → the header shows the platform mark, no broken `<img>`. → Task 3 + Task 4 smoke.
- **`from-violet-600` actually replaced** → the presentation header rebrands to the realtor color, not stuck violet. → Task 3 smoke.
- **brand-theme relocation** → `realtor-page.tsx` + `realtor-embed.tsx` (Phase 9/9.2) still import + build after the move (no orphaned import / broken `/r/:slug` + embed). → Task 1 verify.
- **presentation analytics** (opens/dwell IntersectionObserver + sendBeacon) still fire after the page edit. → Task 3 smoke.

---

## Task 1: Shared schema + `brandThemeVars` relocation & copy

**Files:**

- Modify: `packages/shared/src/schemas.ts` (`PublicPresentationSchema` ~line 856)
- Create: `apps/web/src/shared/lib/brand-theme.ts`
- Delete: `apps/web/src/pages/realtor/lib/brand-theme.ts`
- Modify: `apps/web/src/pages/realtor/ui/realtor-page.tsx:12` + `apps/web/src/pages/realtor/ui/realtor-embed.tsx:5` (import path)
- Create: `apps/agent/src/shared/lib/brand-theme.ts`

**Interfaces:**

- Produces: `PublicPresentationSchema` gains `logoUrl`/`brandColor`; `brandThemeVars(hex: string | null): CSSProperties | undefined` importable at `@/shared/lib/brand-theme` in BOTH apps/web and apps/agent.

- [ ] **Step 1: Add the two fields to `PublicPresentationSchema`**

In `packages/shared/src/schemas.ts`, inside `PublicPresentationSchema`, after the `agency: z.string().nullable(),` line:

```ts
  /** Realtor branding for the white-labeled presentation page (Phase 11 / C15). */
  logoUrl: z.string().nullable(),
  brandColor: z.string().nullable(),
```

- [ ] **Step 2: Create the shared brand-theme in apps/web**

Create `apps/web/src/shared/lib/brand-theme.ts` with the exact current content:

```ts
import type { CSSProperties } from 'react';

function shade(hex: string, target: 0 | 255, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(c + (target - c) * t)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${ch.join('')}`;
}

/** Override the accent CSS custom properties from a realtor's brand hex; undefined
 *  (no hex) leaves the platform default in place. Every bg-accent/text-accent/
 *  border-accent descendant rebrands with no per-component edit. */
export function brandThemeVars(hex: string | null): CSSProperties | undefined {
  if (!hex) return undefined;
  return {
    '--color-accent': hex,
    '--color-accent-dark': shade(hex, 0, 0.18),
    '--color-accent-soft': shade(hex, 255, 0.9),
    '--brand': hex,
  } as CSSProperties;
}
```

- [ ] **Step 3: Delete the old file + update its importers**

Delete `apps/web/src/pages/realtor/lib/brand-theme.ts`. In `apps/web/src/pages/realtor/ui/realtor-page.tsx` (line 12) and `apps/web/src/pages/realtor/ui/realtor-embed.tsx` (line 5), change:

```ts
import { brandThemeVars } from '../lib/brand-theme';
```

to:

```ts
import { brandThemeVars } from '@/shared/lib/brand-theme';
```

- [ ] **Step 4: Create the apps/agent copy**

Create `apps/agent/src/shared/lib/brand-theme.ts` with the SAME content as Step 2 (a per-app copy — cross-app import is forbidden by the FSD boundaries rule, matching the existing agent `StatTile` copy).

- [ ] **Step 5: Verify**

Run: `yarn turbo run typecheck lint build --filter=@rieltor/shared --filter=@rieltor/web --filter=@rieltor/agent`
Expected: PASS — in particular `/r/:slug` (realtor-page) + the embed (realtor-embed) still resolve `brandThemeVars` from the new path; no orphaned `../lib/brand-theme` import remains.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/schemas.ts apps/web/src/shared/lib/brand-theme.ts apps/web/src/pages/realtor/ui/realtor-page.tsx apps/web/src/pages/realtor/ui/realtor-embed.tsx apps/agent/src/shared/lib/brand-theme.ts
git rm apps/web/src/pages/realtor/lib/brand-theme.ts
git commit -m "refactor(web): relocate brandThemeVars to shared/lib + copy to agent; PublicPresentation branding (phase 11)"
```

---

## Task 2: Presentation API — brand fields in the public DTO

**Files:**

- Modify: `apps/api/src/presentations/presentations.service.ts` (`publicGet` ~line 169)

**Interfaces:**

- Consumes: `PublicPresentation` (Task 1) now requires `logoUrl`/`brandColor`.
- Produces: `GET /api/p/:token` (via `publicGet`) returns `logoUrl` + `brandColor` from the realtor's profile.

- [ ] **Step 1: Extend the realtor select + the returned DTO**

In `apps/api/src/presentations/presentations.service.ts`, in `publicGet`, change the realtor include select to also fetch the branding:

```ts
        realtor: {
          select: {
            name: true,
            realtorProfile: { select: { agency: true, logoUrl: true, brandColor: true } },
          },
        },
```

and add the two fields to the returned object (after `agency`):

```ts
      logoUrl: presentation.realtor.realtorProfile?.logoUrl ?? null,
      brandColor: presentation.realtor.realtorProfile?.brandColor ?? null,
```

- [ ] **Step 2: Verify**

Run: `yarn turbo run typecheck lint build --filter=@rieltor/api`
Expected: PASS (the return object now satisfies the widened `PublicPresentation`).

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/presentations/presentations.service.ts
git commit -m "feat(api): presentation public DTO carries realtor logo + brandColor (phase 11)"
```

---

## Task 3: Presentation page white-label (apps/web)

**Files:**

- Modify: `apps/web/src/pages/presentation/ui/presentation-page.tsx`

**Interfaces:**

- Consumes: `PublicPresentation.logoUrl`/`brandColor` (Task 2), `brandThemeVars` (`@/shared/lib/brand-theme`, Task 1).

- [ ] **Step 1: Import `brandThemeVars`**

At the top of `apps/web/src/pages/presentation/ui/presentation-page.tsx`, add:

```ts
import { brandThemeVars } from '@/shared/lib/brand-theme';
```

- [ ] **Step 2: Theme the root + rebrand the header + render the logo**

Replace the `<main>` + `<header>` opening block:

```tsx
    <main className="mx-auto min-h-dvh max-w-content bg-surface pb-10">
      <header className="bg-linear-to-br from-violet-600 to-accent-dark px-5 pt-8 pb-7 text-white">
        <p className="text-[12.5px] font-bold tracking-wide text-white/70 uppercase">Taqdimot</p>
        <h1 className="mt-1.5 text-2xl leading-tight font-extrabold">{data.title}</h1>
        <p className="mt-2.5 text-[13.5px] font-semibold text-white/85">
          {data.realtorName}
          {data.agency && ` · ${data.agency}`} tayyorladi
        </p>
      </header>
```

with (root gets `brandThemeVars`; `from-violet-600` → `from-accent`; logo when set):

```tsx
    <main className="mx-auto min-h-dvh max-w-content bg-surface pb-10" style={brandThemeVars(data.brandColor)}>
      <header className="bg-linear-to-br from-accent to-accent-dark px-5 pt-8 pb-7 text-white">
        {data.logoUrl && (
          <img
            src={data.logoUrl}
            alt={data.agency ?? data.realtorName}
            className="mb-3 h-12 w-12 rounded-xl border-2 border-white/40 bg-white object-cover"
          />
        )}
        <p className="text-[12.5px] font-bold tracking-wide text-white/70 uppercase">Taqdimot</p>
        <h1 className="mt-1.5 text-2xl leading-tight font-extrabold">{data.title}</h1>
        <p className="mt-2.5 text-[13.5px] font-semibold text-white/85">
          {data.realtorName}
          {data.agency && ` · ${data.agency}`} tayyorladi
        </p>
      </header>
```

(The item list's `text-accent` / `bg-accent-soft` / `border-accent` + the "Batafsil" links rebrand automatically via the CSS vars on `<main>`; no other edits.)

- [ ] **Step 3: Verify**

Run: `yarn turbo run typecheck lint build --filter=@rieltor/web`
Expected: PASS.

- [ ] **Step 4: Live smoke (deferred to the consolidated smoke)**

Verified with the cabinet in the consolidated smoke (Task 5): `/p/<seed token>` header shows the realtor logo + brand-color (`#7c3aed`) background (no violet), the accents/`Rieltor izohi`/`Batafsil` are brand-colored, the `realtorName · agency tayyorladi` line is intact, and opens/dwell analytics still fire. A `brandColor: null` presentation falls back to the web accent with no logo. Note this in the report.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/presentation/ui/presentation-page.tsx
git commit -m "feat(web): white-label the client presentation page — realtor logo + brand color (phase 11)"
```

---

## Task 4: Cabinet chrome white-label (apps/agent)

**Files:**

- Modify: `apps/agent/src/app/cabinet-shell.tsx`
- Modify: `apps/agent/src/widgets/cabinet-header/ui/cabinet-header.tsx` (`Brand`)

**Interfaces:**

- Consumes: `useProfile` (`@/features/profile` → `RealtorProfile` with `brandColor`/`logoUrl`/`agency`), `brandThemeVars` (`@/shared/lib/brand-theme`, Task 1).

- [ ] **Step 1: Theme the cabinet shell root**

Replace `apps/agent/src/app/cabinet-shell.tsx` with:

```tsx
import { Outlet } from 'react-router';
import { useProfile } from '@/features/profile';
import { brandThemeVars } from '@/shared/lib/brand-theme';
import { CabinetHeader } from '@/widgets/cabinet-header';

/**
 * Shared frame for every realtor-cabinet page. Applies the realtor's brand color
 * (Phase 11 / C15) to the whole cabinet subtree via CSS vars, so the header + all
 * pages' bg-accent/text-accent rebrand; null brandColor keeps the platform teal.
 */
export function CabinetShell() {
  const { data: profile } = useProfile();
  return (
    <div className="flex min-h-dvh flex-col" style={brandThemeVars(profile?.brandColor ?? null)}>
      <CabinetHeader />
      <div className="mx-auto w-full max-w-content flex-1 bg-surface px-4 py-6 md:max-w-tablet md:px-6 md:py-8 lg:max-w-laptop desk:max-w-desk desk:px-8 desk:py-10">
        <Outlet />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: White-label the header `Brand` lockup**

In `apps/agent/src/widgets/cabinet-header/ui/cabinet-header.tsx`, add `import { useProfile } from '@/features/profile';` (a widget may import a feature), and replace the `Brand` function:

```tsx
function Brand() {
  const { data: profile } = useProfile();
  const logoUrl = profile?.logoUrl ?? null;
  const agency = profile?.agency ?? null;
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={agency ?? ''}
          className="h-[34px] w-[34px] shrink-0 rounded-[10px] object-cover"
        />
      ) : (
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-linear-to-br from-accent to-accent-dark text-white">
          <Icon name="homeSolid" className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </span>
      )}
      <span className="text-[17px] font-extrabold tracking-tight">
        {agency ? (
          agency
        ) : (
          <>
            Rieltor<span className="text-accent">Agent</span>
          </>
        )}
      </span>
    </Link>
  );
}
```

(`Icon` is already imported in this file. The nav pills + `Account` avatar already use `bg-accent-soft`/`text-accent`, so they rebrand via the shell's CSS vars — no change there.)

- [ ] **Step 3: Verify**

Run: `yarn turbo run typecheck lint build --filter=@rieltor/agent`
Expected: PASS (watch for an unused `Icon`/orphaned import; `Icon` stays used by the fallback tile + nav).

- [ ] **Step 4: Live smoke (deferred to the consolidated smoke)**

Verified in the consolidated smoke (Task 5): the cabinet header shows the realtor's logo + agency wordmark; the active nav pill, account avatar, and page accents are brand-colored (`#7c3aed`) not teal; a realtor with `brandColor: null` / `logoUrl: null` shows the teal tile + "RieltorAgent". Note in the report.

- [ ] **Step 5: Commit**

```bash
git add apps/agent/src/app/cabinet-shell.tsx apps/agent/src/widgets/cabinet-header/ui/cabinet-header.tsx
git commit -m "feat(agent): white-label the cabinet chrome — realtor logo + brand color (phase 11)"
```

---

## Task 5: Seed a logo + consolidated live smoke

**Files:**

- Modify: `apps/api/prisma/seed-realtor.ts` (the `realtorProfile.create` data)

**Interfaces:**

- Consumes: `RealtorProfile.logoUrl` (existing column).

- [ ] **Step 1: Give the seed realtor a logo**

In `apps/api/prisma/seed-realtor.ts`, in the `realtorProfile.create` data, add a `logoUrl` next to the existing `coverImageUrl` (line ~72) — an existing image variant as a stand-in so both headers show a logo in the smoke:

```ts
      logoUrl: '/images/bx-001/01-360.webp', // stand-in logo (existing variant) for the white-label demo
```

- [ ] **Step 2: Verify build + idempotent seed (throwaway DB)**

Run: `yarn turbo run typecheck build --filter=@rieltor/api`
Then, against a throwaway DB (do NOT reset the main one; `prisma migrate reset` is classifier-blocked):

```bash
psql "$ADMIN_DATABASE_URL" -c 'CREATE DATABASE rieltor_p11_smoke;' 2>/dev/null || true
DATABASE_URL='postgresql://…/rieltor_p11_smoke' sh -c 'cd apps/api && yarn prisma migrate deploy && yarn seed'
```

Expected: build PASS; seed runs; a second `yarn seed` is a no-op (the `subscription.count()` guard); the seed realtor row has `logoUrl` set.

- [ ] **Step 3: Consolidated live browser smoke**

Serve the built dist behind the dev API (`:3100`, seeded throwaway DB, `NODE_ENV=development`). Log in as realtor `998900000003` (devCode OTP) — or inject `localStorage['rieltor.auth']` tokens.

- **Cabinet** (`/agent`): header shows the realtor logo + agency ("Toshkent Uy Savdo"); active nav pill + account avatar + page accents are brand-purple (`#7c3aed`), not teal.
- **Presentation** (`/p/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6` — the seed presentation token): header shows the logo + brand-purple background (no violet); `Rieltor izohi` chips + `Batafsil` links are brand-colored; `Aziza Karimova`… `tayyorladi` line intact; opens analytics fire (a `presentationView` row appears).
- **Fallback:** temporarily clear the seed `brandColor`/`logoUrl` (or reason via review) → cabinet teal + "RieltorAgent", presentation web-accent + no logo. 0 console errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/seed-realtor.ts
git commit -m "feat(api): seed realtor logo for the white-label demo (phase 11)"
```

---

## Self-Review (completed while writing)

- **Spec coverage:** §1 shared + brand-theme relocation/copy → Task 1; §2 presentation API → Task 2; §2 presentation page → Task 3; §3 cabinet chrome → Task 4; §4 seed + testing → Task 5. All covered; no migration (spec) — none added.
- **Type consistency:** `PublicPresentation` widened in Task 1 is satisfied by `publicGet` in Task 2 and consumed by the page in Task 3; `brandThemeVars(hex: string | null)` (Task 1) is called with `data.brandColor` (Task 3) and `profile?.brandColor ?? null` (Task 4); the `@/shared/lib/brand-theme` path is created in Task 1 before Tasks 3–4 import it; the Phase-9/9.2 importers (realtor-page, realtor-embed) are updated in Task 1.
- **Placeholder scan:** every step has concrete code; no TBD.
- **Review Focus:** the 5 items map to Task 1 verify (relocation), Task 3 smoke (violet-replaced, brandColor-null, logo-null, analytics), Task 4 smoke (brandColor-null, logo-null) — no unit tests possible (no-new-test-files).
- **Fallback correctness:** `brandThemeVars(null)` returns `undefined` → `style={undefined}` is a valid no-op React prop (platform default holds); `{logoUrl && <img>}` renders nothing when null.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-24-phase-11-white-label.md`. The established method for this project is **subagent-driven** (fresh implementer + reviewer per task, whole-branch review at the end); recommended here because Task 1 hands a relocated import path + widened DTO to Tasks 2–4 and a broken relocation would regress the Phase-9 site, so an independent gate per task pays off. Please review the plan; say **"boshla"** to execute via subagent-driven-development, or name another approach.
