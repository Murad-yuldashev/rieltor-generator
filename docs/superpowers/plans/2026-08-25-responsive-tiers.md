# Responsive Tiers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app fluidly responsive between the phone layout (`<768`) and the CIAN desktop (`≥1440`) by adding tablet (`md:` 768, 2-col, top nav) and laptop (`lg:` 1024, 3-col) tiers, killing the fixed 480px column that leaves dead margins at 1024/1280.

**Architecture:** Purely additive Tailwind tiering. The phone base classes and the `desk:` (1440) CIAN rules are frozen; every change is a new `md:`/`lg:` variant layered beneath `desk:`. The shared `TabLayout` shell provides the fluid container width; the `SiteHeader`/`BottomNav` chrome flips at `md:`; card grids gain `md:grid-cols-2 lg:grid-cols-3`.

**Tech Stack:** React 19 · Tailwind v4 (custom `--breakpoint-desk`) · React Router 7 · Feature-Sliced Design.

**Spec:** `docs/superpowers/specs/2026-08-25-responsive-tiers-design.md`

## Global Constraints

- **Phone (`<768`) must stay pixel-identical.** Never edit an existing base (unprefixed) class; only ADD `md:`/`lg:` variants. If a base class must change, that is a bug.
- **CIAN desktop (`≥1440`) must stay pixel-identical.** Never edit or remove an existing `desk:` class; only add `md:`/`lg:` rules _beneath_ it.
- **Chrome transition is at `md:` (768):** top nav appears, bottom tab bar hides. CIAN-only pieces (sidebar filter, 3-col result row, listing sticky column) stay `desk:`.
- Breakpoints: `md` = 768px, `lg` = 1024px, `desk` = 1440px (existing).
- Uzbek UI copy; English identifiers/comments.
- **No new test files** ([[no-tests-unless-asked]]); the existing 111-test suite (web 34 · shared 18 · API 37 · e2e 22) must stay green. Verify each task with `yarn lint`, `yarn typecheck`, `yarn workspace @rieltor/web build`, `yarn workspace @rieltor/web test`, **and a browser walk at 375 / 768 / 1024 / 1440** confirming no dead margins + correct columns + chrome flip.
- Dev servers for browser checks: web `yarn workspace @rieltor/web dev` (vite, ~:5173), API `yarn workspace @rieltor/api dev` (needs `set -a; source apps/api/.env; set +a`; dev Postgres already running).

---

### Task 1: Breakpoint + container tokens

**Files:**

- Modify: `apps/web/src/app/index.css` (the `@theme` block)

**Interfaces:**

- Produces: usable `md:`/`lg:` variants; `max-w-tablet` (720px), `max-w-laptop` (1040px) utilities.

- [ ] **Step 1: Confirm `md:`/`lg:` generate.** Tailwind v4 keeps its default breakpoints (`md` 48rem, `lg` 64rem) unless cleared; `index.css` only adds `--breakpoint-desk`, so they should already work. Verify by adding a throwaway `md:hidden` to any element and running `yarn workspace @rieltor/web build`, then grep the built CSS for a `@media (min-width: 48rem)` rule. Remove the throwaway. If the media rule is ABSENT, add explicit tokens to `@theme`:

```css
--breakpoint-md: 48rem; /* 768px — tablet tier */
--breakpoint-lg: 64rem; /* 1024px — laptop tier */
```

- [ ] **Step 2: Add responsive container tokens** to the `@theme` block (next to `--container-content` / `--container-desk`):

```css
--container-tablet: 45rem; /* 720px — md content cap */
--container-laptop: 65rem; /* 1040px — lg content cap */
```

(`max-w-tablet` / `max-w-laptop` utilities are generated from the `--container-*` namespace, same as `max-w-content`.)

- [ ] **Step 3: Verify.** `yarn workspace @rieltor/web build` succeeds; `yarn typecheck` clean; `yarn workspace @rieltor/web test` 34/34. Confirm `.max-w-tablet`/`.max-w-laptop` and `md:`/`lg:` utilities appear in the built CSS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/index.css
git commit -m "feat(web): tablet/laptop breakpoint + container tokens"
```

---

### Task 2: Chrome re-tier — header, bottom nav, shell (the crux)

**Files:**

- Modify: `apps/web/src/widgets/site-header/ui/site-header.tsx`
- Modify: `apps/web/src/widgets/bottom-nav/ui/bottom-nav.tsx`
- Modify: `apps/web/src/app/tab-layout.tsx`

**Interfaces:**

- Consumes: tokens from Task 1.
- Produces: top nav visible + bottom nav hidden + fluid container from `md:` up; phone chrome unchanged `<768`; CIAN unchanged `≥1440`.

- [ ] **Step 1: SiteHeader — flip both blocks from `desk:` to `md:`.** In `site-header.tsx`:
  - Phone header block: change `desk:hidden` → `md:hidden`.
  - Desktop header block: change `hidden ... desk:flex` → `hidden ... md:flex`, and make its container fluid + tighter at md so all nav items fit at 768:
    - `max-w-desk` → `max-w-content md:max-w-tablet lg:max-w-laptop desk:max-w-desk`
    - `gap-10` → `gap-4 lg:gap-8 desk:gap-10`
    - `px-8` → `px-4 lg:px-6 desk:px-8`
  - In `AccountArea`, tighten the right cluster at md and let it grow at desk: `gap-3` → `gap-2 lg:gap-3`. The "+ E'lon joylash" button keeps its label (verify it fits at 768 in the browser; if it overflows, shorten to "+ E'lon" at md via a responsive span — only if the browser shows overflow).

- [ ] **Step 2: BottomNav — hide at `md:`.** In `bottom-nav.tsx`, change `desk:hidden` → `md:hidden`. Leave the `max-w-content` (the bar is only visible `<768`, where that cap is correct).

- [ ] **Step 3: TabLayout — fluid container + drop bottom-nav padding at `md:`.** In `tab-layout.tsx`, the outer div:
  - `max-w-content ... pb-bottom-nav desk:max-w-none` → `max-w-content md:max-w-tablet lg:max-w-laptop pb-bottom-nav md:pb-0 desk:max-w-none`
  - The inner wrapper currently only pads at desk (`desk:mx-auto desk:w-full desk:max-w-desk desk:px-8 desk:pt-6 desk:pb-12`). Add md/lg padding so tablet/laptop content isn't edge-to-edge, without touching the desk rules: prepend `md:px-6 md:pt-5 md:pb-10 lg:px-8` (keep all existing `desk:` classes). The `md:max-w-tablet`/`lg:max-w-laptop` on the OUTER div already centre the column, so the inner wrapper only needs padding at md/lg.

- [ ] **Step 4: Browser walk (critical).** Run web + API dev. At **375**: phone header + bottom nav, unchanged. At **768** and **1024**: top nav visible, bottom nav gone, content centered with page padding and NO 480px dead margins, header nav fits without overflow/wrap. At **1440**: CIAN unchanged (sticky sidebar where applicable, roomy header). Fix any header overflow at 768 per Step 1's note.

- [ ] **Step 5: Verify + commit.** `yarn lint && yarn typecheck && yarn workspace @rieltor/web build && yarn workspace @rieltor/web test` (34/34).

```bash
git add apps/web/src/widgets/site-header apps/web/src/widgets/bottom-nav apps/web/src/app/tab-layout.tsx
git commit -m "feat(web): top nav + fluid container from md (tablet/laptop tiers)"
```

---

### Task 3: Home page — responsive card grid

**Files:**

- Modify: `apps/web/src/pages/home/ui/home-page.tsx`

**Interfaces:**

- Consumes: Task 2 shell (container width now fluid at md/lg).
- Produces: home feed 1→2→3→4 columns.

- [ ] **Step 1: Read `home-page.tsx`** and locate (a) the listing-card grid/stack container and (b) any `desk:` sidebar layout. The home currently stacks cards `<1440` and switches to a `desk:` sidebar+grid.

- [ ] **Step 2: Add md/lg grid columns to the card list.** On the listing-cards container, add `md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3` (keep the existing base stacking and any `desk:` grid exactly as-is). If the base is already a `grid grid-cols-1`, just add `md:grid-cols-2 lg:grid-cols-3` and keep `desk:grid-cols-*` unchanged. The entry cards (valuation banner, Qidiryapman) and the filter/segment controls stay full-width above the grid — do NOT gridify them.

- [ ] **Step 3: Browser walk** at 375 (1 col, unchanged) / 768 (2 col) / 1024 (3 col) / 1440 (CIAN, unchanged). Confirm cards fill the width with no dead margins and the hero/entry cards/segments are intact.

- [ ] **Step 4: Verify + commit.** lint/typecheck/build/test 34/34.

```bash
git add apps/web/src/pages/home/ui/home-page.tsx
git commit -m "feat(web): responsive home card grid (2/3 col at tablet/laptop)"
```

---

### Task 4: Search page — responsive grid + filter

**Files:**

- Modify: `apps/web/src/pages/search/ui/*` (read the page dir first)

**Interfaces:**

- Produces: search results as a responsive card grid below `desk:`; CIAN 3-col result **row** unchanged at `desk:`; filter reachable at md/lg.

- [ ] **Step 1: Read the search page** (`apps/web/src/pages/search/`). It has a `desk:` CIAN result-row layout and a filter (drawer/panel). Identify the results container and the `desk:` result-row block.

- [ ] **Step 2: Add md/lg grid for results below desk.** Where results render as stacked cards `<1440`, add `md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3`. Leave the `desk:` result-row layout untouched (it replaces the grid at 1440). If the same element carries both, gate the grid to `md:` and `lg:` only and ensure `desk:` resets to the row layout (add `desk:block`/`desk:grid-cols-none` as needed so the desk row layout wins — verify in browser).

- [ ] **Step 3: Filter at md/lg.** The `<768` drawer/modal trigger stays. Confirm the filter is reachable at 768/1024 (the drawer trigger still renders since it's not `desk:`-gated). Do NOT build the `desk:` sticky sidebar at md — keep the drawer through the laptop tier; the sidebar remains `desk:`-only.

- [ ] **Step 4: Browser walk** at 375/768/1024/1440: results 1/2/3 cols then CIAN rows; filter openable at every band; no dead margins.

- [ ] **Step 5: Verify + commit.** lint/typecheck/build/test 34/34.

```bash
git add apps/web/src/pages/search
git commit -m "feat(web): responsive search grid; filter reachable on tablet/laptop"
```

---

### Task 5: Listing detail — 2-column at tablet/laptop

**Files:**

- Modify: `apps/web/src/pages/listing/ui/listing-page.tsx`

**Interfaces:**

- Produces: `md:`/`lg:` two-column split (gallery + info); `desk:` CIAN sticky column unchanged; `<768` stacked unchanged.

- [ ] **Step 1: Re-read `listing-page.tsx`.** It uses `display: contents` wrappers on phone and a `desk:grid desk:grid-cols-[1fr_23rem]` split with a sticky price column at 1440 (see the existing `main` and `aside`). The phone order is driven by `order-*`.

- [ ] **Step 2: Bring the 2-column split down to `md:`** without disturbing phone or desk. On the `main` element, the split is currently `desk:grid desk:grid-cols-[1fr_23rem] desk:items-start desk:gap-7`. Add a slightly narrower md/lg split beneath it: `md:grid md:grid-cols-[1fr_20rem] md:items-start md:gap-5 lg:grid-cols-[1fr_22rem] lg:gap-6` (keep all `desk:` classes). The two `contents desk:flex ...` wrappers need to also become real columns at md: change `contents desk:flex desk:flex-col ...` → `contents md:flex md:flex-col md:gap-3.5 ...` (keep the `desk:` variants). The `aside`'s `contents desk:sticky desk:top-24 desk:flex ...` → add `md:flex md:flex-col md:gap-3.5 lg:sticky lg:top-24` (sticky from lg; keep `desk:` as-is). The gallery/section `order-*` classes are inert once the wrappers are flex — verify the visual order at md matches desk.
- The page also has a `hidden desk:block` SiteHeader wrapper at the top (the listing page shows no header on phone). Change it to `hidden md:block` so the top nav appears from 768 here too (the listing page otherwise has no nav at md).

- [ ] **Step 3: Browser walk** at 375 (stacked, no header — unchanged) / 768 + 1024 (header + 2-col gallery/info) / 1440 (CIAN sticky, unchanged). Watch the gallery width and the info column.

- [ ] **Step 4: Verify + commit.** lint/typecheck/build/test 34/34 (the listing test asserts 360px behavior — must stay green).

```bash
git add apps/web/src/pages/listing/ui/listing-page.tsx
git commit -m "feat(web): listing detail 2-column split on tablet/laptop"
```

---

### Task 6: Grid pages batch — favorites, my-listings, cabinet, Qidiryapman board

**Files (read each first):**

- Modify: `apps/web/src/pages/favorites/ui/*`
- Modify: `apps/web/src/pages/my-listings/ui/my-listings-page.tsx`
- Modify: `apps/web/src/pages/my-properties/ui/my-properties-page.tsx`
- Modify: `apps/web/src/pages/requests/ui/requests-page.tsx`

**Interfaces:**

- Produces: each card list is 1→2→3 columns (`md:grid-cols-2 lg:grid-cols-3`), inheriting the fluid shell width from Task 2.

This is same-shape work: on each page's card-list container, add `md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3` (only if the base isn't already a grid; if it is `grid grid-cols-1`, add the `md:`/`lg:` cols). Keep any existing `desk:` grid. Leave headings, filter bars, empty states, and CTAs full-width. Do not touch base or `desk:` classes.

- [ ] **Step 1: favorites** — read `pages/favorites/`, apply the grid to the saved-listing cards container.
- [ ] **Step 2: my-listings** — apply to the listing-cards container in `my-listings-page.tsx` (leave the saved-searches section single-column).
- [ ] **Step 3: my-properties cabinet** — apply to the tracked-property cards grid in `my-properties-page.tsx`.
- [ ] **Step 4: requests board** — apply to the request-cards container in `requests-page.tsx` (the filter panel stays full-width above; at md it can sit inline — keep it simple, full-width is fine).
- [ ] **Step 5: Browser walk** each of the four at 375/768/1024/1440: 1/2/3 columns then existing desk behavior; empty states centered; no dead margins.
- [ ] **Step 6: Verify + commit.** lint/typecheck/build/test 34/34.

```bash
git add apps/web/src/pages/favorites apps/web/src/pages/my-listings apps/web/src/pages/my-properties apps/web/src/pages/requests
git commit -m "feat(web): responsive card grids for favorites, my-listings, cabinet, requests"
```

---

### Task 7: Reading / form pages batch — comfortable centered column

**Files (read each first):**

- Modify: `apps/web/src/pages/valuation/ui/valuation-page.tsx`
- Modify: `apps/web/src/pages/contact/ui/*`
- Modify: `apps/web/src/pages/offer/ui/*`
- Modify: `apps/web/src/pages/listing-create/ui/*` (wizard shell)
- Modify: `apps/web/src/pages/notifications/ui/notifications-page.tsx`
- Modify: `apps/web/src/pages/requests/ui/request-create-page.tsx`, `ui/my-requests-page.tsx`
- Modify: `apps/web/src/pages/my-properties/ui/property-detail-page.tsx`

**Interfaces:**

- Produces: these pages present a single centered column capped at a comfortable reading width (~640–720px) from `md:` up — no multi-column, no 480px cramping, no dead full-width sprawl.

Same-shape work: these pages either sit inside `TabLayout` (which now gives them up to `max-w-laptop` 1040px at lg — too wide for a form) or own their chrome (valuation/wizard have their own `max-w-[640px]`/`max-w-[720px]` top-bar layouts already). For each:

- If the page renders inside `TabLayout`, wrap its content in a centered cap so it doesn't stretch to 1040px on laptop: add `md:mx-auto md:max-w-[42rem]` (672px) on the page's root content container (keep base and any `desk:` as-is).
- If the page already has its own `max-w-[…]` container (valuation `max-w-[640px]`, wizard), it likely already centers — just confirm it isn't gated to a phone-only width and reads well at md/lg; widen slightly at md only if it looks cramped, otherwise leave it.

- [ ] **Step 1: valuation** — `valuation-page.tsx` already uses `max-w-[640px]`; confirm it centers at md/lg (it has its own TopBar, not TabLayout). No change unless it reads cramped.
- [ ] **Step 2: contact** — read `pages/contact/`, cap content `md:max-w-[42rem] md:mx-auto`.
- [ ] **Step 3: offer** — read `pages/offer/`, cap the terms body `md:max-w-[46rem] md:mx-auto` (legal text can be a touch wider).
- [ ] **Step 4: wizard** — read `listing-create/`; it owns its chrome (top bar + left rail). Confirm the form column centers at md/lg; cap if needed. Do not disturb the phone or `desk:` layout.
- [ ] **Step 5: notifications** — `notifications-page.tsx`, cap `md:max-w-[42rem] md:mx-auto`.
- [ ] **Step 6: my-requests + request-create + property-detail** — cap each `md:max-w-[42rem] md:mx-auto` (property-detail's chart stays full-width within that cap).
- [ ] **Step 7: Browser walk** each at 768/1024/1440: a centered readable column, not a 480px sliver and not a 1040px sprawl; phone `<768` unchanged; any `desk:` treatment unchanged.
- [ ] **Step 8: Verify + commit.** lint/typecheck/build/test 34/34.

```bash
git add apps/web/src/pages/valuation apps/web/src/pages/contact apps/web/src/pages/offer apps/web/src/pages/listing-create apps/web/src/pages/notifications apps/web/src/pages/requests apps/web/src/pages/my-properties
git commit -m "feat(web): centered reading width for form/detail pages on tablet/laptop"
```

---

### Task 8: Close-out

**Files:**

- Modify: `docs/project-overview.md`

- [ ] **Step 1: Full browser walk at every band** (375, 768, 1024, 1280, 1440) across the whole app — home, search, listing, favorites, my-listings, valuation, contact, offer, wizard, notifications, requests board/new/my, cabinet + detail. Checklist per band: no dead side margins; correct column counts (1/2/3/4); chrome flips at 768 (top nav in, bottom nav out); CIAN intact at 1440; phone intact at 375. Record findings; fix regressions in the owning task's files (small follow-up commits) and re-walk.

- [ ] **Step 2: Full suite green.** `yarn lint && yarn typecheck && yarn workspace @rieltor/web test && yarn workspace @rieltor/shared test` + API unit + e2e with env — 111 total. Fix any layout-test ripple in the same step (tests target 360/1440, both unchanged, so they should pass untouched).

- [ ] **Step 3: Document.** Add a short "Responsive tiers" note to `docs/project-overview.md` (phone <768 / tablet 768 / laptop 1024 / CIAN 1440; top nav from 768). Commit.

```bash
git add docs/project-overview.md
git commit -m "docs(web): document responsive tier system"
```

- [ ] **Step 4: Final whole-branch review** on the most capable model over `MERGE_BASE..HEAD` (MERGE_BASE = `be9a1f3`). Verify: no base (`<768`) or `desk:` (≥1440) rule was changed (phone + CIAN pixel-frozen); md/lg tiers correct; header fits at 768; no dead margins anywhere; 111 green. Fix any Critical/Important, then **stop and ask the user before merging to master**.

---

## Self-Review

**Spec coverage:** breakpoint scale → T1; chrome transition at 768 → T2; container (no 480 cap) → T1 tokens + T2 shell + T7 caps; grids 1/2/3/4 → T3/T4/T6; listing detail 2-col → T5; reading/form pages → T7; per-page treatment → T3–T7; "phone & CIAN unchanged" → Global Constraints + every task's "keep base/desk" instruction + T8 review; verification at all bands → each task + T8. No gaps.

**Type consistency:** no new types/interfaces — this is CSS-class tiering only. The only new named tokens (`--breakpoint-md/lg` if needed, `--container-tablet/laptop`) are defined in T1 and consumed as `md:`/`lg:`/`max-w-tablet`/`max-w-laptop` in T2–T7; names match.

**Placeholder scan:** tasks that touch files whose exact current classes aren't quoted (T3–T7 pages) instruct "read the file first" and give the exact `md:`/`lg:` classes to add and the rule "never edit base or `desk:`" — concrete, not hand-waving. T2 (the crux) quotes exact before→after class edits. No "TBD"/"similar to"/"add responsiveness" left vague.
