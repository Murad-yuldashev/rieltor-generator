# 2a-bosqich: E'lon CRUD, statuslar va ko'rinish qoidalari — implementatsiya rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rieltor kabinet orqali (API darajasida) matnli e'lon yaratadi, tahrirlaydi, publish qiladi va status'ini o'zgartiradi; ommaviy lenta faqat `ACTIVE`/`RESERVED` e'lonlarni ko'rsatadi — rasm yuklash (2b) va kabinet formasi (2c) shunga quriladi.

**Architecture:** Mavjud `listings` moduliga yozuv qismi (`ListingsWriteService` + `ListingsWriteController`) qo'shiladi; hayot sikli jadvali va publish-validatsiya `@rieltor/shared` dagi sof funksiya/sxemalar. `Realtor → Agent` ko'zgusi `RealtorsService.syncAgent()` da yagona joyda upsert qilinadi va DRAFT yaratishda chaqiriladi, shuning uchun `Listing.agentId` `NOT NULL` bo'lib qoladi. Ko'rinish qoidalari `ListingsService` ning `findAll`/`findOne` metodlariga status filtri sifatida qo'shiladi.

**Tech Stack:** NestJS 11 · Prisma 6 · PostgreSQL 16 · Zod 4 (`@rieltor/shared`, nestjs-zod) · Vitest · supertest · Yarn 4 workspaces

**Manba spec:** [2026-08-09-listing-publishing-design.md](../specs/2026-08-09-listing-publishing-design.md) — §5.1, §5.2, §5.3, §7.4 (publish-validatsiya §7.4 oxiri)

## Global Constraints

- **Faqat qo'shimcha (additive).** Migratsiyada `DROP TABLE`, `DROP COLUMN`, `ALTER COLUMN` (jumladan `NOT NULL` ni bo'shatish) **taqiqlanadi**. Yangi ustunlar NULLable yoki default qiymatli. Har migratsiyadan keyin: `grep -inE 'DROP (TABLE|COLUMN)|ALTER COLUMN' apps/api/prisma/migrations/*_<name>/migration.sql` — bo'sh chiqishi shart.
- **Mavjud narsalar o'zgarmaydi:** ommaviy sahifalar, `GET /api/objects` javob **shakli** (yangi maydon qo'shilmaydi), `GET /api/objects/:id`, `POST|GET /api/view/:id`, `/api/health`, `/api/docs`, OG-inject, sharp rasm-quvuri, seed skriptlari, mavjud testlar va assertion'lar.
- **Xulq kafolatlari:** anonim tashrif buyuruvchi uchun sayt loginsiz to'liq ishlaydi; seed e'lonlari (`status=ACTIVE`, `realtorId=NULL`) lentada avvalgidek ko'rinadi; DB yiqilsa sahifa ochilaveradi; yangi env berilmasa kabinet o'chadi, ilova yiqilmaydi.
- **Rasmlar bu bosqichda YO'Q.** Publish-validatsiyaning "≥1 rasm" qoidasi shu bosqichda ham majburlanadi, lekin rasm faqat testda `prisma.image.create` orqali qo'shiladi; yuklash endpointi 2b-bosqichda.
- **Kod, fayl nomi, marshrut, izoh va test nomlari — ingliz tilida**; foydalanuvchi ko'radigan matn (xato xabarlari) — o'zbekcha. Marshrut prefiksi mavjud uslubda: `@Controller('objects')`.
- Repo `noUncheckedIndexedAccess` yoqilgan; ESLint faqat `^_` bilan boshlanadigan **argumentlarni** kechiradi (ishlatilmagan lokal o'zgaruvchi emas).
- Har task oxirida: `yarn format`, `yarn lint`, `yarn typecheck`, `yarn build`, `yarn test` — hammasi yashil, keyin commit.
- DB kerak bo'lgan tasklar uchun `docker compose up -d postgres` ishlab turishi shart; `DATABASE_URL=postgresql://rieltor:rieltor@localhost:5432/rieltor`.
- Commit xabari oxirida: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

## Spec'dan ongli chetlanishlar (foydalanuvchi bilan tasdiqlangan)

1. **Rasm saqlash — local disk + abstraksiya (2b).** Dizayn spec §6 R2'ni tanlagan; foydalanuvchi 2-bosqichni blokdan ozod qilish uchun `MediaStorage` interfeysi ortida avval local-disk implementatsiyasini qurishni tanladi. R2 backend keyin, kredensiallar bo'lganda qo'shiladi. Bu 2b-bosqichning masalasi — 2a media'ga tegmaydi.
2. **2-bosqich uch kichik rejaga bo'lindi** (2a backend / 2b media / 2c frontend), har biri mustaqil test qilinadigan dastur beradi. Dizayn §9 "bitta reja" degan edi; `writing-plans` skill'ining scope-check tavsiyasiga ko'ra bo'lindi.
3. **`syncAgent` DRAFT yaratishda chaqiriladi** (nafaqat publish'da). Sabab: `Listing.agentId` hozir `NOT NULL` va uni NULLable qilish `ALTER COLUMN` — taqiqlangan. Shuning uchun har e'lon boshidanoq `agentId` oladi; `Agent`ning NOT NULL maydonlari rieltordan bo'sh-string fallback bilan to'ldiriladi (DRAFT ommaviy 404 bo'lgani uchun ko'rinmaydi), publish'da haqiqiy telefon bilan yangilanadi.

## File Structure

**Yangi fayllar:**

| Fayl                                                   | Mas'uliyat                                                                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `packages/shared/src/listing-status.ts`                | `ListingStatusSchema`, `ListingStatus`, `ListingRole`, `allowedTransitions()`    |
| `packages/shared/src/listing-status.test.ts`           | Uning testlari                                                                   |
| `packages/shared/src/listing-input.ts`                 | `ListingInputSchema` (DRAFT uchun hammasi ixtiyoriy), `PublishableListingSchema` |
| `packages/shared/src/listing-input.test.ts`            | Uning testlari                                                                   |
| `apps/api/src/listings/listings-write.service.ts`      | `createDraft`, `update`, `changeStatus`, `assertOwner`                           |
| `apps/api/src/listings/listings-write.service.test.ts` | Uning testlari (soxta Prisma)                                                    |
| `apps/api/src/listings/listings-write.controller.ts`   | `POST /api/objects`, `PATCH /api/objects/:id`, `POST /api/objects/:id/status`    |
| `apps/api/src/listings/my-listings.controller.ts`      | `GET /api/me/objects`, `GET /api/me/objects/:id` (egaga, har status)             |
| `apps/api/src/listings/owner-mapper.ts`                | `toOwnerListingSummary`, `toOwnerListingDetail` (status bilan)                   |
| `apps/api/test/listings-write.e2e-spec.ts`             | CRUD + publish + status e2e (dev-login bilan)                                    |
| `apps/api/test/listing-visibility.e2e-spec.ts`         | Ko'rinish qoidalari e2e                                                          |

**O'zgaradigan mavjud fayllar:** `apps/api/prisma/schema.prisma` (+ migratsiya), `packages/shared/src/index.ts`, `packages/shared/src/schemas.ts` (owner sxemalari), `apps/api/src/listings/listings.dto.ts` (yangi DTO'lar), `apps/api/src/listings/listings.service.ts` (ko'rinish filtri), `apps/api/src/listings/listings.module.ts` (yangi provider/controller), `apps/api/src/realtors/realtors.service.ts` (`syncAgent`), `apps/api/src/realtors/realtors.module.ts` (agar `RealtorsService` eksport qilinmagan bo'lsa).

---

### Task 1: Prisma — hayot sikli maydonlari va realtor bog'lanishi

**Files:**

- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_add_listing_lifecycle/migration.sql` (Prisma generatsiya qiladi)

**Interfaces:**

- Consumes: —
- Produces: `ListingStatus` enum va `Listing` da `status, realtorId, realtor, publishedAt, expiresAt, soldAt, moderationNote`; `Realtor.listings`

- [ ] **Step 1: `ListingStatus` enum'ini qo'shish**

`apps/api/prisma/schema.prisma` da mavjud `enum Deal { ... }` dan keyin:

```prisma
enum ListingStatus {
  DRAFT
  PENDING
  ACTIVE
  RESERVED
  SOLD
  RENTED
  ARCHIVED
}
```

- [ ] **Step 2: `Listing` modeliga maydonlarni qo'shish**

`Listing` modeli ichida, `deal` qatoridan keyin (mavjud maydonlar tartibi buzilmaydi):

```prisma
  /// Lifecycle. The seed listings predate this column and default to ACTIVE, so
  /// they keep showing on the public feed exactly as before.
  status         ListingStatus @default(ACTIVE)
  /// The owning realtor. NULL for the seed listings, which have no cabinet owner.
  realtorId      String?
  realtor        Realtor?      @relation(fields: [realtorId], references: [id])
  /// Set the moment the listing first goes ACTIVE. Drives expiresAt and the cron.
  publishedAt    DateTime?
  /// publishedAt + 30 days; the stage-4 cron archives listings past this.
  expiresAt      DateTime?
  /// When it became SOLD or RENTED — drives "SOTILDI · N kunda".
  soldAt         DateTime?
  /// Admin's reason when a PENDING listing is rejected back to DRAFT (stage 4).
  moderationNote String?
```

va `Listing` modelining mavjud `@@index` qatorlari yoniga:

```prisma
  @@index([status])
  @@index([realtorId])
```

- [ ] **Step 3: `Realtor` modeliga teskari relation qo'shish**

`Realtor` modeli ichida, `createdAt` qatoridan keyin:

```prisma
  /// The realtor's own listings (reverse of Listing.realtor).
  listings      Listing[]
```

- [ ] **Step 4: Migratsiyani yaratish**

Run:

```bash
docker compose up -d postgres
yarn workspace @rieltor/api migrate --name add_listing_lifecycle
```

Expected: `migrations/<timestamp>_add_listing_lifecycle/migration.sql` yaratiladi (`CREATE TYPE "ListingStatus"`, `ALTER TABLE "Listing" ADD COLUMN ...`, ikkita `CREATE INDEX`).

- [ ] **Step 5: Migratsiya destruktiv emasligini tekshirish**

Run:

```bash
grep -inE 'DROP (TABLE|COLUMN)|ALTER COLUMN' apps/api/prisma/migrations/*_add_listing_lifecycle/migration.sql
```

Expected: hech qanday chiqish yo'q (exit code 1). Chiqsa — **TO'XTA**, sxema o'zgarishini qayta ko'rib chiq (`ADD COLUMN` — bu qatorda "ALTER TABLE" bo'ladi, "ALTER COLUMN" emas, shuning uchun grep bo'sh qoladi).

- [ ] **Step 6: Seed qayta ishga tushib, mavjud testlar yashilligini tekshirish**

Run:

```bash
yarn workspace @rieltor/api seed
yarn workspace @rieltor/api test
```

Expected: seed muvaffaqiyatli (seed e'lonlari `status` default `ACTIVE` oladi); barcha mavjud unit va e2e testlar PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(db): add listing lifecycle fields and realtor ownership"
```

---

### Task 2: `@rieltor/shared` — status sxemasi va `allowedTransitions`

**Files:**

- Create: `packages/shared/src/listing-status.ts`
- Create: `packages/shared/src/listing-status.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**

- Consumes: —
- Produces:
  - `ListingStatusSchema` / `type ListingStatus`
  - `type ListingRole = 'realtor' | 'admin'`
  - `allowedTransitions(status: ListingStatus, role: ListingRole): ListingStatus[]`

- [ ] **Step 1: Testni yozish**

`packages/shared/src/listing-status.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { allowedTransitions } from './listing-status';

describe('allowedTransitions (realtor)', () => {
  it('lets a realtor publish a draft (the service downgrades to PENDING when untrusted)', () => {
    expect(allowedTransitions('DRAFT', 'realtor')).toEqual(['ACTIVE']);
  });

  it('lets a realtor withdraw a pending listing', () => {
    expect(allowedTransitions('PENDING', 'realtor')).toEqual(['DRAFT']);
  });

  it('offers reserve, sold, rented and archive from active', () => {
    expect(allowedTransitions('ACTIVE', 'realtor')).toEqual([
      'RESERVED',
      'SOLD',
      'RENTED',
      'ARCHIVED',
    ]);
  });

  it('lets a sold listing be reactivated (the service enforces the 48h window)', () => {
    expect(allowedTransitions('SOLD', 'realtor')).toEqual(['ACTIVE']);
    expect(allowedTransitions('RENTED', 'realtor')).toEqual(['ACTIVE']);
  });

  it('lets an archived listing be reactivated', () => {
    expect(allowedTransitions('ARCHIVED', 'realtor')).toEqual(['ACTIVE']);
  });
});

describe('allowedTransitions (admin)', () => {
  it('lets an admin approve or reject a pending listing', () => {
    expect(allowedTransitions('PENDING', 'admin')).toEqual(['ACTIVE', 'DRAFT']);
  });

  it('gives an admin no moves from any non-pending status', () => {
    expect(allowedTransitions('ACTIVE', 'admin')).toEqual([]);
    expect(allowedTransitions('DRAFT', 'admin')).toEqual([]);
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/shared vitest run src/listing-status.test.ts`
Expected: FAIL — `Failed to resolve import "./listing-status"`.

- [ ] **Step 3: `listing-status.ts` ni yozish**

```ts
import * as z from 'zod';

export const ListingStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'ACTIVE',
  'RESERVED',
  'SOLD',
  'RENTED',
  'ARCHIVED',
]);

export type ListingStatus = z.infer<typeof ListingStatusSchema>;

/** Who is asking for the transition. Admin has moderation-only powers. */
export type ListingRole = 'realtor' | 'admin';

/**
 * The lifecycle table from the design (§7.4) as a pure lookup: status + role in,
 * the statuses that role may move to next out. Two rules live in the service, not
 * here, because they need data this function cannot see:
 *   - a DRAFT→ACTIVE ("publish") request lands on PENDING when the realtor is not
 *     yet trusted — that is why the realtor's only DRAFT move is ['ACTIVE'];
 *   - SOLD/RENTED→ACTIVE is allowed only inside a 48-hour undo window.
 */
export function allowedTransitions(status: ListingStatus, role: ListingRole): ListingStatus[] {
  const realtor: Partial<Record<ListingStatus, ListingStatus[]>> = {
    DRAFT: ['ACTIVE'],
    PENDING: ['DRAFT'],
    ACTIVE: ['RESERVED', 'SOLD', 'RENTED', 'ARCHIVED'],
    RESERVED: ['ACTIVE', 'SOLD', 'RENTED', 'ARCHIVED'],
    SOLD: ['ACTIVE'],
    RENTED: ['ACTIVE'],
    ARCHIVED: ['ACTIVE'],
  };

  const admin: Partial<Record<ListingStatus, ListingStatus[]>> = {
    PENDING: ['ACTIVE', 'DRAFT'],
  };

  const table = role === 'admin' ? admin : realtor;
  return table[status] ?? [];
}
```

- [ ] **Step 4: `index.ts` dan eksport qilish**

`packages/shared/src/index.ts` ga mavjud eksportlar yoniga:

```ts
export * from './listing-status';
```

- [ ] **Step 5: Testni ishga tushirish**

Run: `yarn workspace @rieltor/shared test`
Expected: PASS — yangi va mavjud testlar.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/listing-status.ts packages/shared/src/listing-status.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): add listing status transitions table"
```

---

### Task 3: `@rieltor/shared` — e'lon kirish va publish sxemalari

**Files:**

- Create: `packages/shared/src/listing-input.ts`
- Create: `packages/shared/src/listing-input.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**

- Consumes: `ListingTypeSchema`, `DealSchema` (`./schemas`)
- Produces:
  - `ListingInputSchema` / `type ListingInput` — hamma maydon ixtiyoriy (DRAFT chala saqlanadi)
  - `PublishableListingSchema` / `type PublishableListing` — e'lonning ichki majburiy maydonlari

- [ ] **Step 1: Testni yozish**

`packages/shared/src/listing-input.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ListingInputSchema, PublishableListingSchema } from './listing-input';

describe('ListingInputSchema', () => {
  it('accepts an empty object so a blank draft can be saved', () => {
    expect(ListingInputSchema.parse({})).toEqual({});
  });

  it('accepts a partial draft', () => {
    expect(
      ListingInputSchema.parse({ title: 'Boshlanmagan', district: 'Chilonzor tumani' }),
    ).toEqual({ title: 'Boshlanmagan', district: 'Chilonzor tumani' });
  });

  it('rejects a non-numeric price string', () => {
    expect(() => ListingInputSchema.parse({ priceSom: '12 000' })).toThrow();
  });
});

describe('PublishableListingSchema', () => {
  const valid = {
    title: '3 xonali kvartira Chilonzorda',
    priceSom: '780000000',
    priceUsd: 65000,
    areaM2: 78,
    district: 'Chilonzor tumani',
    type: 'SECONDARY' as const,
    deal: 'SALE' as const,
    rooms: 3,
  };

  it('accepts a complete apartment', () => {
    expect(PublishableListingSchema.parse(valid)).toMatchObject({ title: valid.title });
  });

  it('rejects a title shorter than ten characters', () => {
    expect(() => PublishableListingSchema.parse({ ...valid, title: 'Uy' })).toThrow();
  });

  it('rejects a zero or empty price', () => {
    expect(() => PublishableListingSchema.parse({ ...valid, priceSom: '0' })).toThrow();
    expect(() => PublishableListingSchema.parse({ ...valid, priceSom: '' })).toThrow();
  });

  it('requires rooms for an apartment or house', () => {
    expect(() => PublishableListingSchema.parse({ ...valid, rooms: null })).toThrow();
  });

  it('allows a commercial listing without rooms', () => {
    expect(
      PublishableListingSchema.parse({ ...valid, type: 'COMMERCIAL', rooms: null }),
    ).toMatchObject({ type: 'COMMERCIAL' });
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/shared vitest run src/listing-input.test.ts`
Expected: FAIL — `Failed to resolve import "./listing-input"`.

- [ ] **Step 3: `listing-input.ts` ni yozish**

```ts
import * as z from 'zod';
import { DealSchema, ListingTypeSchema } from './schemas';

/**
 * The editable fields of a listing. Every field is optional so a DRAFT can be
 * saved half-filled; completeness is enforced only at publish (below). priceSom is
 * a string end-to-end — a BigInt need not fit in a number.
 */
export const ListingInputSchema = z.object({
  title: z.string().max(120).optional(),
  priceSom: z.string().regex(/^\d+$/, "Narx faqat raqamlardan iborat bo'lsin").optional(),
  priceUsd: z.number().int().nonnegative().optional(),
  rooms: z.number().int().positive().nullable().optional(),
  areaM2: z.number().positive().optional(),
  floor: z.string().max(20).nullable().optional(),
  district: z.string().max(60).optional(),
  address: z.string().max(200).optional(),
  landmark: z.string().max(120).optional(),
  description: z.string().max(4000).optional(),
  type: ListingTypeSchema.optional(),
  deal: DealSchema.optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

export type ListingInput = z.infer<typeof ListingInputSchema>;

/**
 * The intrinsic fields a listing must carry before it can go live (§7.4). The two
 * cross-entity rules — at least one image, and the realtor's phone — are checked in
 * the service, which can see the image rows and the realtor row. COMMERCIAL premises
 * are not measured in rooms, so rooms is required only for the other three types.
 */
export const PublishableListingSchema = z
  .object({
    title: z.string().min(10, "Sarlavha kamida 10 belgi bo'lsin"),
    priceSom: z.string().regex(/^[1-9]\d*$/, 'Narx kiritilishi kerak'),
    priceUsd: z.number().int().positive(),
    areaM2: z.number().positive(),
    district: z.string().min(1, 'Tuman kiritilishi kerak'),
    type: ListingTypeSchema,
    deal: DealSchema,
    rooms: z.number().int().positive().nullable(),
  })
  .refine((v) => v.type === 'COMMERCIAL' || v.rooms !== null, {
    message: 'Xonalar soni kiritilishi kerak',
    path: ['rooms'],
  });

export type PublishableListing = z.infer<typeof PublishableListingSchema>;
```

- [ ] **Step 4: `index.ts` dan eksport qilish**

`packages/shared/src/index.ts` ga:

```ts
export * from './listing-input';
```

- [ ] **Step 5: Testni ishga tushirish**

Run: `yarn workspace @rieltor/shared test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/listing-input.ts packages/shared/src/listing-input.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): add listing input and publish-validation schemas"
```

---

### Task 4: `RealtorsService.syncAgent` — Realtor→Agent ko'zgusi

**Files:**

- Modify: `apps/api/src/realtors/realtors.service.ts`
- Create: `apps/api/src/realtors/realtors.service.test.ts` (agar mavjud bo'lsa — unga qo'shiladi)
- Modify: `apps/api/src/realtors/realtors.module.ts` (agar `RealtorsService` `exports` da bo'lmasa)

**Interfaces:**

- Consumes: `PrismaService`
- Produces: `RealtorsService.syncAgent(realtorId: string): Promise<string>` — Agent `id` qaytaradi; `updateProfile` endi shuni chaqiradi

- [ ] **Step 1: Testni yozish**

`apps/api/src/realtors/realtors.service.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { RealtorsService } from './realtors.service';

const REALTOR = {
  agentId: null as string | null,
  name: 'Ali Valiyev',
  agency: 'Toshkent Uy',
  photoUrl: 'https://t.me/i/userpic/320/ali.jpg',
  phone: '+998901234567',
  tgUsername: 'ali_rieltor',
};

function fakePrisma(overrides: {
  findUniqueOrThrow?: ReturnType<typeof vi.fn>;
  agentCreate?: ReturnType<typeof vi.fn>;
  agentUpdate?: ReturnType<typeof vi.fn>;
  realtorUpdate?: ReturnType<typeof vi.fn>;
}) {
  return {
    realtor: {
      findUniqueOrThrow: overrides.findUniqueOrThrow ?? vi.fn().mockResolvedValue(REALTOR),
      update: overrides.realtorUpdate ?? vi.fn().mockResolvedValue({ id: 'rlt_1' }),
    },
    agent: {
      create: overrides.agentCreate ?? vi.fn().mockResolvedValue({ id: 'agt_new' }),
      update: overrides.agentUpdate ?? vi.fn().mockResolvedValue({ id: 'agt_old' }),
    },
  } as unknown as PrismaService;
}

describe('RealtorsService.syncAgent', () => {
  it('creates and links an agent on the first call', async () => {
    const agentCreate = vi.fn().mockResolvedValue({ id: 'agt_new' });
    const realtorUpdate = vi.fn().mockResolvedValue({ id: 'rlt_1' });
    const service = new RealtorsService(fakePrisma({ agentCreate, realtorUpdate }));

    await expect(service.syncAgent('rlt_1')).resolves.toBe('agt_new');
    expect(agentCreate).toHaveBeenCalledWith({
      data: {
        name: 'Ali Valiyev',
        agency: 'Toshkent Uy',
        photoUrl: 'https://t.me/i/userpic/320/ali.jpg',
        phone: '+998901234567',
        telegram: 'https://t.me/ali_rieltor',
      },
      select: { id: true },
    });
    expect(realtorUpdate).toHaveBeenCalledWith({
      where: { id: 'rlt_1' },
      data: { agentId: 'agt_new' },
    });
  });

  it('updates the existing agent in place on later calls', async () => {
    const findUniqueOrThrow = vi.fn().mockResolvedValue({ ...REALTOR, agentId: 'agt_old' });
    const agentUpdate = vi.fn().mockResolvedValue({ id: 'agt_old' });
    const agentCreate = vi.fn();
    const service = new RealtorsService(
      fakePrisma({ findUniqueOrThrow, agentUpdate, agentCreate }),
    );

    await expect(service.syncAgent('rlt_1')).resolves.toBe('agt_old');
    expect(agentCreate).not.toHaveBeenCalled();
    expect(agentUpdate).toHaveBeenCalledWith({
      where: { id: 'agt_old' },
      data: expect.objectContaining({ phone: '+998901234567' }),
    });
  });

  it('falls back to empty strings for fields the realtor has not filled in', async () => {
    const findUniqueOrThrow = vi.fn().mockResolvedValue({
      agentId: null,
      name: 'Ali',
      agency: null,
      photoUrl: null,
      phone: null,
      tgUsername: null,
    });
    const agentCreate = vi.fn().mockResolvedValue({ id: 'agt_new' });
    const service = new RealtorsService(fakePrisma({ findUniqueOrThrow, agentCreate }));

    await service.syncAgent('rlt_1');
    expect(agentCreate).toHaveBeenCalledWith({
      data: { name: 'Ali', agency: '', photoUrl: '', phone: '', telegram: '' },
      select: { id: true },
    });
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run src/realtors/realtors.service.test.ts`
Expected: FAIL — `service.syncAgent is not a function`.

- [ ] **Step 3: `syncAgent` ni yozish**

`apps/api/src/realtors/realtors.service.ts` — `RealtorsService` ichiga yangi metod (mavjud `profile`/`updateProfile` tegilmaydi, faqat quyida `updateProfile` ga bitta qator qo'shiladi):

```ts
  /**
   * Mirrors the realtor's own profile into the public Agent row that a listing card
   * renders. Idempotent: the first call creates the Agent and links it via
   * Realtor.agentId; later calls update it in place. Called on profile edits and on
   * every listing creation, so Listing.agentId (NOT NULL) is always ready. Agent's
   * columns are NOT NULL, so fields the realtor has not filled yet fall back to
   * empty strings — invisible in public until publish, which requires a real phone
   * and re-runs this with it.
   */
  async syncAgent(realtorId: string): Promise<string> {
    const realtor = await this.prisma.realtor.findUniqueOrThrow({
      where: { id: realtorId },
      select: { agentId: true, name: true, agency: true, photoUrl: true, phone: true, tgUsername: true },
    });

    const data = {
      name: realtor.name,
      agency: realtor.agency ?? '',
      photoUrl: realtor.photoUrl ?? '',
      phone: realtor.phone ?? '',
      telegram: realtor.tgUsername ? `https://t.me/${realtor.tgUsername}` : '',
    };

    if (realtor.agentId) {
      await this.prisma.agent.update({ where: { id: realtor.agentId }, data });
      return realtor.agentId;
    }

    const agent = await this.prisma.agent.create({ data, select: { id: true } });
    await this.prisma.realtor.update({ where: { id: realtorId }, data: { agentId: agent.id } });
    return agent.id;
  }
```

- [ ] **Step 4: `updateProfile` publish'dan tashqari ko'zguni ham yangilashi**

`updateProfile` ichida, muvaffaqiyatli `this.prisma.realtor.update(...)` dan **keyin**, `return` dan oldin ko'zguni yangilash uchun natijani o'zgaruvchiga oling va `syncAgent` ni chaqiring:

```ts
  async updateProfile(realtorId: string, patch: RealtorProfileUpdate): Promise<RealtorProfile> {
    try {
      const profile = await this.prisma.realtor.update({
        where: { id: realtorId },
        data: patch,
        select: REALTOR_SELECT,
      });
      // Keep the public Agent card in step with the profile the realtor just edited.
      await this.syncAgent(realtorId);
      return profile;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        throw new UnauthorizedException('Sessiya haqiqiy emas');
      }
      throw error;
    }
  }
```

- [ ] **Step 5: `RealtorsModule` `RealtorsService` ni eksport qilishini ta'minlash**

`apps/api/src/realtors/realtors.module.ts` da `exports: [RealtorsService]` borligini tekshiring; bo'lmasa qo'shing (Task 7 da `ListingsModule` shu servisni inject qiladi).

- [ ] **Step 6: Testni ishga tushirish**

Run: `yarn workspace @rieltor/api vitest run src/realtors`
Expected: PASS — 3 ta yangi holat va mavjud `me` testlari (agar bor bo'lsa) yashil.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/realtors
git commit -m "feat(realtors): mirror the profile into a public Agent row"
```

---

### Task 5: `ListingsWriteService` — DRAFT yaratish va tahrirlash

**Files:**

- Create: `apps/api/src/listings/listings-write.service.ts`
- Create: `apps/api/src/listings/listings-write.service.test.ts`

**Interfaces:**

- Consumes: `ListingInput` (Task 3); `PrismaService`; `RealtorsService.syncAgent` (Task 4)
- Produces:
  - `ListingsWriteService.createDraft(realtorId: string, input: ListingInput): Promise<{ id: string }>`
  - `ListingsWriteService.update(realtorId: string, id: string, input: ListingInput): Promise<{ id: string }>`
  - `ListingsWriteService.assertOwner(realtorId: string, id: string): Promise<void>`

- [ ] **Step 1: Testni yozish**

`apps/api/src/listings/listings-write.service.test.ts`:

```ts
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import type { RealtorsService } from '../realtors/realtors.service';
import { ListingsWriteService } from './listings-write.service';

function make(overrides: {
  create?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
  findUnique?: ReturnType<typeof vi.fn>;
  syncAgent?: ReturnType<typeof vi.fn>;
}) {
  const prisma = {
    listing: {
      create: overrides.create ?? vi.fn().mockResolvedValue({ id: 'lst_new' }),
      update: overrides.update ?? vi.fn().mockResolvedValue({ id: 'lst_1' }),
      findUnique: overrides.findUnique ?? vi.fn().mockResolvedValue({ realtorId: 'rlt_1' }),
    },
  } as unknown as PrismaService;
  const realtors = {
    syncAgent: overrides.syncAgent ?? vi.fn().mockResolvedValue('agt_1'),
  } as unknown as RealtorsService;
  return { service: new ListingsWriteService(prisma, realtors), prisma, realtors };
}

describe('ListingsWriteService.createDraft', () => {
  it('creates a DRAFT owned by the realtor with an agent id and merged defaults', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'lst_new' });
    const syncAgent = vi.fn().mockResolvedValue('agt_1');
    const { service } = make({ create, syncAgent });

    await expect(
      service.createDraft('rlt_1', { title: 'Yangi', priceSom: '500000000' }),
    ).resolves.toEqual({ id: 'lst_new' });

    expect(syncAgent).toHaveBeenCalledWith('rlt_1');
    const data = create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      status: 'DRAFT',
      realtorId: 'rlt_1',
      agentId: 'agt_1',
      title: 'Yangi',
      priceSom: BigInt(500000000),
      // an unsent field keeps its empty-string default so the NOT NULL column holds
      description: '',
    });
  });
});

describe('ListingsWriteService.update', () => {
  it('writes only the fields the request sent', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'lst_1' });
    const findUnique = vi.fn().mockResolvedValue({ realtorId: 'rlt_1' });
    const { service } = make({ update, findUnique });

    await service.update('rlt_1', 'lst_1', { district: 'Yunusobod tumani' });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'lst_1' },
      data: { district: 'Yunusobod tumani' },
    });
  });

  it('refuses a listing owned by someone else', async () => {
    const findUnique = vi.fn().mockResolvedValue({ realtorId: 'rlt_other' });
    const { service } = make({ findUnique });
    await expect(service.update('rlt_1', 'lst_1', {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('reports a missing listing as not found', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const { service } = make({ findUnique });
    await expect(service.update('rlt_1', 'lst_x', {})).rejects.toBeInstanceOf(NotFoundException);
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run src/listings/listings-write.service.test.ts`
Expected: FAIL — `Failed to resolve import "./listings-write.service"`.

- [ ] **Step 3: `listings-write.service.ts` ni yozish**

```ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ListingInput } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RealtorsService } from '../realtors/realtors.service';

/**
 * The listing columns are NOT NULL with no database default, but a DRAFT is saved
 * half-filled. A new row therefore starts from these empty placeholders and the
 * realtor fills them in with later PATCHes; publish-validation guarantees real
 * values before the listing is ever public. `type` has no enum default, so a DRAFT
 * starts SECONDARY — the realtor changes it in the form.
 */
const DRAFT_DEFAULTS = {
  title: '',
  priceSom: BigInt(0),
  priceUsd: 0,
  areaM2: 0,
  district: '',
  address: '',
  landmark: '',
  description: '',
  type: 'SECONDARY',
} as const;

@Injectable()
export class ListingsWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtors: RealtorsService,
  ) {}

  /**
   * A new listing starts as a DRAFT owned by the realtor. syncAgent runs first
   * because Listing.agentId is NOT NULL — the Agent mirror must exist before the row
   * is created. The id is a cuid, so it never collides with the seed's "bx-001".
   */
  async createDraft(realtorId: string, input: ListingInput): Promise<{ id: string }> {
    const agentId = await this.realtors.syncAgent(realtorId);
    return this.prisma.listing.create({
      data: {
        ...DRAFT_DEFAULTS,
        ...this.toData(input),
        status: 'DRAFT',
        realtorId,
        agentId,
        listedAt: new Date(),
      },
      select: { id: true },
    });
  }

  async update(realtorId: string, id: string, input: ListingInput): Promise<{ id: string }> {
    await this.assertOwner(realtorId, id);
    await this.prisma.listing.update({ where: { id }, data: this.toData(input) });
    return { id };
  }

  /** 404 if the listing is missing, 403 if it belongs to another realtor. */
  async assertOwner(realtorId: string, id: string): Promise<void> {
    const row = await this.prisma.listing.findUnique({
      where: { id },
      select: { realtorId: true },
    });
    if (!row) throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    if (row.realtorId !== realtorId) throw new ForbiddenException('Bu obyekt sizga tegishli emas');
  }

  /**
   * Maps the shared input onto Prisma columns. Only keys the request actually sent
   * are written, so a one-field edit cannot blank the rest; priceSom — a string on
   * the wire — becomes a BigInt for the column.
   */
  private toData(input: ListingInput): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      data[key] = key === 'priceSom' ? BigInt(value as string) : value;
    }
    return data;
  }
}
```

- [ ] **Step 4: Testni ishga tushirish**

Run: `yarn workspace @rieltor/api vitest run src/listings/listings-write.service.test.ts`
Expected: PASS — 4 ta holat.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/listings/listings-write.service.ts apps/api/src/listings/listings-write.service.test.ts
git commit -m "feat(listings): create and edit draft listings"
```

---

### Task 6: `ListingsWriteService.changeStatus` — hayot sikli va publish

**Files:**

- Modify: `apps/api/src/listings/listings-write.service.ts`
- Modify: `apps/api/src/listings/listings-write.service.test.ts`

**Interfaces:**

- Consumes: `allowedTransitions`, `PublishableListingSchema`, `ListingStatus` (Tasks 2, 3); `RealtorsService.syncAgent` (Task 4)
- Produces: `ListingsWriteService.changeStatus(realtorId, id, to: ListingStatus, now?: Date): Promise<{ status: ListingStatus }>`

- [ ] **Step 1: Testni yozish (mavjud test fayliga qo'shiladi)**

`apps/api/src/listings/listings-write.service.test.ts` oxiriga:

```ts
import { ForbiddenException as _Forbidden } from '@nestjs/common'; // (allaqachon import qilingan bo'lsa qayta qo'shilmaydi)

const PUBLISHABLE = {
  realtorId: 'rlt_1',
  status: 'DRAFT' as const,
  soldAt: null as Date | null,
  title: '3 xonali kvartira Chilonzorda',
  priceSom: BigInt(780000000),
  priceUsd: 65000,
  areaM2: 78,
  district: 'Chilonzor tumani',
  type: 'SECONDARY',
  deal: 'SALE',
  rooms: 3,
  _count: { images: 2 },
};

const NOW = new Date('2026-08-12T10:00:00Z');
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function makeStatus(
  row: Record<string, unknown> | null,
  realtor: { phone: string | null; trusted: boolean } = { phone: '+998901234567', trusted: true },
) {
  const update = vi.fn().mockResolvedValue({});
  const prisma = {
    listing: { findUnique: vi.fn().mockResolvedValue(row), update },
    realtor: { findUniqueOrThrow: vi.fn().mockResolvedValue(realtor) },
  } as unknown as PrismaService;
  const syncAgent = vi.fn().mockResolvedValue('agt_1');
  const service = new ListingsWriteService(prisma, { syncAgent } as unknown as RealtorsService);
  return { service, update, syncAgent };
}

describe('ListingsWriteService.changeStatus — publish', () => {
  it('publishes a complete listing by a trusted realtor to ACTIVE', async () => {
    const { service, update, syncAgent } = makeStatus(PUBLISHABLE, {
      phone: '+998901234567',
      trusted: true,
    });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW)).resolves.toEqual({
      status: 'ACTIVE',
    });
    expect(syncAgent).toHaveBeenCalledWith('rlt_1');
    expect(update).toHaveBeenCalledWith({
      where: { id: 'lst_1' },
      data: { status: 'ACTIVE', publishedAt: NOW, expiresAt: new Date(NOW.getTime() + TTL_MS) },
    });
  });

  it('sends an untrusted realtor to PENDING with no publish date', async () => {
    const { service, update } = makeStatus(PUBLISHABLE, { phone: '+998901234567', trusted: false });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW)).resolves.toEqual({
      status: 'PENDING',
    });
    expect(update).toHaveBeenCalledWith({ where: { id: 'lst_1' }, data: { status: 'PENDING' } });
  });

  it('refuses to publish without an image', async () => {
    const { service } = makeStatus({ ...PUBLISHABLE, _count: { images: 0 } });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW)).rejects.toThrow(/rasm/i);
  });

  it('refuses to publish without a phone on the profile', async () => {
    const { service } = makeStatus(PUBLISHABLE, { phone: null, trusted: true });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW)).rejects.toThrow(/telefon/i);
  });

  it('refuses to publish a listing with a too-short title', async () => {
    const { service } = makeStatus({ ...PUBLISHABLE, title: 'Uy' });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW)).rejects.toThrow();
  });
});

describe('ListingsWriteService.changeStatus — lifecycle', () => {
  it('marks an active listing sold and stamps soldAt', async () => {
    const { service, update } = makeStatus({ ...PUBLISHABLE, status: 'ACTIVE' });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'SOLD', NOW)).resolves.toEqual({
      status: 'SOLD',
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'lst_1' },
      data: { status: 'SOLD', soldAt: NOW },
    });
  });

  it('reactivates a sold listing inside the 48h window and clears soldAt', async () => {
    const soldAt = new Date(NOW.getTime() - 60 * 60 * 1000);
    const { service, update } = makeStatus({ ...PUBLISHABLE, status: 'SOLD', soldAt });
    await service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'lst_1' },
      data: { status: 'ACTIVE', soldAt: null },
    });
  });

  it('refuses to reactivate a sold listing after the window', async () => {
    const soldAt = new Date(NOW.getTime() - 49 * 60 * 60 * 1000);
    const { service } = makeStatus({ ...PUBLISHABLE, status: 'SOLD', soldAt });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW)).rejects.toThrow(/muddat/i);
  });

  it('rejects a transition not in the table', async () => {
    const { service } = makeStatus({ ...PUBLISHABLE, status: 'ACTIVE' });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'DRAFT', NOW)).rejects.toThrow();
  });

  it('refuses a listing owned by someone else', async () => {
    const { service } = makeStatus({ ...PUBLISHABLE, realtorId: 'rlt_other', status: 'ACTIVE' });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'RESERVED', NOW)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
```

> Eslatma: `import { ForbiddenException as _Forbidden }` qatori faqat eslatma — agar `ForbiddenException` fayl boshida allaqachon import qilingan bo'lsa (Task 5), uni qayta import qilmang; bu satrni tashlab yuboring.

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run src/listings/listings-write.service.test.ts`
Expected: FAIL — `service.changeStatus is not a function`.

- [ ] **Step 3: `changeStatus` ni yozish**

`listings-write.service.ts` fayl boshidagi importni kengaytiring va konstantalar + metodlarni qo'shing:

```ts
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  allowedTransitions,
  PublishableListingSchema,
  type ListingInput,
  type ListingStatus,
} from '@rieltor/shared';
```

Konstantalar (fayl yuqorisiga, `DRAFT_DEFAULTS` yoniga):

```ts
/** 48 hours: the window in which a mistaken SOLD/RENTED can be undone. */
const UNDO_WINDOW_MS = 48 * 60 * 60 * 1000;
/** A published listing lives 30 days before the stage-4 cron may archive it. */
const LISTING_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Everything publish-validation and the transition rules need in one read. */
const STATUS_CHANGE_SELECT = {
  realtorId: true,
  status: true,
  soldAt: true,
  title: true,
  priceSom: true,
  priceUsd: true,
  areaM2: true,
  district: true,
  type: true,
  deal: true,
  rooms: true,
  _count: { select: { images: true } },
} as const;
```

`ListingsWriteService` ichiga (metodlar):

```ts
  /**
   * Applies a realtor status transition, enforcing the §7.4 table plus the two rules
   * that need runtime data: publish-validation on DRAFT→ACTIVE, and the 48-hour undo
   * window on SOLD/RENTED→ACTIVE. `now` is injectable so a test can pin the clock.
   */
  async changeStatus(
    realtorId: string,
    id: string,
    to: ListingStatus,
    now: Date = new Date(),
  ): Promise<{ status: ListingStatus }> {
    const row = await this.prisma.listing.findUnique({
      where: { id },
      select: STATUS_CHANGE_SELECT,
    });
    if (!row) throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    if (row.realtorId !== realtorId) throw new ForbiddenException('Bu obyekt sizga tegishli emas');

    // Publish is the one transition with validation and a trusted-based target.
    if (row.status === 'DRAFT' && to === 'ACTIVE') {
      return this.publish(realtorId, id, row, now);
    }

    if (!allowedTransitions(row.status, 'realtor').includes(to)) {
      throw new ConflictException(`Holatni ${row.status} dan ${to} ga o'zgartirib bo'lmaydi`);
    }

    const reactivatingSold =
      (row.status === 'SOLD' || row.status === 'RENTED') && to === 'ACTIVE';
    if (
      reactivatingSold &&
      (!row.soldAt || now.getTime() - row.soldAt.getTime() > UNDO_WINDOW_MS)
    ) {
      throw new ConflictException("Qaytarish muddati (48 soat) o'tib ketgan");
    }

    const data: {
      status: ListingStatus;
      soldAt?: Date | null;
      publishedAt?: Date;
      expiresAt?: Date;
    } = { status: to };
    if (to === 'SOLD' || to === 'RENTED') data.soldAt = now;
    if (reactivatingSold) data.soldAt = null;
    if (to === 'ACTIVE' && row.status === 'ARCHIVED') {
      data.publishedAt = now;
      data.expiresAt = new Date(now.getTime() + LISTING_TTL_MS);
    }

    await this.prisma.listing.update({ where: { id }, data });
    return { status: to };
  }

  /** DRAFT → live: full validation, then ACTIVE (trusted) or PENDING (needs review). */
  private async publish(
    realtorId: string,
    id: string,
    row: {
      title: string;
      priceSom: bigint;
      priceUsd: number;
      areaM2: number;
      district: string;
      type: string;
      deal: string;
      rooms: number | null;
      _count: { images: number };
    },
    now: Date,
  ): Promise<{ status: ListingStatus }> {
    const parsed = PublishableListingSchema.safeParse({
      title: row.title,
      priceSom: row.priceSom.toString(),
      priceUsd: row.priceUsd,
      areaM2: row.areaM2,
      district: row.district,
      type: row.type,
      deal: row.deal,
      rooms: row.rooms,
    });
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.issues[0]?.message ?? "E'lon to'liq emas");
    }
    if (row._count.images < 1) {
      throw new UnprocessableEntityException('Kamida bitta rasm kerak');
    }

    const realtor = await this.prisma.realtor.findUniqueOrThrow({
      where: { id: realtorId },
      select: { phone: true, trusted: true },
    });
    if (!realtor.phone) {
      throw new UnprocessableEntityException('Profilda telefon raqami kiritilishi kerak');
    }

    // Refresh the public Agent card with the now-guaranteed phone.
    await this.realtors.syncAgent(realtorId);

    const status: ListingStatus = realtor.trusted ? 'ACTIVE' : 'PENDING';
    await this.prisma.listing.update({
      where: { id },
      data:
        status === 'ACTIVE'
          ? { status, publishedAt: now, expiresAt: new Date(now.getTime() + LISTING_TTL_MS) }
          : { status },
    });
    return { status };
  }
```

- [ ] **Step 4: Testni ishga tushirish**

Run: `yarn workspace @rieltor/api vitest run src/listings/listings-write.service.test.ts`
Expected: PASS — barcha yangi va Task 5 holatlari.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/listings/listings-write.service.ts apps/api/src/listings/listings-write.service.test.ts
git commit -m "feat(listings): enforce the status machine and publish validation"
```

---

### Task 7: Yozuv kontrolleri, modul ulanishi va e2e

**Files:**

- Modify: `apps/api/src/listings/listings.dto.ts`
- Create: `apps/api/src/listings/listings-write.controller.ts`
- Modify: `apps/api/src/listings/listings.module.ts`
- Create: `apps/api/test/listings-write.e2e-spec.ts`

**Interfaces:**

- Consumes: `ListingsWriteService` (Tasks 5, 6); `RealtorGuard`, `CurrentRealtor` (mavjud auth); `ListingInputSchema`, `ListingStatusSchema` (Tasks 2, 3)
- Produces: `POST /api/objects`, `PATCH /api/objects/:id`, `POST /api/objects/:id/status` (barchasi `RealtorGuard` ortida)

- [ ] **Step 1: DTO'larni qo'shish**

`apps/api/src/listings/listings.dto.ts` — mavjud eksportlar yoniga:

```ts
import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';
import {
  ListingDetailSchema,
  ListingInputSchema,
  ListingStatusSchema,
  ListingSummarySchema,
} from '@rieltor/shared';

export class ListingDetailDto extends createZodDto(ListingDetailSchema) {}
export class ListingSummaryDto extends createZodDto(ListingSummarySchema) {}
export class ListingInputDto extends createZodDto(ListingInputSchema) {}

/** Body of POST /api/objects/:id/status. */
export const ListingStatusChangeSchema = z.object({ to: ListingStatusSchema });
export class ListingStatusChangeDto extends createZodDto(ListingStatusChangeSchema) {}
```

- [ ] **Step 2: e2e testni yozish**

`apps/api/test/listings-write.e2e-spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { configureApp } from '../src/bootstrap';

const DEV_SECRET = 'e2e-dev-login-secret';
const TG_ID = 880011;

describe('Listings write (e2e)', () => {
  let app: NestExpressApplication;
  let cookie: string;
  let realtorId: string;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:E2E-BOT';
    process.env.JWT_SECRET = 'e2e-jwt-secret-at-least-16';
    process.env.DEV_LOGIN_SECRET = DEV_SECRET;

    // Imported after the env is set: app.module.ts decides at import time whether the
    // dev-login module is registered.
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/auth/dev')
      .send({ secret: DEV_SECRET, tgId: TG_ID, name: 'E2E Rieltor' })
      .expect(201);
    cookie = login.headers['set-cookie'][0];

    const me = await request(app.getHttpServer()).get('/api/me').set('cookie', cookie).expect(200);
    realtorId = me.body.id;
  });

  afterAll(async () => {
    await prisma.listing.deleteMany({ where: { realtorId } });
    await prisma.realtor.deleteMany({ where: { tgId: BigInt(TG_ID) } });
    await prisma.$disconnect();
    await app.close();
  });

  it('creates a draft and then updates it', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/objects')
      .set('cookie', cookie)
      .send({ title: 'Boshlang‘ich' })
      .expect(201);
    expect(created.body.id).toBeTruthy();

    await request(app.getHttpServer())
      .patch(`/api/objects/${created.body.id}`)
      .set('cookie', cookie)
      .send({ district: 'Chilonzor tumani' })
      .expect(200);
  });

  it('rejects an anonymous create', async () => {
    await request(app.getHttpServer()).post('/api/objects').send({ title: 'X' }).expect(401);
  });

  it('refuses to publish an incomplete draft', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/objects')
      .set('cookie', cookie)
      .send({ title: 'Qisqa e‘lon' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/objects/${created.body.id}/status`)
      .set('cookie', cookie)
      .send({ to: 'ACTIVE' })
      .expect(422);
  });

  it('publishes a complete draft once an image and phone exist', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/objects')
      .set('cookie', cookie)
      .send({
        title: '3 xonali kvartira Chilonzorda',
        priceSom: '780000000',
        priceUsd: 65000,
        areaM2: 78,
        district: 'Chilonzor tumani',
        type: 'SECONDARY',
        deal: 'SALE',
        rooms: 3,
      })
      .expect(201);
    const id = created.body.id;

    // Publish needs an image row and a profile phone; a trusted realtor lands ACTIVE.
    await prisma.image.create({
      data: {
        listingId: id,
        base: `/images/${id}/01`,
        ogUrl: null,
        width: 1200,
        height: 800,
        position: 1,
      },
    });
    await prisma.realtor.update({
      where: { id: realtorId },
      data: { phone: '+998901234567', trusted: true },
    });

    const published = await request(app.getHttpServer())
      .post(`/api/objects/${id}/status`)
      .set('cookie', cookie)
      .send({ to: 'ACTIVE' })
      .expect(201);
    expect(published.body.status).toBe('ACTIVE');
  });
});
```

- [ ] **Step 3: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run --config vitest.config.e2e.ts test/listings-write.e2e-spec.ts`
Expected: FAIL — `POST /api/objects` 404 (kontroller hali yo'q).

- [ ] **Step 4: Kontrollerni yozish**

`apps/api/src/listings/listings-write.controller.ts`:

```ts
import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentRealtor } from '../auth/current-realtor.decorator';
import { RealtorGuard } from '../auth/realtor.guard';
import { ListingInputDto, ListingStatusChangeDto } from './listings.dto';
import { ListingsWriteService } from './listings-write.service';

// Same 'objects' prefix as the public read controller — the methods do not collide
// (GET vs POST/PATCH), and every write route sits behind RealtorGuard.
@ApiTags('objects')
@Controller('objects')
@UseGuards(RealtorGuard)
@ApiUnauthorizedResponse({ description: 'Sessiya topilmadi' })
export class ListingsWriteController {
  constructor(private readonly write: ListingsWriteService) {}

  @Post()
  @ApiCreatedResponse({ description: "Yangi DRAFT e'lon yaratildi" })
  create(@CurrentRealtor() realtorId: string, @Body() body: ListingInputDto) {
    return this.write.createDraft(realtorId, body);
  }

  @Patch(':id')
  update(
    @CurrentRealtor() realtorId: string,
    @Param('id') id: string,
    @Body() body: ListingInputDto,
  ) {
    return this.write.update(realtorId, id, body);
  }

  @Post(':id/status')
  changeStatus(
    @CurrentRealtor() realtorId: string,
    @Param('id') id: string,
    @Body() body: ListingStatusChangeDto,
  ) {
    return this.write.changeStatus(realtorId, id, body.to);
  }
}
```

- [ ] **Step 5: Modulni ulash**

`apps/api/src/listings/listings.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { RealtorsModule } from '../realtors/realtors.module';
import { ListingsController } from './listings.controller';
import { ListingsWriteController } from './listings-write.controller';
import { ListingsService } from './listings.service';
import { ListingsWriteService } from './listings-write.service';

@Module({
  imports: [RealtorsModule],
  controllers: [ListingsController, ListingsWriteController],
  providers: [ListingsService, ListingsWriteService],
  exports: [ListingsService],
})
export class ListingsModule {}
```

- [ ] **Step 6: e2e va butun paket testini ishga tushirish**

Run:

```bash
yarn workspace @rieltor/api vitest run --config vitest.config.e2e.ts test/listings-write.e2e-spec.ts
yarn workspace @rieltor/api test
```

Expected: PASS — 4 ta e2e holat va mavjud testlar yashil.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/listings/listings.dto.ts apps/api/src/listings/listings-write.controller.ts apps/api/src/listings/listings.module.ts apps/api/test/listings-write.e2e-spec.ts
git commit -m "feat(listings): expose realtor create, edit and status endpoints"
```

---

### Task 8: Commit ko'rinish qoidalari va egaga o'qish endpointlari

**Files:**

- Modify: `packages/shared/src/schemas.ts`
- Modify: `packages/shared/src/index.ts` (agar kerak bo'lsa — `schemas` allaqachon eksport qilingan)
- Modify: `apps/api/src/listings/listings.service.ts`
- Create: `apps/api/src/listings/owner-mapper.ts`
- Create: `apps/api/src/listings/my-listings.controller.ts`
- Modify: `apps/api/src/listings/listings.dto.ts`
- Modify: `apps/api/src/listings/listings.module.ts`
- Create: `apps/api/test/listing-visibility.e2e-spec.ts`

**Interfaces:**

- Consumes: `ListingStatusSchema` (Task 2); `toListingSummary`, `toListingDetail`, `ListingRow` (mavjud `mapper.ts`); `RealtorGuard`, `CurrentRealtor`
- Produces:
  - `ListingsService.findAll` endi faqat `ACTIVE`/`RESERVED`; `findOne` `DRAFT`/`PENDING`/`ARCHIVED` uchun 404
  - `ListingsService.findOwn(realtorId)`, `findOwnOne(realtorId, id)`
  - `OwnerListingSummarySchema`, `OwnerListingDetailSchema`
  - `GET /api/me/objects`, `GET /api/me/objects/:id`

- [ ] **Step 1: Owner sxemalarini qo'shish**

`packages/shared/src/schemas.ts` — `ListingDetailSchema` dan keyin (fayl boshiga `import { ListingStatusSchema } from './listing-status';` qo'shiladi):

```ts
/** The card the realtor sees in their own cabinet — the public summary plus status. */
export const OwnerListingSummarySchema = ListingSummarySchema.extend({
  status: ListingStatusSchema,
});

/** The listing the realtor edits — the public detail plus status. */
export const OwnerListingDetailSchema = ListingDetailSchema.extend({
  status: ListingStatusSchema,
});

export type OwnerListingSummary = z.infer<typeof OwnerListingSummarySchema>;
export type OwnerListingDetail = z.infer<typeof OwnerListingDetailSchema>;
```

- [ ] **Step 2: Ko'rinish e2e testini yozish**

`apps/api/test/listing-visibility.e2e-spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { configureApp } from '../src/bootstrap';

const DEV_SECRET = 'e2e-dev-login-secret';
const TG_ID = 880022;

describe('Listing visibility (e2e)', () => {
  let app: NestExpressApplication;
  let cookie: string;
  let realtorId: string;
  let draftId: string;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:E2E-BOT';
    process.env.JWT_SECRET = 'e2e-jwt-secret-at-least-16';
    process.env.DEV_LOGIN_SECRET = DEV_SECRET;

    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/auth/dev')
      .send({ secret: DEV_SECRET, tgId: TG_ID, name: 'E2E Ko‘rinish' })
      .expect(201);
    cookie = login.headers['set-cookie'][0];
    const me = await request(app.getHttpServer()).get('/api/me').set('cookie', cookie).expect(200);
    realtorId = me.body.id;

    const created = await request(app.getHttpServer())
      .post('/api/objects')
      .set('cookie', cookie)
      .send({ title: 'Faqat qoralama' })
      .expect(201);
    draftId = created.body.id;
  });

  afterAll(async () => {
    await prisma.listing.deleteMany({ where: { realtorId } });
    await prisma.realtor.deleteMany({ where: { tgId: BigInt(TG_ID) } });
    await prisma.$disconnect();
    await app.close();
  });

  it('keeps the seed listings on the public feed', async () => {
    const res = await request(app.getHttpServer()).get('/api/objects').expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.some((l: { id: string }) => l.id === 'bx-001')).toBe(true);
    // The draft just created must not leak into the public feed.
    expect(res.body.some((l: { id: string }) => l.id === draftId)).toBe(false);
  });

  it('serves a seed listing detail but 404s a draft for the public', async () => {
    await request(app.getHttpServer()).get('/api/objects/bx-001').expect(200);
    await request(app.getHttpServer()).get(`/api/objects/${draftId}`).expect(404);
  });

  it('shows the realtor their own draft with its status', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/me/objects')
      .set('cookie', cookie)
      .expect(200);
    const mine = list.body.find((l: { id: string }) => l.id === draftId);
    expect(mine.status).toBe('DRAFT');

    const one = await request(app.getHttpServer())
      .get(`/api/me/objects/${draftId}`)
      .set('cookie', cookie)
      .expect(200);
    expect(one.body.status).toBe('DRAFT');
  });
});
```

- [ ] **Step 3: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run --config vitest.config.e2e.ts test/listing-visibility.e2e-spec.ts`
Expected: FAIL — draft `GET /api/objects/:id` 200 qaytaradi (hali filtr yo'q) va `/api/me/objects` 404.

- [ ] **Step 4: `owner-mapper.ts` ni yozish**

`apps/api/src/listings/owner-mapper.ts`:

```ts
import type { OwnerListingDetail, OwnerListingSummary } from '@rieltor/shared';
import { toListingDetail, toListingSummary, type ListingRow } from './mapper';

// ListingRow's Listing already carries `status` (added in Task 1), so the owner
// mappers are just the public mappers with that one extra field.
export function toOwnerListingSummary(row: ListingRow): OwnerListingSummary {
  return { ...toListingSummary(row), status: row.status };
}

export function toOwnerListingDetail(row: ListingRow): OwnerListingDetail {
  return { ...toListingDetail(row), status: row.status };
}
```

- [ ] **Step 5: `ListingsService` ga filtr va egaga o'qishni qo'shish**

`apps/api/src/listings/listings.service.ts` ni yangilang (import va metodlar):

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ListingDetail,
  ListingStatus,
  ListingSummary,
  OwnerListingDetail,
  OwnerListingSummary,
} from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toListingDetail, toListingSummary } from './mapper';
import { toOwnerListingDetail, toOwnerListingSummary } from './owner-mapper';

const FULL_INCLUDE = { agent: true, images: { orderBy: { position: 'asc' } } } as const;

/** A listing detail page stays open for these — SOLD/RENTED are kept as a trust signal. */
const PUBLIC_DETAIL_STATUSES: ListingStatus[] = ['ACTIVE', 'RESERVED', 'SOLD', 'RENTED'];

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ListingSummary[]> {
    const rows = await this.prisma.listing.findMany({
      where: { status: { in: ['ACTIVE', 'RESERVED'] } },
      include: FULL_INCLUDE,
      orderBy: { id: 'asc' },
    });
    return rows.map(toListingSummary);
  }

  async findOne(id: string): Promise<ListingDetail> {
    const row = await this.prisma.listing.findUnique({ where: { id }, include: FULL_INCLUDE });
    if (!row || !PUBLIC_DETAIL_STATUSES.includes(row.status)) {
      throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    }
    return toListingDetail(row);
  }

  async findOwn(realtorId: string): Promise<OwnerListingSummary[]> {
    const rows = await this.prisma.listing.findMany({
      where: { realtorId },
      include: FULL_INCLUDE,
      orderBy: { id: 'desc' },
    });
    return rows.map(toOwnerListingSummary);
  }

  async findOwnOne(realtorId: string, id: string): Promise<OwnerListingDetail> {
    const row = await this.prisma.listing.findUnique({ where: { id }, include: FULL_INCLUDE });
    if (!row || row.realtorId !== realtorId) {
      throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    }
    return toOwnerListingDetail(row);
  }
}
```

- [ ] **Step 6: Owner DTO'lari va `MyListingsController`**

`apps/api/src/listings/listings.dto.ts` ga qo'shing:

```ts
import { OwnerListingDetailSchema, OwnerListingSummarySchema } from '@rieltor/shared';

export class OwnerListingSummaryDto extends createZodDto(OwnerListingSummarySchema) {}
export class OwnerListingDetailDto extends createZodDto(OwnerListingDetailSchema) {}
```

`apps/api/src/listings/my-listings.controller.ts`:

```ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentRealtor } from '../auth/current-realtor.decorator';
import { RealtorGuard } from '../auth/realtor.guard';
import { OwnerListingDetailDto, OwnerListingSummaryDto } from './listings.dto';
import { ListingsService } from './listings.service';

@ApiTags('me')
@Controller('me/objects')
@UseGuards(RealtorGuard)
@ApiUnauthorizedResponse({ description: 'Sessiya topilmadi' })
export class MyListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  @ApiOkResponse({ type: [OwnerListingSummaryDto] })
  findOwn(@CurrentRealtor() realtorId: string) {
    return this.listings.findOwn(realtorId);
  }

  @Get(':id')
  @ApiOkResponse({ type: OwnerListingDetailDto })
  findOwnOne(@CurrentRealtor() realtorId: string, @Param('id') id: string) {
    return this.listings.findOwnOne(realtorId, id);
  }
}
```

`apps/api/src/listings/listings.module.ts` — `controllers` ro'yxatiga `MyListingsController` qo'shiladi:

```ts
  controllers: [ListingsController, ListingsWriteController, MyListingsController],
```

(import qatorini ham qo'shing.)

- [ ] **Step 7: Barcha testlarni ishga tushirish**

Run:

```bash
yarn workspace @rieltor/shared test
yarn workspace @rieltor/api vitest run --config vitest.config.e2e.ts test/listing-visibility.e2e-spec.ts
yarn workspace @rieltor/api test
yarn typecheck
```

Expected: hammasi PASS — ko'rinish e2e (3 holat), mavjud e2e (seed lentada), owner endpointlari.

- [ ] **Step 8: Commit**

```bash
git add packages/shared/src/schemas.ts apps/api/src/listings docs/project-overview.md apps/api/test/listing-visibility.e2e-spec.ts
git commit -m "feat(listings): apply public visibility rules and owner reads"
```

---

## Self-review (skill talab qiladi)

- **Spec coverage.** §5.1 ko'zgu → Task 4; §5.2 Prisma (2a qismi: status/realtorId/lifecycle) → Task 1; §5.3 ko'rinish qoidalari → Task 8; §7.4 status jadvali + publish-validatsiya → Tasks 2, 3, 6; CRUD endpointlari → Tasks 5, 7. `PriceHistory`, `ShareLink`, `Event`, `Lead`, `FxRate` **ataylab tashqarida** — ular 3–5-bosqichlarники. Rasm yuklash → 2b. Kabinet formasi → 2c.
- **Placeholder scan.** Har qadamda haqiqiy kod bor; "TODO"/"shунga o'xshash"/"error handling qo'sh" yo'q.
- **Type consistency.** `allowedTransitions`, `PublishableListingSchema`, `ListingInput`, `syncAgent(): Promise<string>`, `ListingsWriteService(prisma, realtors)`, `changeStatus(...): Promise<{status}>`, `OwnerListing*Schema`, `toOwnerListing*` — nomlar tasklar bo'ylab bir xil. Narx: kirshda `string`, DB'da `BigInt`, publish-parse'da `.toString()`.

## Keyingi kichik rejalar (shu bosqichdan keyin)

- **2b — Media:** `renderImageVariants` (`src/media/variants.ts`) refaktoringi + `prisma/images.ts` yupqa qobiq (mavjud `images.test.ts` yashil qoladi), `MediaStorage` interfeysi + `LocalDiskStorage`, `POST /api/objects/:id/images` (multipart, ≤12, 4MB→413, birinchi rasmga `og.jpg`) + o'chirish, `Image.phash` ustuni, env: `R2_*`/`MEDIA_PUBLIC_URL` (ixtiyoriy).
- **2c — Frontend:** `features/listing-form` (6 majburiy maydon + DRAFT saqlash + rasm yuklash UI), `/cabinet` da "mening e'lonlarim" ro'yxati, `/cabinet/new`, `/cabinet/obj/:id/edit` marshrutlari (SSR `noindex`), `shared/api/client.ts` da multipart yuklash.

---

**Reja tayyor va saqlandi:** `docs/superpowers/plans/2026-08-12-stage-2a-listing-crud.md`. Ikkita bajarish varianti:

**1. Subagent-Driven (tavsiya etiladi)** — har taskка yangi subagent, tasklar orasida ko'rib chiqaman, tez iteratsiya.

**2. Inline Execution** — shu sessiyada tasklarni bajaraman, tekshiruv nuqtalari bilan.

Qaysi biri?
