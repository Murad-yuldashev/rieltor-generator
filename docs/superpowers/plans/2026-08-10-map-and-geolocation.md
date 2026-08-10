# Xarita va geolokatsiya — implementatsiya rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Foydalanuvchi o'z joyini aniqlaydi yoki xaritadan tanlaydi, lenta yaqinlik bo'yicha saralanadi, va har bir e'lonning joyi kartada hamda obyekt sahifasida xaritada ko'rinadi.

**Architecture:** Masofa va tuman hisoblash — `@rieltor/shared` dagi sof funksiyalar, hech qanday tashqi API'siz. Ko'rsatish uchun Yandex Static API'ning statik rasmi (skript yuklanmaydi, LCP tegilmaydi), joy tanlash uchun esa faqat oyna ochilganda yuklanadigan interaktiv Yandex JS xaritasi. Foydalanuvchi nuqtasi `localStorage` da, modul darajasidagi kichik store orqali barcha iste'molchilarga tarqaladi.

**Tech Stack:** React 19 · Vite 6 · TanStack Query 5 · Tailwind v4 · Zod 4 · NestJS 11 · Prisma 6 · Vitest · Playwright · Yandex Static API v1 · Yandex Maps JS API 2.1

**Manba spec:** [2026-08-10-map-and-geolocation-design.md](../specs/2026-08-10-map-and-geolocation-design.md)

## Global Constraints

- Mavjud sahifalar, endpointlar, OG-inject mexanizmi, rasm quvuri, seed skriptlari, rieltor kabineti va mavjud testlar ishlashda davom etadi.
- Faqat qo'shimcha ish: migratsiyada `DROP` va ustun tipini o'zgartirish taqiqlanadi; yangi ustunlar NULLable.
- Mavjud fayllardan faqat spec §3.3 ro'yxatidagilari o'zgartiriladi, minimal diff bilan.
- Mavjud testlar o'chirilmaydi va assertion'lari bo'shashtirilmaydi.
- Xarita kaliti berilmasa sayt bugungidek ishlaydi; geolokatsiya rad etilsa lenta avvalgidek ochiladi; koordinatasi yo'q e'lon avvalgidek ko'rinadi.
- Kod, fayl nomi, izoh va test nomlari **ingliz tilida**; foydalanuvchi ko'radigan matn **o'zbekcha**.
- **FSD chegarasi:** `entities/*` (`listing-card`, `location`) `features/*` dan import qila olmaydi — koordinatalar va masofa ularga prop sifatida tushadi.
- Repo `noUncheckedIndexedAccess` yoqilgan; ESLint faqat `^_` bilan boshlanadigan **argumentlarni** kechiradi.
- Mobil-first 360px, gorizontal skroll yo'q.
- Har task oxirida `yarn lint`, `yarn typecheck`, `yarn test` yashil, keyin commit.
- Commit xabari oxirida: `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`

## File Structure

**Yangi fayllar:**

| Fayl                                                                  | Mas'uliyat                                                                       |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `packages/shared/src/geo.ts`                                          | `Point`, `distanceKm`, `formatDistance`, `TASHKENT_DISTRICTS`, `nearestDistrict` |
| `packages/shared/src/geo.test.ts`                                     | Uning testlari                                                                   |
| `apps/web/src/shared/ui/static-map.tsx`                               | Statik xarita rasmi (Yandex Static API)                                          |
| `apps/web/src/shared/ui/static-map.test.tsx`                          | Uning testlari                                                                   |
| `apps/web/src/shared/lib/yandex-maps.ts`                              | JS API skriptining idempotent loader'i                                           |
| `apps/web/src/shared/lib/yandex-maps.test.ts`                         | Uning testlari                                                                   |
| `apps/web/src/features/user-location/model/store.ts`                  | `localStorage` ustidagi modul-darajasidagi store                                 |
| `apps/web/src/features/user-location/model/use-user-location.ts`      | Hook: o'qish, aniqlash, qo'lda o'rnatish                                         |
| `apps/web/src/features/user-location/model/use-user-location.test.ts` | Ularning testlari                                                                |
| `apps/web/src/features/user-location/ui/location-chip.tsx`            | Header'dagi yorliq/tugma                                                         |
| `apps/web/src/features/user-location/ui/location-chip.test.tsx`       | Uning testlari                                                                   |
| `apps/web/src/features/user-location/ui/location-picker.tsx`          | Interaktiv xaritali tanlash oynasi                                               |
| `apps/web/src/features/user-location/ui/location-picker.test.tsx`     | Uning testlari                                                                   |
| `apps/web/src/features/user-location/index.ts`                        | Public API                                                                       |
| `apps/web/.env.example`                                               | `VITE_YANDEX_MAPS_KEY`                                                           |
| `e2e/location.spec.ts`                                                | Playwright: geolokatsiya va yaqinlik saralashi                                   |

**O'zgaradigan mavjud fayllar:** `apps/api/prisma/schema.prisma`, `apps/api/prisma/seed-data.ts`, `apps/api/src/listings/mapper.ts`, `apps/api/test/listings.e2e-spec.ts`, `packages/shared/src/schemas.ts`, `packages/shared/src/index.ts`, `apps/web/src/entities/listing/ui/listing-card.tsx`, `apps/web/src/entities/listing/ui/location.tsx`, `apps/web/src/features/listing-filters/model/criteria.ts`, `apps/web/src/features/listing-filters/model/use-listing-filters.ts`, `apps/web/src/pages/home/ui/home-page.tsx`, `apps/web/src/pages/search/ui/search-page.tsx`, `apps/web/src/pages/listing/ui/listing-page.tsx`, `apps/web/src/widgets/site-header/ui/site-header.tsx`, `apps/web/src/app/root-layout.tsx`, `docs/project-overview.md`, va koordinata maydonlari qo'shiladigan web test fixture'lari.

---

### Task 1: `@rieltor/shared` — geo funksiyalari

**Files:**

- Create: `packages/shared/src/geo.ts`
- Create: `packages/shared/src/geo.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**

- Consumes: —
- Produces:
  - `interface Point { lat: number; lng: number }`
  - `distanceKm(a: Point, b: Point): number`
  - `formatDistance(km: number): string`
  - `TASHKENT_DISTRICTS: readonly { name: string; lat: number; lng: number }[]`
  - `nearestDistrict(point: Point): string`

- [ ] **Step 1: Testni yozish**

`packages/shared/src/geo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { TASHKENT_DISTRICTS, distanceKm, formatDistance, nearestDistrict } from './geo';

/** Two well-separated Tashkent points, ~13 km apart. */
const SERGELI = { lat: 41.22, lng: 69.22 };
const YUNUSOBOD = { lat: 41.3675, lng: 69.2894 };

describe('distanceKm', () => {
  it('is zero for the same point', () => {
    expect(distanceKm(SERGELI, SERGELI)).toBe(0);
  });

  it('measures a known Tashkent span within a tolerance', () => {
    const km = distanceKm(SERGELI, YUNUSOBOD);
    expect(km).toBeGreaterThan(16);
    expect(km).toBeLessThan(18);
  });

  it('is symmetric', () => {
    expect(distanceKm(SERGELI, YUNUSOBOD)).toBeCloseTo(distanceKm(YUNUSOBOD, SERGELI), 6);
  });

  it('measures one degree of latitude as about 111 km', () => {
    const km = distanceKm({ lat: 41, lng: 69 }, { lat: 42, lng: 69 });
    expect(km).toBeGreaterThan(110);
    expect(km).toBeLessThan(112);
  });
});

describe('formatDistance', () => {
  it.each([
    [0.12, '120 m'],
    [0.85, '850 m'],
    [0.999, '1000 m'],
    [1, '1.0 km'],
    [2.44, '2.4 km'],
    [12.06, '12.1 km'],
  ])('formats %s km as %s', (km, expected) => {
    expect(formatDistance(km)).toBe(expected);
  });
});

describe('TASHKENT_DISTRICTS', () => {
  it('covers all twelve districts with unique names', () => {
    expect(TASHKENT_DISTRICTS).toHaveLength(12);
    expect(new Set(TASHKENT_DISTRICTS.map((d) => d.name)).size).toBe(12);
  });

  it('places every district inside the Tashkent bounding box', () => {
    for (const d of TASHKENT_DISTRICTS) {
      expect(d.lat).toBeGreaterThan(41.15);
      expect(d.lat).toBeLessThan(41.42);
      expect(d.lng).toBeGreaterThan(69.1);
      expect(d.lng).toBeLessThan(69.45);
    }
  });
});

describe('nearestDistrict', () => {
  it('returns a district by its own centre', () => {
    for (const d of TASHKENT_DISTRICTS) {
      expect(nearestDistrict({ lat: d.lat, lng: d.lng })).toBe(d.name);
    }
  });

  it('still answers for a point far outside the city', () => {
    expect(TASHKENT_DISTRICTS.map((d) => d.name)).toContain(
      nearestDistrict({ lat: 39.65, lng: 66.96 }),
    );
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/shared vitest run src/geo.test.ts`
Expected: FAIL — `Failed to resolve import "./geo"`.

- [ ] **Step 3: `geo.ts` ni yozish**

```ts
export interface Point {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Haversine great-circle distance. Accurate to well under a metre at city scale. */
export function distanceKm(a: Point, b: Point): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Under a kilometre reads better in metres, rounded to the nearest ten. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round((km * 1000) / 10) * 10} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * District centres, good enough to name the district a point falls in. Kept here
 * rather than fetched from a geocoder: one table, no API key, no quota, and it
 * works offline — the only thing the label is used for is a header chip.
 *
 * Approximate to a few hundred metres, which is far below the distance between
 * any two district centres.
 */
export const TASHKENT_DISTRICTS = [
  { name: 'Bektemir tumani', lat: 41.21, lng: 69.34 },
  { name: 'Chilonzor tumani', lat: 41.275, lng: 69.205 },
  { name: 'Mirobod tumani', lat: 41.29, lng: 69.29 },
  { name: "Mirzo Ulug'bek tumani", lat: 41.325, lng: 69.34 },
  { name: 'Olmazor tumani', lat: 41.35, lng: 69.22 },
  { name: 'Sergeli tumani', lat: 41.22, lng: 69.22 },
  { name: 'Shayxontohur tumani', lat: 41.32, lng: 69.23 },
  { name: 'Uchtepa tumani', lat: 41.3, lng: 69.18 },
  { name: 'Yakkasaroy tumani', lat: 41.283, lng: 69.25 },
  { name: 'Yangihayot tumani', lat: 41.205, lng: 69.25 },
  { name: 'Yashnobod tumani', lat: 41.283, lng: 69.345 },
  { name: 'Yunusobod tumani', lat: 41.3675, lng: 69.2894 },
] as const;

/** Nearest district centre by straight-line distance. Never returns null. */
export function nearestDistrict(point: Point): string {
  let best = TASHKENT_DISTRICTS[0];
  let bestKm = Infinity;

  for (const district of TASHKENT_DISTRICTS) {
    const km = distanceKm(point, district);
    if (km < bestKm) {
      bestKm = km;
      best = district;
    }
  }

  return best.name;
}
```

- [ ] **Step 4: `index.ts` dan eksport qilish**

`packages/shared/src/index.ts` ga bitta qator:

```ts
export * from './geo';
```

- [ ] **Step 5: Testni ishga tushirish**

Run: `yarn workspace @rieltor/shared test`
Expected: PASS — yangi holatlar va mavjud testlar.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/geo.ts packages/shared/src/geo.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): add distance and district helpers"
```

---

### Task 2: Koordinatalar — baza, seed va API javobi

**Files:**

- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_add_listing_coordinates/migration.sql` (Prisma generatsiya qiladi)
- Modify: `apps/api/prisma/seed-data.ts`
- Modify: `apps/api/src/listings/mapper.ts`
- Modify: `packages/shared/src/schemas.ts`
- Modify: `apps/api/test/listings.e2e-spec.ts`
- Modify: web test fixture'lari (Step 7 da sanab o'tilgan)

**Interfaces:**

- Consumes: —
- Produces: `ListingSummary` va `ListingDetail` da `lat: number | null`, `lng: number | null`

- [ ] **Step 1: e2e testga yangi holat qo'shish**

`apps/api/test/listings.e2e-spec.ts` ichidagi mavjud `describe` blokiga (mavjud holatlar tegilmaydi):

```ts
it('har bir seed obyekti koordinata bilan keladi', async () => {
  const res = await request(app.getHttpServer()).get('/api/objects').expect(200);
  for (const item of res.body) {
    expect(typeof item.lat).toBe('number');
    expect(typeof item.lng).toBe('number');
    expect(item.lat).toBeGreaterThan(41.15);
    expect(item.lat).toBeLessThan(41.42);
    expect(item.lng).toBeGreaterThan(69.1);
    expect(item.lng).toBeLessThan(69.45);
  }
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run --config vitest.config.e2e.ts test/listings.e2e-spec.ts`
Expected: FAIL — `expected "undefined" to be "number"`.

- [ ] **Step 3: Prisma sxemasiga ustunlarni qo'shish**

`apps/api/prisma/schema.prisma` dagi `Listing` modeli ichiga, `views` qatoridan oldin:

```prisma
  /// WGS84. Nullable: a listing without a pin still shows everywhere it did before,
  /// and stage 2's draft form saves before the realtor places one.
  lat         Float?
  lng         Float?
```

- [ ] **Step 4: Migratsiyani yaratib, destruktiv emasligini tekshirish**

Run:

```bash
docker compose up -d postgres
yarn workspace @rieltor/api migrate --name add_listing_coordinates
grep -inE 'DROP (TABLE|COLUMN)|ALTER COLUMN' apps/api/prisma/migrations/*_add_listing_coordinates/migration.sql
```

Expected: migratsiya fayli yaratiladi, `grep` hech nima chiqarmaydi. Chiqarsa — **TO'XTA** va sababini xabar qil.

- [ ] **Step 5: Seed ma'lumotiga koordinatalarni yozish**

`apps/api/prisma/seed-data.ts` — interfeysga ikkita maydon:

```ts
/** WGS84. Placed from the address and district; see the plan's note on accuracy. */
lat: number;
lng: number;
```

va har bir e'longa (`district` qatoridan keyin) mos qiymat:

| id     | lat     | lng     |
| ------ | ------- | ------- |
| bx-001 | 41.372  | 69.287  |
| bx-002 | 41.2865 | 69.279  |
| bx-003 | 41.279  | 69.352  |
| bx-004 | 41.286  | 69.216  |
| bx-005 | 41.314  | 69.238  |
| bx-006 | 41.328  | 69.32   |
| bx-007 | 41.276  | 69.256  |
| bx-008 | 41.352  | 69.214  |
| bx-009 | 41.218  | 69.227  |
| bx-010 | 41.302  | 69.183  |
| bx-011 | 41.28   | 69.248  |
| bx-012 | 41.3255 | 69.3345 |
| bx-013 | 41.272  | 69.202  |
| bx-014 | 41.295  | 69.283  |
| bx-015 | 41.335  | 69.33   |
| bx-016 | 41.311  | 69.245  |
| bx-017 | 41.338  | 69.326  |
| bx-018 | 41.279  | 69.21   |

Bu qiymatlar manzil va tuman bo'yicha joylashtirilgan taxminlar — turar-joy majmuasi darajasida to'g'ri, uy raqami darajasida emas. Ular 12-taskda xaritada ko'z bilan tekshiriladi va xato topilsa shu jadvaldagi bitta qator tuzatiladi.

`apps/api/prisma/seed.ts` dagi `upsert` ning `update` va `create` bloklariga `lat: listing.lat` va `lng: listing.lng` qo'shiladi.

- [ ] **Step 6: Sxema va mapper'ni yangilash**

`packages/shared/src/schemas.ts` — `ListingSummarySchema` ichiga, `listedAt` dan keyin:

```ts
  /** WGS84; null when the listing has no pin yet. */
  lat: z.number().nullable(),
  lng: z.number().nullable(),
```

`apps/api/src/listings/mapper.ts` — `toListingSummary` va `toListingDetail` ning ikkalasiga `lat: row.lat,` va `lng: row.lng,` (mavjud maydonlar tartibi buzilmaydi).

- [ ] **Step 7: Web fixture'larini yangilash**

Quyidagi fayllardagi e'lon obyektlariga `lat` va `lng` qo'shiladi (qiymat ixtiyoriy, masalan `lat: 41.31, lng: 69.24`) — testlarning ma'nosi o'zgarmaydi, ular `ListingSummarySchema.parse` dan o'tishi uchun kerak:

- `apps/web/src/pages/home/ui/home-page.test.tsx`
- `apps/web/src/pages/listing/ui/listing-page.test.tsx`

Boshqa fixture faylida e'lon obyekti bo'lsa, unga ham qo'shiladi. Qaysi fayl ekanini `yarn workspace @rieltor/web test` yiqilgan joyidan bilib olasan.

- [ ] **Step 8: Seed'ni qayta ishga tushirib, testlarni tekshirish**

Run:

```bash
yarn workspace @rieltor/api seed
yarn workspace @rieltor/api test
yarn workspace @rieltor/web test
yarn typecheck
```

Expected: hammasi PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/api/prisma apps/api/src/listings/mapper.ts apps/api/test/listings.e2e-spec.ts packages/shared/src/schemas.ts apps/web/src
git commit -m "feat(listings): serve listing coordinates"
```

---

### Task 3: Yaqinlik bo'yicha saralash

**Files:**

- Modify: `apps/web/src/features/listing-filters/model/criteria.ts`
- Modify: `apps/web/src/features/listing-filters/model/use-listing-filters.ts`
- Create: `apps/web/src/features/listing-filters/model/criteria.test.ts`

**Interfaces:**

- Consumes: `distanceKm`, `Point` (Task 1); `ListingSummary.lat/lng` (Task 2)
- Produces:
  - `Sort` endi `'NEW' | 'CHEAP' | 'EXPENSIVE' | 'NEAR'`
  - `filterListings(listings, criteria, origin?: Point | null)`
  - `useListingFilters(listings, origin?: Point | null)`

- [ ] **Step 1: Testni yozish**

`apps/web/src/features/listing-filters/model/criteria.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { ListingSummary } from '@rieltor/shared';
import { EMPTY_CRITERIA, filterListings } from './criteria';

function listing(id: string, lat: number | null, lng: number | null): ListingSummary {
  return {
    id,
    title: `Obyekt ${id}`,
    priceSom: '100000000',
    priceUsd: 8000,
    rooms: 2,
    areaM2: 50,
    floor: '2/9',
    district: 'Chilonzor tumani',
    landmark: 'Metro yaqinida',
    type: 'SECONDARY',
    deal: 'SALE',
    listedAt: '2026-08-01',
    lat,
    lng,
    image: null,
    imageCount: 0,
  };
}

const ORIGIN = { lat: 41.3, lng: 69.24 };

describe('filterListings with NEAR', () => {
  it('puts the closest listing first', () => {
    const far = listing('far', 41.22, 69.22);
    const near = listing('near', 41.301, 69.241);

    const result = filterListings([far, near], { ...EMPTY_CRITERIA, sort: 'NEAR' }, ORIGIN);
    expect(result.map((l) => l.id)).toEqual(['near', 'far']);
  });

  it('pushes listings without coordinates to the end', () => {
    const pinned = listing('pinned', 41.22, 69.22);
    const unpinned = listing('unpinned', null, null);

    const result = filterListings([unpinned, pinned], { ...EMPTY_CRITERIA, sort: 'NEAR' }, ORIGIN);
    expect(result.map((l) => l.id)).toEqual(['pinned', 'unpinned']);
  });

  it('keeps a deterministic order when neither listing has coordinates', () => {
    const older = { ...listing('older', null, null), listedAt: '2026-07-01' };
    const newer = { ...listing('newer', null, null), listedAt: '2026-08-05' };

    const result = filterListings([older, newer], { ...EMPTY_CRITERIA, sort: 'NEAR' }, ORIGIN);
    expect(result.map((l) => l.id)).toEqual(['newer', 'older']);
  });

  it('falls back to the newest-first order when the origin is unknown', () => {
    const older = { ...listing('older', 41.301, 69.241), listedAt: '2026-07-01' };
    const newer = { ...listing('newer', 41.22, 69.22), listedAt: '2026-08-05' };

    const result = filterListings([older, newer], { ...EMPTY_CRITERIA, sort: 'NEAR' }, null);
    expect(result.map((l) => l.id)).toEqual(['newer', 'older']);
  });

  it('leaves the other sorts untouched', () => {
    const cheap = { ...listing('cheap', 41.22, 69.22), priceSom: '50000000' };
    const pricey = { ...listing('pricey', 41.301, 69.241), priceSom: '900000000' };

    const result = filterListings([pricey, cheap], { ...EMPTY_CRITERIA, sort: 'CHEAP' }, ORIGIN);
    expect(result.map((l) => l.id)).toEqual(['cheap', 'pricey']);
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/web vitest run src/features/listing-filters`
Expected: FAIL — `'NEAR'` `Sort` tipida yo'q va `filterListings` uchinchi argument olmaydi.

- [ ] **Step 3: `criteria.ts` ni yangilash**

Tipni va yorliqlarni kengaytirish:

```ts
export type Sort = 'NEW' | 'CHEAP' | 'EXPENSIVE' | 'NEAR';

/** Kept short so the "Saralash: …" pill stays on a single line. */
export const SORT_LABELS: Record<Sort, string> = {
  NEW: 'Yangi',
  CHEAP: 'Arzon',
  EXPENSIVE: 'Qimmat',
  NEAR: 'Yaqin',
};
```

`compare` ga origin qo'shiladi:

```ts
function compare(a: ListingSummary, b: ListingSummary, sort: Sort, origin: Point | null) {
  // Prices fit in a Number (the priciest house is ~2.1 bn), but the source of truth
  // is a string, so BigInt comparison avoids any precision question.
  if (sort === 'CHEAP') return BigInt(a.priceSom) < BigInt(b.priceSom) ? -1 : 1;
  if (sort === 'EXPENSIVE') return BigInt(a.priceSom) > BigInt(b.priceSom) ? -1 : 1;
  if (sort === 'NEAR' && origin) {
    // A listing without a pin cannot be ranked by distance, so it sinks to the end
    // rather than pretending to be at the origin.
    const aKm = listingDistance(a, origin);
    const bKm = listingDistance(b, origin);
    // Two unpinned listings are both Infinity, and Infinity - Infinity is NaN — a
    // comparator returning NaN leaves the order undefined. An exact tie (including
    // that one) falls back to the newest-first rule.
    if (aKm === bKm) return b.listedAt.localeCompare(a.listedAt);
    return aKm - bKm;
  }
  return b.listedAt.localeCompare(a.listedAt);
}

/** Infinity for an unpinned listing — it sorts last and never wins a comparison. */
function listingDistance(listing: ListingSummary, origin: Point): number {
  if (listing.lat === null || listing.lng === null) return Infinity;
  return distanceKm(origin, { lat: listing.lat, lng: listing.lng });
}
```

`filterListings` imzosi va chaqiruvi:

```ts
export function filterListings(
  listings: ListingSummary[] | undefined,
  c: Criteria,
  origin: Point | null = null,
): ListingSummary[] {
```

va `.sort((a, b) => compare(a, b, c.sort, origin));`

Fayl boshiga import: `import { distanceKm, type Point } from '@rieltor/shared';` (mavjud `@rieltor/shared` importiga qo'shib yuboriladi).

- [ ] **Step 4: `use-listing-filters.ts` ga origin qo'shish**

```ts
export function useListingFilters(
  listings: ListingSummary[] | undefined,
  origin: Point | null = null,
) {
```

va oxirida `visible: filterListings(listings, criteria, origin),`

`Point` tipi `@rieltor/shared` dan import qilinadi.

- [ ] **Step 5: Testlarni ishga tushirish**

Run: `yarn workspace @rieltor/web test`
Expected: PASS — 4 ta yangi holat va mavjud testlar (`SortSelect` yangi variantni avtomatik oladi, chunki u `SORT_LABELS` kalitlaridan quriladi).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/listing-filters
git commit -m "feat(web): sort listings by distance"
```

---

### Task 4: Statik xarita komponenti

**Files:**

- Create: `apps/web/src/shared/ui/static-map.tsx`
- Create: `apps/web/src/shared/ui/static-map.test.tsx`
- Create: `apps/web/.env.example`

**Interfaces:**

- Consumes: —
- Produces: `<StaticMap point={{lat, lng}} label={string} className?={string} />` — kalit yo'q bo'lsa `null` qaytaradi

- [ ] **Step 1: Testni yozish**

`apps/web/src/shared/ui/static-map.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StaticMap } from './static-map';

const POINT = { lat: 41.3111, lng: 69.2401 };

afterEach(() => vi.unstubAllEnvs());

describe('StaticMap', () => {
  it('renders a Yandex static image centred on the point', () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
    render(<StaticMap point={POINT} label="Uy joylashuvi" />);

    const image = screen.getByRole('img', { name: 'Uy joylashuvi' });
    const src = image.getAttribute('src') ?? '';
    expect(src).toContain('static-maps.yandex.ru');
    // Yandex takes longitude first in both ll and pt.
    expect(src).toContain('ll=69.2401%2C41.3111');
    expect(src).toContain('pt=69.2401%2C41.3111');
    expect(src).toContain('apikey=test-key');
  });

  it('loads lazily so a collapsed card costs nothing', () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
    render(<StaticMap point={POINT} label="Uy joylashuvi" />);
    expect(screen.getByRole('img', { name: 'Uy joylashuvi' })).toHaveAttribute('loading', 'lazy');
  });

  it('links out to the full Yandex map', () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
    render(<StaticMap point={POINT} label="Uy joylashuvi" />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('yandex.uz/maps'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders nothing when the key is not configured', () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', '');
    const { container } = render(<StaticMap point={POINT} label="Uy joylashuvi" />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/web vitest run src/shared/ui/static-map.test.tsx`
Expected: FAIL — `Failed to resolve import "./static-map"`.

- [ ] **Step 3: Komponentni yozish**

`apps/web/src/shared/ui/static-map.tsx`:

```tsx
interface Props {
  point: { lat: number; lng: number };
  /** Alt text; also what a screen reader announces for the link. */
  label: string;
  className?: string;
}

const ZOOM = 16;
/** Yandex caps a static image at 650×450; this fits a 360px column at 2x. */
const SIZE = '650,320';

/**
 * A picture of the map, not a map. Nothing is downloaded until the image scrolls
 * into view, and no JS API is loaded at all — the interactive map is reserved for
 * the location picker, where panning is the point. Tapping opens Yandex itself.
 */
export function StaticMap({ point, label, className }: Props) {
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_KEY ?? '';
  if (!apiKey) return null;

  // Yandex orders coordinates longitude-first.
  const ll = `${point.lng},${point.lat}`;
  const params = new URLSearchParams({
    ll,
    z: String(ZOOM),
    size: SIZE,
    pt: `${ll},pm2rdm`,
    lang: 'ru_RU',
    apikey: apiKey,
  });

  return (
    <a
      href={`https://yandex.uz/maps/?pt=${ll}&z=${ZOOM}&l=map`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <img
        src={`https://static-maps.yandex.ru/v1?${params.toString()}`}
        alt={label}
        loading="lazy"
        width={650}
        height={320}
        className="h-auto w-full rounded-[12px] border border-line/60"
      />
    </a>
  );
}
```

- [ ] **Step 4: `.env.example` ni yozish**

`apps/web/.env.example`:

```bash
# Yandex Maps kaliti — developer.tech.yandex.ru dan olinadi.
# Bo'sh bo'lsa xaritalar ko'rinmaydi, sayt esa to'liq ishlayveradi.
# Kabinetdagi Telegram bot username'i bilan bir xil faylda turadi.
VITE_YANDEX_MAPS_KEY=
```

Agar `apps/web/.env.example` allaqachon mavjud bo'lsa — mavjud qatorlarga tegmasdan shu blokni oxiriga qo'sh.

- [ ] **Step 5: Testni ishga tushirish**

Run: `yarn workspace @rieltor/web vitest run src/shared/ui/static-map.test.tsx`
Expected: PASS — 4 ta holat.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/shared/ui/static-map.tsx apps/web/src/shared/ui/static-map.test.tsx apps/web/.env.example
git commit -m "feat(web): add the static map component"
```

---

### Task 5: Yandex JS API loader'i

**Files:**

- Create: `apps/web/src/shared/lib/yandex-maps.ts`
- Create: `apps/web/src/shared/lib/yandex-maps.test.ts`

**Interfaces:**

- Consumes: —
- Produces: `loadYandexMaps(): Promise<YandexMaps>` — bir marta yuklaydi, keyingi chaqiruvlar o'sha promise'ni qaytaradi; kalit yo'q bo'lsa rad etadi

- [ ] **Step 1: Testni yozish**

`apps/web/src/shared/lib/yandex-maps.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

/** The loader caches its promise per module instance, so each test needs a fresh one. */
async function freshLoader() {
  vi.resetModules();
  return (await import('./yandex-maps')).loadYandexMaps;
}

afterEach(() => {
  vi.unstubAllEnvs();
  document.querySelectorAll('script').forEach((node) => node.remove());
});

describe('loadYandexMaps', () => {
  it('rejects when the key is not configured', async () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', '');
    const loadYandexMaps = await freshLoader();

    await expect(loadYandexMaps()).rejects.toThrow(/kalit/i);
    expect(document.querySelector('script')).toBeNull();
  });

  it('injects the script once and resolves with the global', async () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
    const loadYandexMaps = await freshLoader();

    const first = loadYandexMaps();
    const second = loadYandexMaps();

    const scripts = document.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]!.src).toContain('api-maps.yandex.ru');
    expect(scripts[0]!.src).toContain('apikey=test-key');

    // The real API calls ready(); stand in for it, then let the script "load".
    const ymaps = { ready: (cb: () => void) => cb() };
    (window as unknown as { ymaps: typeof ymaps }).ymaps = ymaps;
    scripts[0]!.dispatchEvent(new Event('load'));

    await expect(first).resolves.toBe(ymaps);
    await expect(second).resolves.toBe(ymaps);
  });

  it('rejects when the script fails to load', async () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
    const loadYandexMaps = await freshLoader();

    const pending = loadYandexMaps();
    document.querySelector('script')!.dispatchEvent(new Event('error'));

    await expect(pending).rejects.toThrow(/yuklanmadi/i);
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/web vitest run src/shared/lib/yandex-maps.test.ts`
Expected: FAIL — `Failed to resolve import "./yandex-maps"`.

- [ ] **Step 3: Loader'ni yozish**

`apps/web/src/shared/lib/yandex-maps.ts`:

```ts
/** Only the slice of the 2.1 API this app touches. */
export interface YandexMaps {
  ready(callback: () => void): void;
}

declare global {
  interface Window {
    ymaps?: YandexMaps;
  }
}

/**
 * Version 2.1 rather than 3: its imperative `map.getCenter()` is exactly what the
 * picker needs, and it has been stable for years. The script is ~300 KB, which is
 * why nothing outside the picker ever calls this.
 */
const SRC_BASE = 'https://api-maps.yandex.ru/2.1/';

/** Cached across calls: two pickers opening in one session share one download. */
let pending: Promise<YandexMaps> | null = null;

export function loadYandexMaps(): Promise<YandexMaps> {
  if (pending) return pending;

  const apiKey = import.meta.env.VITE_YANDEX_MAPS_KEY ?? '';
  if (!apiKey) {
    return Promise.reject(new Error('Yandex Maps kaliti sozlanmagan'));
  }

  pending = new Promise<YandexMaps>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${SRC_BASE}?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.async = true;

    script.addEventListener('load', () => {
      const ymaps = window.ymaps;
      if (!ymaps) {
        reject(new Error('Yandex Maps yuklanmadi'));
        return;
      }
      // ready() fires once the API's own modules are in place.
      ymaps.ready(() => resolve(ymaps));
    });

    script.addEventListener('error', () => {
      // Let a later attempt retry rather than caching the failure forever.
      pending = null;
      reject(new Error('Yandex Maps yuklanmadi'));
    });

    document.head.appendChild(script);
  });

  return pending;
}
```

- [ ] **Step 4: Testni ishga tushirish**

Run: `yarn workspace @rieltor/web vitest run src/shared/lib/yandex-maps.test.ts`
Expected: PASS — 3 ta holat.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/shared/lib/yandex-maps.ts apps/web/src/shared/lib/yandex-maps.test.ts
git commit -m "feat(web): load the Yandex Maps script on demand"
```

---

### Task 6: Foydalanuvchi joylashuvi — store va hook

**Files:**

- Create: `apps/web/src/features/user-location/model/store.ts`
- Create: `apps/web/src/features/user-location/model/use-user-location.ts`
- Create: `apps/web/src/features/user-location/model/use-user-location.test.ts`

**Interfaces:**

- Consumes: `nearestDistrict`, `Point` (Task 1)
- Produces:
  - `interface UserLocation { lat: number; lng: number; label: string; source: 'gps' | 'manual' }`
  - `useUserLocation(): { location: UserLocation | null; status: 'idle' | 'locating' | 'ready' | 'denied'; detect(): void; setManual(point: Point): void }`

- [ ] **Step 1: Testni yozish**

`apps/web/src/features/user-location/model/use-user-location.test.ts`:

```ts
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'rieltor:user-location';

async function freshHook() {
  vi.resetModules();
  return (await import('./use-user-location')).useUserLocation;
}

function stubGeolocation(impl: Partial<Geolocation>) {
  vi.stubGlobal('navigator', { ...navigator, geolocation: impl as Geolocation });
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('useUserLocation', () => {
  it('starts empty when nothing is stored', async () => {
    stubGeolocation({ getCurrentPosition: vi.fn() });
    const useUserLocation = await freshHook();

    const { result } = renderHook(() => useUserLocation());
    expect(result.current.location).toBeNull();
  });

  it('restores a stored location without asking the browser', async () => {
    const stored = { lat: 41.31, lng: 69.24, label: 'Shayxontohur tumani', source: 'manual' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const getCurrentPosition = vi.fn();
    stubGeolocation({ getCurrentPosition });
    const useUserLocation = await freshHook();

    const { result } = renderHook(() => useUserLocation());
    expect(result.current.location).toEqual(stored);
    expect(result.current.status).toBe('ready');
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('stores the detected point with its district name', async () => {
    stubGeolocation({
      getCurrentPosition: (onSuccess) =>
        onSuccess({ coords: { latitude: 41.3675, longitude: 69.2894 } } as GeolocationPosition),
    });
    const useUserLocation = await freshHook();

    const { result } = renderHook(() => useUserLocation());
    act(() => result.current.detect());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.location?.label).toBe('Yunusobod tumani');
    expect(result.current.location?.source).toBe('gps');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').lat).toBeCloseTo(41.3675, 4);
  });

  it('reports a refusal without storing anything', async () => {
    stubGeolocation({
      getCurrentPosition: (_onSuccess, onError) =>
        onError?.({ code: 1, message: 'denied' } as GeolocationPositionError),
    });
    const useUserLocation = await freshHook();

    const { result } = renderHook(() => useUserLocation());
    act(() => result.current.detect());

    await waitFor(() => expect(result.current.status).toBe('denied'));
    expect(result.current.location).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('stores a manually picked point and labels it', async () => {
    stubGeolocation({ getCurrentPosition: vi.fn() });
    const useUserLocation = await freshHook();

    const { result } = renderHook(() => useUserLocation());
    act(() => result.current.setManual({ lat: 41.22, lng: 69.22 }));

    expect(result.current.location).toEqual({
      lat: 41.22,
      lng: 69.22,
      label: 'Sergeli tumani',
      source: 'manual',
    });
  });

  it('shares one state between two consumers', async () => {
    stubGeolocation({ getCurrentPosition: vi.fn() });
    const useUserLocation = await freshHook();

    const a = renderHook(() => useUserLocation());
    const b = renderHook(() => useUserLocation());

    act(() => a.result.current.setManual({ lat: 41.22, lng: 69.22 }));
    expect(b.result.current.location?.label).toBe('Sergeli tumani');
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/web vitest run src/features/user-location`
Expected: FAIL — `Failed to resolve import "./use-user-location"`.

- [ ] **Step 3: Store'ni yozish**

`apps/web/src/features/user-location/model/store.ts`:

```ts
export interface UserLocation {
  lat: number;
  lng: number;
  /** District name, for the header chip. */
  label: string;
  source: 'gps' | 'manual';
}

export type LocationStatus = 'idle' | 'locating' | 'ready' | 'denied';

const STORAGE_KEY = 'rieltor:user-location';

/**
 * Module-level rather than React context: the header chip, the home list and the
 * listing page all need the same point, and they sit in three different subtrees.
 * A store with useSyncExternalStore keeps them in step without wrapping the app.
 */
let location: UserLocation | null = read();
let status: LocationStatus = location ? 'ready' : 'idle';
const listeners = new Set<() => void>();

function read(): UserLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserLocation;
    return typeof parsed.lat === 'number' && typeof parsed.lng === 'number' ? parsed : null;
  } catch {
    // A corrupt entry is not worth crashing the app over.
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocation(): UserLocation | null {
  return location;
}

export function getStatus(): LocationStatus {
  return status;
}

export function setStatus(next: LocationStatus): void {
  status = next;
  emit();
}

export function setLocation(next: UserLocation): void {
  location = next;
  status = 'ready';
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode can refuse writes; the location still works for this session.
  }
  emit();
}
```

- [ ] **Step 4: Hook'ni yozish**

`apps/web/src/features/user-location/model/use-user-location.ts`:

```ts
import { useCallback, useSyncExternalStore } from 'react';
import { nearestDistrict, type Point } from '@rieltor/shared';
import {
  getLocation,
  getStatus,
  setLocation,
  setStatus,
  subscribe,
  type LocationStatus,
  type UserLocation,
} from './store';

/** High accuracy costs battery and seconds; a district-level fix is all this needs. */
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 5 * 60 * 1000,
};

export function useUserLocation(): {
  location: UserLocation | null;
  status: LocationStatus;
  detect: () => void;
  setManual: (point: Point) => void;
} {
  const location = useSyncExternalStore(subscribe, getLocation, getLocation);
  const status = useSyncExternalStore(subscribe, getStatus, getStatus);

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('denied');
      return;
    }

    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLocation({ ...point, label: nearestDistrict(point), source: 'gps' });
      },
      // Refusal, timeout and "position unavailable" all land here; the user picks
      // manually from here on and is never prompted again.
      () => setStatus('denied'),
      GEOLOCATION_OPTIONS,
    );
  }, []);

  const setManual = useCallback((point: Point) => {
    setLocation({ ...point, label: nearestDistrict(point), source: 'manual' });
  }, []);

  return { location, status, detect, setManual };
}
```

- [ ] **Step 5: Testni ishga tushirish**

Run: `yarn workspace @rieltor/web vitest run src/features/user-location`
Expected: PASS — 6 ta holat.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/user-location
git commit -m "feat(web): track the visitor's location"
```

---

### Task 7: Joy tanlash oynasi va header yorlig'i

**Files:**

- Create: `apps/web/src/features/user-location/ui/location-picker.tsx`
- Create: `apps/web/src/features/user-location/ui/location-picker.test.tsx`
- Create: `apps/web/src/features/user-location/ui/location-chip.tsx`
- Create: `apps/web/src/features/user-location/ui/location-chip.test.tsx`
- Create: `apps/web/src/features/user-location/index.ts`

**Interfaces:**

- Consumes: `useUserLocation` (Task 6), `loadYandexMaps` (Task 5)
- Produces: `<LocationChip />`, `<LocationPicker open onClose />`, `useUserLocation` (re-eksport)

> **Spec §3.3 dan ataylab chetlanish.** Spec avtomatik aniqlashni `app/root-layout.tsx` da ishga tushirishni ko'zda tutgan edi. Amalda u `LocationChip` ichida turadi va `root-layout.tsx` **umuman tegilmaydi**: joylashuv faqat header bo'lgan sahifalarda ishlatiladi (lenta saralashi va yorliqning o'zi), `/obj/:id` esa `TabLayout` dan tashqarida va u yerda masofa ko'rsatilmaydi. Bitta joyda turgani uchun aniqlash ikki marta ishga tushib qolmaydi va testlash osonroq.

- [ ] **Step 1: Testlarni yozish**

`apps/web/src/features/user-location/ui/location-chip.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'rieltor:user-location';

async function freshChip() {
  vi.resetModules();
  return (await import('./location-chip')).LocationChip;
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('LocationChip', () => {
  it('invites the visitor to choose when no location is known', async () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: vi.fn() } });
    const LocationChip = await freshChip();
    render(<LocationChip />);

    expect(screen.getByRole('button', { name: /Joyni tanlash/ })).toBeInTheDocument();
  });

  it('shows the stored district name', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lat: 41.22, lng: 69.22, label: 'Sergeli tumani', source: 'manual' }),
    );
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: vi.fn() } });
    const LocationChip = await freshChip();
    render(<LocationChip />);

    expect(screen.getByRole('button', { name: /Sergeli tumani/ })).toBeInTheDocument();
  });

  it('opens the picker when tapped', async () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: vi.fn() } });
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', '');
    const LocationChip = await freshChip();
    render(<LocationChip />);

    await userEvent.click(screen.getByRole('button', { name: /Joyni tanlash/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

`apps/web/src/features/user-location/ui/location-picker.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocationPicker } from './location-picker';

afterEach(() => vi.unstubAllEnvs());

describe('LocationPicker', () => {
  it('renders nothing while closed', () => {
    const { container } = render(<LocationPicker open={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('explains itself when the map key is missing', async () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', '');
    render(<LocationPicker open onClose={() => {}} />);

    expect(await screen.findByText(/Xarita sozlanmagan/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Testlarni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/web vitest run src/features/user-location`
Expected: FAIL — `Failed to resolve import "./location-chip"`.

- [ ] **Step 3: `location-picker.tsx` ni yozish**

```tsx
import { useEffect, useRef, useState } from 'react';
import { loadYandexMaps } from '@/shared/lib/yandex-maps';
import { useUserLocation } from '../model/use-user-location';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Tashkent centre — where the map starts when nothing better is known. */
const FALLBACK_CENTER = { lat: 41.2995, lng: 69.2401 };
const ZOOM = 13;

/**
 * The one place an interactive map earns its ~300 KB: the visitor drags the map
 * under a fixed pin and the centre becomes their location. The script loads when
 * this opens, never before.
 */
export function LocationPicker({ open, onClose }: Props) {
  const { location, setManual, detect } = useUserLocation();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ getCenter(): [number, number]; destroy(): void } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !container.current) return;

    let cancelled = false;
    const start = location ?? FALLBACK_CENTER;

    loadYandexMaps()
      .then((ymaps) => {
        if (cancelled || !container.current) return;
        const maps = ymaps as unknown as {
          Map: new (
            el: HTMLElement,
            state: { center: [number, number]; zoom: number; controls: string[] },
          ) => { getCenter(): [number, number]; destroy(): void };
        };
        // Yandex orders coordinates latitude-first in the JS API.
        mapRef.current = new maps.Map(container.current, {
          center: [start.lat, start.lng],
          zoom: ZOOM,
          controls: ['zoomControl'],
        });
      })
      .catch(() =>
        setError(
          import.meta.env.VITE_YANDEX_MAPS_KEY
            ? "Xaritani yuklab bo'lmadi. Keyinroq urinib ko'ring."
            : 'Xarita sozlanmagan.',
        ),
      );

    return () => {
      cancelled = true;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [open, location]);

  if (!open) return null;

  function confirm() {
    const center = mapRef.current?.getCenter();
    if (!center) return;
    setManual({ lat: center[0], lng: center[1] });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-label="Joyni tanlash"
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-ink/40"
    >
      <div className="rounded-t-[20px] bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold">Joyingizni tanlang</h2>
          <button type="button" onClick={onClose} className="text-[14px] font-bold text-ink-3">
            Yopish
          </button>
        </div>

        {error ? (
          <p className="py-8 text-center text-[14px] font-semibold text-ink-2">{error}</p>
        ) : (
          <div className="relative">
            <div ref={container} className="h-[260px] w-full overflow-hidden rounded-[14px]" />
            {/* The pin never moves; the map slides underneath it. */}
            <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-[28px]">
              📍
            </span>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={detect}
            className="flex-1 rounded-[14px] border-[1.5px] border-line py-3 text-[14px] font-extrabold text-ink-2"
          >
            Meni topish
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={Boolean(error)}
            className="flex-1 rounded-[14px] bg-accent py-3 text-[14px] font-extrabold text-white disabled:opacity-60"
          >
            Shu yerni tanlash
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `location-chip.tsx` va `index.ts` ni yozish**

`location-chip.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Icon } from '@/shared/ui/icon';
import { useUserLocation } from '../model/use-user-location';
import { LocationPicker } from './location-picker';

/**
 * Sits where the static "Toshkent" label used to. Detection runs once on mount —
 * after the first paint, so it never delays the LCP — and only when nothing is
 * stored yet. A refusal is final: the visitor picks from the map instead.
 */
export function LocationChip() {
  const { location, status, detect } = useUserLocation();
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (status === 'idle') detect();
  }, [status, detect]);

  const label = location?.label ?? (status === 'locating' ? 'Aniqlanmoqda…' : 'Joyni tanlash');

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-[7px] text-[13px] font-semibold text-ink-2"
      >
        <Icon name="pin" className="h-[13px] w-[13px] text-accent" strokeWidth={2.4} />
        {label}
      </button>

      <LocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}
```

`index.ts`:

```ts
export { useUserLocation } from './model/use-user-location';
export type { UserLocation } from './model/store';
export { LocationChip } from './ui/location-chip';
export { LocationPicker } from './ui/location-picker';
```

- [ ] **Step 5: Testlarni ishga tushirish**

Run: `yarn workspace @rieltor/web test`
Expected: PASS — 5 ta yangi holat va mavjud testlar.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/user-location
git commit -m "feat(web): add the location chip and map picker"
```

---

### Task 8: Header'ni ulash

**Files:**

- Modify: `apps/web/src/widgets/site-header/ui/site-header.tsx`

**Interfaces:**

- Consumes: `LocationChip` (Task 7)
- Produces: header'da joylashuv yorlig'i

- [ ] **Step 1: Header'ni yangilash**

`site-header.tsx` da statik "Toshkent" bloki (`<div className="flex items-center gap-1.5 rounded-full border border-line bg-surface …">Toshkent</div>` va uning ustidagi izoh) `<LocationChip />` bilan almashtiriladi. Import: `import { LocationChip } from '@/features/user-location';`

"Rieltor uchun" havolasi va logotip tegilmaydi.

- [ ] **Step 2: 360px da sig'ishini tekshirish**

Run: `yarn workspace @rieltor/web test`
Expected: mavjud testlar PASS.

Keyin `yarn workspace @rieltor/web dev` ni ishga tushirib, brauzerni 360px kenglikda ochib, header bir qatorga sig'ishini va gorizontal skroll paydo bo'lmasligini ko'z bilan tekshir. Tuman nomi uzun bo'lsa (`Mirzo Ulug'bek tumani`) yorliqqa `max-w-[130px] truncate` qo'sh — logotipni yoki "Rieltor uchun" havolasini qisqartirma.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/widgets/site-header
git commit -m "feat(web): show the visitor's district in the header"
```

---

### Task 9: E'lon kartasida ikonka va xarita

**Files:**

- Modify: `apps/web/src/entities/listing/ui/listing-card.tsx`
- Create: `apps/web/src/entities/listing/ui/listing-card.test.tsx`

**Interfaces:**

- Consumes: `StaticMap` (Task 4)
- Produces: `ListingCard` yangi proplari — `distanceLabel?: string`, `mapOpen?: boolean`, `onToggleMap?: () => void`

- [ ] **Step 1: Testni yozish**

`apps/web/src/entities/listing/ui/listing-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ListingSummary } from '@rieltor/shared';
import { ListingCard } from './listing-card';

const listing: ListingSummary = {
  id: 'bx-001',
  title: '3 xonali kvartira',
  priceSom: '780000000',
  priceUsd: 65000,
  rooms: 3,
  areaM2: 84,
  floor: '3/5',
  district: 'Yunusobod tumani',
  landmark: '265-maktab yaqinida',
  type: 'SECONDARY',
  deal: 'SALE',
  listedAt: '2026-07-22',
  lat: 41.372,
  lng: 69.287,
  image: null,
  imageCount: 0,
};

function renderCard(props: Partial<Parameters<typeof ListingCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ListingCard listing={listing} {...props} />
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllEnvs());

describe('ListingCard location', () => {
  it('shows the distance when it is known', () => {
    renderCard({ distanceLabel: '2.4 km' });
    expect(screen.getByText('2.4 km')).toBeInTheDocument();
  });

  it('offers the map button only for a listing with coordinates', () => {
    renderCard({ onToggleMap: () => {} });
    expect(screen.getByRole('button', { name: "Joylashuvni ko'rsatish" })).toBeInTheDocument();

    renderCard({ listing: { ...listing, lat: null, lng: null }, onToggleMap: () => {} });
    expect(screen.getAllByRole('button', { name: "Joylashuvni ko'rsatish" })).toHaveLength(1);
  });

  it('calls back when the map button is tapped', async () => {
    const onToggleMap = vi.fn();
    renderCard({ onToggleMap });

    await userEvent.click(screen.getByRole('button', { name: "Joylashuvni ko'rsatish" }));
    expect(onToggleMap).toHaveBeenCalledOnce();
  });

  it('renders the map only while open', () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');

    const closed = renderCard({ onToggleMap: () => {} });
    expect(closed.queryByRole('img', { name: /joylashuvi/i })).toBeNull();
    closed.unmount();

    renderCard({ onToggleMap: () => {}, mapOpen: true });
    expect(screen.getByRole('img', { name: /joylashuvi/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/web vitest run src/entities/listing/ui/listing-card.test.tsx`
Expected: FAIL — `distanceLabel` propi yo'q va tugma topilmaydi.

- [ ] **Step 3: Kartani yangilash**

`Props` ga qo'shiladi:

```tsx
  /** Pre-formatted, e.g. "2.4 km" — the card never computes it (FSD: entities have no user location). */
  distanceLabel?: string;
  mapOpen?: boolean;
  /** Absent when the page does not offer maps at all. */
  onToggleMap?: () => void;
```

Rasm ustidagi `imageCount` blokining yonida (`absolute right-2.5 bottom-2.5` bloki bilan bir qatorda emas, uning chap tomonida) masofa belgisi:

```tsx
{
  distanceLabel && (
    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-lg bg-ink/55 px-2 py-1 text-[11.5px] font-bold text-white backdrop-blur-sm">
      <Icon name="pin" className="h-3 w-3" strokeWidth={2.2} />
      {distanceLabel}
    </div>
  );
}
```

Kartaning matn qismi oxirida, `</Link>` dan **keyin** (tugma havola ichida bo'lmasligi kerak — aks holda bosilganda obyekt sahifasi ochiladi):

```tsx
{
  onToggleMap && listing.lat !== null && listing.lng !== null && (
    <div className="border-t border-line/60 px-4 py-2.5">
      <button
        type="button"
        onClick={onToggleMap}
        aria-expanded={mapOpen}
        className="flex items-center gap-1.5 text-[13px] font-bold text-accent"
      >
        <Icon name="pin" className="h-3.5 w-3.5" strokeWidth={2.4} />
        Joylashuvni ko'rsatish
      </button>

      {mapOpen && (
        <StaticMap
          point={{ lat: listing.lat, lng: listing.lng }}
          label={`${listing.title} joylashuvi`}
          className="mt-2.5 block"
        />
      )}
    </div>
  );
}
```

Import: `import { StaticMap } from '@/shared/ui/static-map';`

- [ ] **Step 4: Testni ishga tushirish**

Run: `yarn workspace @rieltor/web test`
Expected: PASS — 4 ta yangi holat va mavjud testlar.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/entities/listing/ui/listing-card.tsx apps/web/src/entities/listing/ui/listing-card.test.tsx
git commit -m "feat(web): add a location toggle to the listing card"
```

---

### Task 10: Bosh sahifa va qidiruv sahifasini ulash

**Files:**

- Create: `apps/web/src/entities/listing/lib/distance-label.ts`
- Modify: `apps/web/src/entities/listing/index.ts`
- Modify: `apps/web/src/pages/home/ui/home-page.tsx`
- Modify: `apps/web/src/pages/search/ui/search-page.tsx`
- Modify: `apps/web/src/pages/home/ui/home-page.test.tsx`

**Interfaces:**

- Consumes: `useUserLocation` (Task 6), `useListingFilters(listings, origin)` (Task 3), `ListingCard` yangi proplari (Task 9), `distanceKm`, `formatDistance` (Task 1)
- Produces: —

- [ ] **Step 1: Testga yangi holat qo'shish**

`apps/web/src/pages/home/ui/home-page.test.tsx` ichiga (mavjud holat tegilmaydi; fixture'ga Task 2 da `lat`/`lng` qo'shilgan):

```tsx
it('opens one card map at a time', async () => {
  localStorage.setItem(
    'rieltor:user-location',
    JSON.stringify({ lat: 41.31, lng: 69.24, label: 'Shayxontohur tumani', source: 'manual' }),
  );
  vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify([listings[0], { ...listings[0], id: 'bx-002' }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    ),
  );

  renderPage();

  const buttons = await screen.findAllByRole('button', { name: "Joylashuvni ko'rsatish" });
  await userEvent.click(buttons[0]!);
  expect(screen.getAllByRole('img', { name: /joylashuvi/i })).toHaveLength(1);

  await userEvent.click(buttons[1]!);
  expect(screen.getAllByRole('img', { name: /joylashuvi/i })).toHaveLength(1);
});
```

Fayl boshiga `userEvent` importi qo'shiladi (`import userEvent from '@testing-library/user-event';`), `afterEach` ga `localStorage.clear()` va `vi.unstubAllEnvs()`.

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/web vitest run src/pages/home`
Expected: FAIL — tugma topilmaydi.

- [ ] **Step 3: `home-page.tsx` ni ulash**

```tsx
const { location } = useUserLocation();
const origin = location ? { lat: location.lat, lng: location.lng } : null;
const filters = useListingFilters(data, origin);
const [openMapId, setOpenMapId] = useState<string | null>(null);
```

va kartani chizishda:

```tsx
<ListingCard
  key={listing.id}
  listing={listing}
  isFirst={i === 0}
  favoriteSlot={<FavoriteButton id={listing.id} />}
  distanceLabel={distanceLabel(listing, origin)}
  mapOpen={openMapId === listing.id}
  onToggleMap={() => setOpenMapId((id) => (id === listing.id ? null : listing.id))}
/>
```

Masofa yorlig'i ikkala sahifada kerak bo'lgani uchun u alohida faylda turadi — `apps/web/src/entities/listing/lib/distance-label.ts` (yangi fayl):

```ts
import { distanceKm, formatDistance, type ListingSummary, type Point } from '@rieltor/shared';

/**
 * A card's distance badge, or undefined when either end of the measurement is
 * missing. Lives in `entities` because it only depends on a listing and a point —
 * the user's location itself is a `features` concern and is passed in.
 */
export function distanceLabel(listing: ListingSummary, origin: Point | null): string | undefined {
  if (!origin || listing.lat === null || listing.lng === null) return undefined;
  return formatDistance(distanceKm(origin, { lat: listing.lat, lng: listing.lng }));
}
```

va `apps/web/src/entities/listing/index.ts` dan eksport qilinadi:

```ts
export { distanceLabel } from './lib/distance-label';
```

`home-page.tsx` importlari: `import { ListingCard, distanceLabel, listingsQuery } from '@/entities/listing';` va `import { useUserLocation } from '@/features/user-location';`

- [ ] **Step 4: `search-page.tsx` ga xuddi shu ulanishni qilish**

`search-page.tsx` ni ochib, unda e'lon kartalari chizilgan joyni top (u `ListingCard` yoki `ListingRow` ishlatishi mumkin — real kodga qara). `ListingCard` ishlatilsa, unga xuddi Step 3 dagi to'rt propni uzat: `distanceLabel(listing, origin)`, `mapOpen`, `onToggleMap` va o'sha sahifaning o'z `openMapId` holati. `useListingFilters` chaqirilsa, unga ham `origin` uzatiladi.

Yordamchini **takrorlama** — Step 3 da yaratilgan `distanceLabel` ni `@/entities/listing` dan import qil.

Agar sahifa `ListingRow` (kichik qatorli ko'rinish) ishlatsa va unda karta xaritasi mantiqan mos kelmasa — u yerga xarita tugmasini qo'shma, faqat `origin` ni saralashga uzat va hisobotda shuni yozib qo'y.

- [ ] **Step 5: Testlarni ishga tushirish**

Run: `yarn workspace @rieltor/web test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages apps/web/src/entities/listing
git commit -m "feat(web): sort the feed by distance and open card maps"
```

---

### Task 11: Obyekt sahifasidagi xarita

**Files:**

- Modify: `apps/web/src/entities/listing/ui/location.tsx`
- Modify: `apps/web/src/pages/listing/ui/listing-page.tsx`
- Modify: `apps/web/src/pages/listing/ui/listing-page.test.tsx`

**Interfaces:**

- Consumes: `StaticMap` (Task 4)
- Produces: `<Location landmark address lat? lng? title? />`

- [ ] **Step 1: Testga yangi holat qo'shish**

`apps/web/src/pages/listing/ui/listing-page.test.tsx` ichiga:

```tsx
it('shows the map under the address', async () => {
  vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
  renderPage();

  expect(await screen.findByRole('img', { name: /joylashuvi/i })).toBeInTheDocument();
});
```

`afterEach` ga `vi.unstubAllEnvs()` qo'shiladi (agar yo'q bo'lsa).

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/web vitest run src/pages/listing`
Expected: FAIL — rasm topilmaydi.

- [ ] **Step 3: `location.tsx` ni yangilash**

Fayl boshidagi izoh almashtiriladi va proplar kengaytiriladi:

```tsx
interface Props {
  landmark: string;
  address: string;
  /** Both null for a listing with no pin — then only the text is shown. */
  lat: number | null;
  lng: number | null;
  /** Used for the map's alt text. */
  title: string;
}

/**
 * Address and landmark as text, with a static map picture under them. The map is
 * a picture on purpose — the interactive API is reserved for the location picker
 * (spec §3.1), and tapping the image opens Yandex itself.
 */
export function Location({ landmark, address, lat, lng, title }: Props) {
```

va `</>` dan oldin:

```tsx
{
  lat !== null && lng !== null && (
    <StaticMap point={{ lat, lng }} label={`${title} joylashuvi`} className="mt-3 block" />
  );
}
```

Import: `import { StaticMap } from '@/shared/ui/static-map';`

- [ ] **Step 4: `listing-page.tsx` da proplarni uzatish**

```tsx
<Location
  landmark={data.landmark}
  address={data.address}
  lat={data.lat}
  lng={data.lng}
  title={data.title}
/>
```

- [ ] **Step 5: Testni ishga tushirish**

Run: `yarn workspace @rieltor/web test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/entities/listing/ui/location.tsx apps/web/src/pages/listing
git commit -m "feat(web): show the listing location on a map"
```

---

### Task 12: Playwright, hujjat va yakuniy tekshiruv

**Files:**

- Create: `e2e/location.spec.ts`
- Modify: `docs/project-overview.md`

**Interfaces:**

- Consumes: 1–11 tasklar natijasi
- Produces: brauzer darajasidagi regressiya to'ri

- [ ] **Step 1: Playwright testini yozish**

`e2e/location.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

/** Yunusobod — far from the Sergeli and Chilonzor listings, so the order is decisive. */
test.use({
  geolocation: { latitude: 41.3675, longitude: 69.2894 },
  permissions: ['geolocation'],
});

test.describe('Location (360px)', () => {
  test('detects the district and shows it in the header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Yunusobod tumani/ })).toBeVisible();
  });

  test('sorting by distance puts the nearest listing first', async ({ page }) => {
    await page.goto('/');

    const titles = page.locator('article h3');
    const before = await titles.first().textContent();

    await page.getByLabel('Saralash tartibi').selectOption('NEAR');
    await expect(page.getByText(/Saralash: Yaqin/)).toBeVisible();

    // The first card now carries a distance badge, and the order has changed.
    await expect(page.locator('article').first().getByText(/km|m$/)).toBeVisible();
    expect(await titles.first().textContent()).not.toBe(before);
  });

  test('there is no horizontal scroll', async ({ page }) => {
    await page.goto('/');
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });
});
```

Kartadagi sarlavha `h3` emas boshqa teg bo'lsa — real markup'ga qarab selektorni moslashtir, testning ma'nosini o'zgartirma.

- [ ] **Step 2: Stack'ni ko'tarib testni ishga tushirish**

Run:

```bash
SEED_AGENT_TEL='+998901234567' SEED_AGENT_TG='test' \
  docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
until curl -sf http://localhost:3000/api/health > /dev/null; do sleep 2; done
yarn e2e
```

Expected: barcha spec'lar (mavjudlari va yangisi) PASS.

**Diqqat:** docker stack `VITE_YANDEX_MAPS_KEY` siz quriladi, ya'ni xaritalar ko'rinmaydi — bu ataylab: test masofa saralashini tekshiradi, xarita rasmini emas. Xarita rasmi unit testlar bilan qoplangan.

- [ ] **Step 3: Koordinatalarni ko'z bilan tekshirish**

`apps/web/.env` ga kalit qo'yib `yarn workspace @rieltor/web dev` ni ishga tushir, bir nechta e'lon kartasini ochib xarita markeri manzilga mos tushganini tekshir (`bx-012` — Buyuk Ipak Yo'li metrosi atrofi, `bx-018` — Chilonzor 6-kvartal, `bx-009` — Sergeli). Sezilarli xato topsang, `seed-data.ts` dagi o'sha qatorni tuzatib, `yarn workspace @rieltor/api seed` ni qayta ishga tushir va hisobotda qaysi qatorni o'zgartirganingni yoz.

- [ ] **Step 4: Hujjatni yangilash**

`docs/project-overview.md` — "Foydalanuvchi ko'radigan qism" ro'yxatiga:

```markdown
- **Joylashuv va xarita** — sayt ochilganda foydalanuvchining joyi so'raladi (rad etilsa header'dagi
  yorliqdan xaritada qo'lda tanlanadi). "Yaqin" saralash e'lonlarni masofa bo'yicha tartiblaydi va
  kartalarda masofa ko'rinadi; kartadagi "Joylashuvni ko'rsatish" tugmasi va obyekt sahifasi uyni
  Yandex xaritasida ko'rsatadi. Xarita `VITE_YANDEX_MAPS_KEY` berilganda yoqiladi.
```

- [ ] **Step 5: To'liq quvurni ishga tushirish**

Run:

```bash
docker compose -f docker-compose.yml -f docker-compose.e2e.yml down
yarn format:check && yarn lint && yarn typecheck && yarn build && yarn test
```

Expected: hammasi PASS.

- [ ] **Step 6: Commit**

```bash
git add e2e/location.spec.ts docs/project-overview.md apps/api/prisma/seed-data.ts
git commit -m "test(e2e): cover geolocation and distance sorting"
```

---

## Bosqich DoD

- [ ] Sayt ochilganda joylashuv so'raladi; ruxsat berilsa header'da tuman nomi chiqadi
- [ ] "Yaqin" saralash lentani masofa bo'yicha qayta tartiblaydi va kartalarda masofa ko'rinadi
- [ ] Kartadagi tugma bosilganda karta ichida xarita ochiladi, bir vaqtda faqat bittasi
- [ ] Obyekt sahifasida manzil ostida xarita bor
- [ ] Header yorlig'i orqali joyni xaritadan qo'lda tanlash ishlaydi va saqlanadi
- [ ] Kalitsiz va geolokatsiyasiz holatda sayt avvalgidek ishlaydi
- [ ] Migratsiyada `DROP`/`ALTER COLUMN` yo'q; mavjud testlar to'liq yashil
- [ ] `format → lint → typecheck → build → test` va `yarn e2e` yashil
