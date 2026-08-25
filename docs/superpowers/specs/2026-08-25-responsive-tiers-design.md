# Responsive tiers — design

_Date: 2026-08-25 · Branch: `claude/responsive-tiers` · Base: master `be9a1f3`_

## 1. Problem

The app currently has **two snap layouts**, not a responsive one:

- `<1440px` → a fixed **480px** phone column (`--container-content: 30rem`), centered, with growing dead gray margins. Verified: at 1024px the content is 480px wide with **272px of empty margin on each side**, single-column.
- `≥1440px` → the full CIAN desktop (`--breakpoint-desk: 90rem`).

Every intermediate width — 768, 1024, 1280 — shows the tiny phone column. That is not responsive. This spec makes the range between phone and CIAN desktop adapt fluidly.

## 2. Breakpoint scale

Three tiers, four bands (Tailwind v4 variants):

| Band    | Variant | Width       | Tier                                    |
| ------- | ------- | ----------- | --------------------------------------- |
| base    | (none)  | `<768`      | **Phone** — unchanged from today        |
| `md:`   | 768     | `768–1023`  | **Tablet** — top nav, 2-col             |
| `lg:`   | 1024    | `1024–1439` | **Laptop** — top nav, 3-col             |
| `desk:` | 1440    | `≥1440`     | **CIAN desktop** — unchanged from today |

`--breakpoint-desk: 90rem` stays. `md`/`lg` use Tailwind v4's default 768/1024; the plan verifies they are active (Tailwind keeps defaults unless explicitly cleared) and adds `--breakpoint-md`/`--breakpoint-lg` tokens only if missing. **No existing `desk:` rule changes value**; we add `md:`/`lg:` rules beneath it.

## 3. Chrome — the transition happens at 768

The single biggest change: the horizontal top nav, currently gated at `desk:` (1440), moves to **`md:` (768)**. The CIAN-specific chrome (sidebar filter, sticky columns) stays at `desk:`.

| Width      | Header                                                                                                             | Bottom tab nav          |
| ---------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| `<768`     | mobile header (logo + city + 🔔) — unchanged                                                                       | **visible** (unchanged) |
| `768–1439` | **top nav** (Bosh sahifa · Qidiruv · Sevimlilar · Aloqa · Baholash · Qidiryapman · 🔔 · + E'lon joylash · account) | **hidden**              |
| `≥1440`    | top nav **+ sticky sidebar filter** (CIAN)                                                                         | hidden                  |

Concretely: the `SiteHeader`'s horizontal-nav block is re-tiered from `desk:` → `md:`; the mobile header block flips to `md:hidden`; the bottom `TabBar` becomes `md:hidden`; the page shells drop their bottom-nav padding at `md:`. Anything CIAN-only (the sidebar, the 3-column result row, the listing sticky price column) **remains** `desk:`-gated.

## 4. Container — no fixed 480px cap below 1440

Replace the single `max-w-content` (480px) pin with a **fluid, growing** content width so no band wastes horizontal space:

- `<768`: full width + `px-4` (today's phone padding).
- `md:` (768): centered, `max-w` ≈ **720px**, comfortable page padding.
- `lg:` (1024): centered, `max-w` ≈ **1040px**.
- `desk:` (≥1440): existing `--container-desk` (90rem) CIAN width.

Introduce responsive container utilities (e.g. `--container-md`, `--container-lg`) or apply `md:max-w-…`/`lg:max-w-…` on the shared page shell. The 480px `--container-content` stays only as the phone/base value.

## 5. Card grids — 1 → 2 → 3 → 4

For every card-list page (home feed, search results, favorites, my-listings, Qidiryapman board, Mening uyim cabinet):

| Band          | Columns                                                   |
| ------------- | --------------------------------------------------------- |
| `<768`        | 1                                                         |
| `md:` 768     | 2                                                         |
| `lg:` 1024    | 3                                                         |
| `desk:` ≥1440 | 4 (search keeps its CIAN 3-column result **row** at desk) |

Applied as `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 desk:grid-cols-4`.

## 6. Per-page treatment

- **Grid pages** (`/`, `/search`, `/favorites`, `/my/listings`, `/requests`, `/my/properties`): responsive container (§4) + 1/2/3/4 grid (§5). Search's `desk:` CIAN result-row layout is unchanged; below desk it uses the plain responsive card grid.
- **Reading / form pages** (`/obj/:id` text side, `/my/listings/new` wizard, `/valuation`, `/contact`, `/offer`, `/notifications`, `/my/requests`, `/my/properties/:id`, `/requests/new`): from `md:` up, a **single comfortable centered column** (`max-w` ≈ 640–720px) — no multi-column. They just stop being a cramped 480px on wide screens.
- **Listing detail (`/obj/:id`)**: `<768` gallery-to-edge + stacked (unchanged); `md:`–`lg:` a **2-column** split (gallery left, info/price right) at a fluid width; `desk:` the existing CIAN sticky price column (unchanged).
- **Filter**: `<768` the existing drawer/modal (unchanged); `md:`–`lg:` the filter as an inline panel or a top-nav-triggered sheet; `desk:` the existing sticky sidebar (unchanged).

## 7. What must NOT change

- **Phone (`<768`) is pixel-identical to today.** All new rules live under `md:`/`lg:`; base styles are untouched.
- **CIAN desktop (`≥1440`) is pixel-identical to today.** No `desk:` rule changes; we only add `md:`/`lg:` rules below it.
- The bottom tab nav still exists and behaves exactly as today below 768.

## 8. Constraints

- Mobile-first: base = phone; layer up with `md:`/`lg:`/`desk:`.
- Uzbek UI copy, English code/identifiers.
- No new test files ([[no-tests-unless-asked]]); the existing 111-test suite must stay green (some Playwright/vitest tests assert layout at 360px and 1440px — those bands are unchanged, so they must still pass).
- FSD boundaries unchanged; this is styling + a header re-tier, not new modules.

## 9. Verification

Browser walk at **768, 1024, 1280, 1440, and 375** (+ a real phone check that <768 is unchanged): confirm no dead side margins, correct column counts, top-nav appears at 768 and bottom-nav hides, CIAN unchanged at ≥1440. Plus `yarn lint && typecheck && the full 111-test suite green`.

## 10. Risks

- **Header re-tier is the crux**: the current `desk:`-only nav must appear at `md:` while sidebar/CIAN pieces stay `desk:`. Splitting these variants cleanly (nav → `md:`, CIAN extras → `desk:`) is where regressions hide — review the header and every page shell that assumed "no top nav below 1440".
- Page shells currently pad for the bottom nav at all `<1440` widths; that padding must drop at `md:` (bottom nav hidden) or content gets a dead gap.
- Tests that assert the 1440 desktop layout must still pass (that band is unchanged); tests at 360/375 too.
