# 1-bosqich: Auth va profil — implementatsiya rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rieltor Telegram orqali kirib, profilini to'ldirib, kabinetini ko'ra oladi — e'lon joylash 2-bosqichga tayyor holatda.

**Architecture:** NestJS tomonida yangi `auth`, `auth-dev`, `realtors` modullari; sessiya — `node:crypto` bilan imzolangan HS256 token `httpOnly` cookie'da. Frontendda FSD bo'yicha yangi `features/auth` va `pages/cabinet` slice'lari. Mavjud ommaviy sayt, endpointlar va testlarga tegilmaydi — barcha yangi env o'zgaruvchilari ixtiyoriy, ular berilmasa ilova bugungidek ishlaydi.

**Tech Stack:** NestJS 11 · Prisma 6 · PostgreSQL 16 · Zod 4 (`@rieltor/shared`) · nestjs-zod · React 19 · React Router 7 · TanStack Query 5 · Tailwind v4 · Vitest · Playwright

**Manba spec:** [2026-08-09-listing-publishing-design.md](../specs/2026-08-09-listing-publishing-design.md) — §5.1, §5.2, §7.1–7.3, §10 (1-bosqich)

## Global Constraints

- Mavjud sahifalar, komponentlar, endpointlar (`GET /api/objects`, `GET /api/objects/:id`, `POST|GET /api/view/:id`, `/api/health`, `/api/docs`), OG-inject mexanizmi, sharp rasm-quvuri, seed skriptlari va CI ishlashda davom etadi.
- Faqat qo'shimcha ish: migratsiyalarda `DROP TABLE`, `DROP COLUMN` va ustun tipini o'zgartirish taqiqlanadi; yangi ustunlar `NULL`able yoki default qiymatli.
- Mavjud testlar o'chirilmaydi va assertion'lari bo'shashtirilmaydi.
- Mavjud fayllardan faqat spec §2.4 ro'yxatidagilari o'zgartiriladi, minimal diff bilan.
- Anonim foydalanuvchi uchun sayt loginsiz to'liq ishlaydi; yangi env o'zgaruvchilari berilmasa kabinet o'chadi, ilova yiqilmaydi.
- Kod, fayl nomi, marshrut, izoh va test nomlari **ingliz tilida**; foydalanuvchi ko'radigan matn **o'zbekcha**.
- Har task oxirida: `yarn format`, `yarn lint`, `yarn typecheck`, `yarn build`, `yarn test` — hammasi yashil, keyin commit.
- DB kerak bo'lgan tasklar uchun `docker compose up -d postgres` ishlab turishi shart; `DATABASE_URL=postgresql://rieltor:rieltor@localhost:5432/rieltor`.

## File Structure

**Yangi fayllar (backend):**

| Fayl                                             | Mas'uliyat                                                |
| ------------------------------------------------ | --------------------------------------------------------- |
| `apps/api/src/auth/telegram.ts`                  | Telegram Login Widget hash tekshiruvi — sof funksiya      |
| `apps/api/src/auth/telegram.test.ts`             | Uning testlari                                            |
| `apps/api/src/auth/session-token.ts`             | HS256 sessiya tokenini imzolash/tekshirish — sof funksiya |
| `apps/api/src/auth/session-token.test.ts`        | Uning testlari                                            |
| `apps/api/src/auth/cookie.ts`                    | Cookie sarlavhasini yig'ish va o'qish — sof funksiya      |
| `apps/api/src/auth/cookie.test.ts`               | Uning testlari                                            |
| `apps/api/src/auth/auth.service.ts`              | Realtor upsert va bo'sh `username` tanlash                |
| `apps/api/src/auth/auth.service.test.ts`         | Uning testlari (soxta Prisma bilan)                       |
| `apps/api/src/auth/auth.controller.ts`           | `POST /api/auth/telegram`, `POST /api/auth/logout`        |
| `apps/api/src/auth/auth.dto.ts`                  | Swagger uchun Zod DTO'lar                                 |
| `apps/api/src/auth/auth.module.ts`               | Modul                                                     |
| `apps/api/src/auth/realtor.guard.ts`             | Cookie'dan sessiyani o'qiydigan guard                     |
| `apps/api/src/auth/admin.guard.ts`               | `x-admin-token` guard                                     |
| `apps/api/src/auth/guards.test.ts`               | Ikkala guard testi                                        |
| `apps/api/src/auth/current-realtor.decorator.ts` | `@CurrentRealtor()` param dekoratori                      |
| `apps/api/src/auth-dev/auth-dev.controller.ts`   | `POST /api/auth/dev` — faqat dev/test                     |
| `apps/api/src/auth-dev/auth-dev.module.ts`       | Modul                                                     |
| `apps/api/src/realtors/realtors.service.ts`      | Profilni o'qish va yangilash                              |
| `apps/api/src/realtors/realtors.controller.ts`   | `GET                                                      | PATCH /api/me` |
| `apps/api/src/realtors/realtors.dto.ts`          | Swagger uchun Zod DTO'lar                                 |
| `apps/api/src/realtors/realtors.module.ts`       | Modul                                                     |
| `apps/api/test/auth.e2e-spec.ts`                 | Auth e2e                                                  |
| `apps/api/test/me.e2e-spec.ts`                   | Profil e2e                                                |

**Yangi fayllar (shared va frontend):**

| Fayl                                                           | Mas'uliyat                                                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `packages/shared/src/realtor.ts`                               | Telegram payload, profil va profil-yangilash sxemalari, telefon/username qoidalari, `slugifyUsername` |
| `packages/shared/src/realtor.test.ts`                          | Uning testlari                                                                                        |
| `apps/web/src/features/auth/api.ts`                            | `meQuery`, `logout`, `updateProfile`                                                                  |
| `apps/web/src/features/auth/model/use-me.ts`                   | Sessiya holati hooki                                                                                  |
| `apps/web/src/features/auth/ui/telegram-login-button.tsx`      | Widget'ni joylashtiradigan komponent                                                                  |
| `apps/web/src/features/auth/ui/telegram-login-button.test.tsx` | Uning testlari                                                                                        |
| `apps/web/src/features/auth/index.ts`                          | Public API                                                                                            |
| `apps/web/src/pages/cabinet/ui/cabinet-page.tsx`               | `/cabinet` — login yoki boshqaruv paneli                                                              |
| `apps/web/src/pages/cabinet/ui/cabinet-page.test.tsx`          | Uning testlari                                                                                        |
| `apps/web/src/pages/cabinet/ui/profile-page.tsx`               | `/cabinet/profile` — profil formasi                                                                   |
| `apps/web/src/pages/cabinet/ui/profile-page.test.tsx`          | Uning testlari                                                                                        |
| `apps/web/src/pages/cabinet/index.ts`                          | Public API                                                                                            |
| `docker-compose.e2e.yml`                                       | e2e stack overlay: `NODE_ENV=test` + dev-login siri                                                   |
| `e2e/cabinet.spec.ts`                                          | Playwright: dev-login → kabinet                                                                       |

**O'zgaradigan mavjud fayllar:** `apps/api/prisma/schema.prisma`, `apps/api/src/config/env.ts`, `apps/api/src/config/env.test.ts`, `apps/api/src/app.module.ts`, `apps/api/src/ssr/routes.ts`, `apps/api/test/ssr.e2e-spec.ts`, `apps/api/.env.example`, `packages/shared/src/index.ts`, `apps/web/src/shared/api/client.ts`, `apps/web/src/shared/api/client.test.ts`, `apps/web/src/app/router.tsx`, `apps/web/src/widgets/site-header/ui/site-header.tsx`, `apps/web/src/pages/contact/ui/contact-page.tsx`, `.github/workflows/ci.yml`.

---

### Task 1: Prisma — `Realtor` modeli va migratsiya

**Files:**

- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_add_realtor/migration.sql` (Prisma generatsiya qiladi)

**Interfaces:**

- Consumes: —
- Produces: `Realtor` Prisma modeli — `id, tgId, tgUsername, name, photoUrl, phone, phoneVerified, agency, username, registryNo, trusted, agentId, createdAt`

- [ ] **Step 1: `Agent` modeliga teskari relation maydonini qo'shish**

`apps/api/prisma/schema.prisma` dagi `Agent` modeli ichiga, `listings Listing[]` qatoridan keyin:

```prisma
  /// Reverse side of Realtor.agent. No column is added here — the foreign key
  /// lives on Realtor; Prisma just requires both ends of a relation to be declared.
  realtor  Realtor?
```

- [ ] **Step 2: `Realtor` modelini qo'shish**

Faylning oxiriga (`Image` modelidan keyin):

```prisma
/// A realtor who signs in with Telegram and manages their own listings.
/// The public-facing card on a listing page still comes from Agent — see
/// syncAgent() in stage 2, which mirrors this profile into an Agent row.
model Realtor {
  id            String   @id @default(cuid())
  /// Telegram user id. Bigger than a 32-bit int, hence BigInt.
  tgId          BigInt   @unique
  tgUsername    String?
  name          String
  photoUrl      String?
  /// Required before publishing — enforced by the API, not by the schema, so a
  /// half-filled profile can still be saved.
  phone         String?
  /// Set to true when the realtor shares their contact through the bot (stage 5).
  phoneVerified Boolean  @default(false)
  agency        String?
  /// Slug for /r/:username — [a-z0-9-]{3,30}.
  username      String   @unique
  /// Realtor registry number. Optional and never verified.
  registryNo    String?
  /// Once true, this realtor's listings go live without moderation.
  trusted       Boolean  @default(false)
  /// The mirrored public Agent row; created on first publish (stage 2).
  agentId       String?  @unique
  agent         Agent?   @relation(fields: [agentId], references: [id])
  createdAt     DateTime @default(now())
}
```

- [ ] **Step 3: Migratsiyani yaratish**

Run:

```bash
docker compose up -d postgres
yarn workspace @rieltor/api migrate --name add_realtor
```

Expected: `migrations/<timestamp>_add_realtor/migration.sql` fayli paydo bo'ladi.

- [ ] **Step 4: Migratsiyada destruktiv operatsiya yo'qligini tekshirish**

Run:

```bash
grep -inE 'DROP (TABLE|COLUMN)|ALTER COLUMN' apps/api/prisma/migrations/*_add_realtor/migration.sql
```

Expected: hech qanday chiqish yo'q (grep exit code 1). Agar biror qator chiqsa — **TO'XTA**, schema o'zgarishini qayta ko'rib chiq.

- [ ] **Step 5: Mavjud testlar yashilligini tekshirish**

Run: `yarn workspace @rieltor/api test`
Expected: barcha mavjud unit va e2e testlar PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(db): add Realtor model for cabinet authentication"
```

---

### Task 2: `@rieltor/shared` — rieltor sxemalari va `slugifyUsername`

**Files:**

- Create: `packages/shared/src/realtor.ts`
- Create: `packages/shared/src/realtor.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**

- Consumes: —
- Produces:
  - `TelegramAuthSchema` / `type TelegramAuth` — `{ id: number; first_name: string; last_name?: string; username?: string; photo_url?: string; auth_date: number; hash: string }`
  - `RealtorProfileSchema` / `type RealtorProfile`
  - `RealtorProfileUpdateSchema` / `type RealtorProfileUpdate`
  - `PhoneSchema`, `UZ_PHONE_PATTERN`, `USERNAME_PATTERN`
  - `slugifyUsername(source: string): string`

- [ ] **Step 1: Testni yozish**

`packages/shared/src/realtor.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  PhoneSchema,
  RealtorProfileUpdateSchema,
  TelegramAuthSchema,
  slugifyUsername,
} from './realtor';

describe('TelegramAuthSchema', () => {
  const valid = {
    id: '777000',
    first_name: 'Ali',
    username: 'ali_rieltor',
    auth_date: '1754700000',
    hash: 'b0ce1804dbb324c237f5127cd1a886cf1e8368bbd83b9e83d5369a10c9cd0a71',
  };

  it('coerces the numeric fields the widget sends as strings', () => {
    const parsed = TelegramAuthSchema.parse(valid);
    expect(parsed.id).toBe(777000);
    expect(parsed.auth_date).toBe(1754700000);
  });

  it('rejects a hash that is not 64 hex characters', () => {
    expect(() => TelegramAuthSchema.parse({ ...valid, hash: 'qisqa' })).toThrow();
  });
});

describe('PhoneSchema', () => {
  it('accepts a full Uzbek number', () => {
    expect(PhoneSchema.parse('+998901234567')).toBe('+998901234567');
  });

  it.each(['998901234567', '+99890123456', '+9989012345678', '+998 90 123 45 67'])(
    'rejects %s',
    (bad) => {
      expect(() => PhoneSchema.parse(bad)).toThrow();
    },
  );
});

describe('RealtorProfileUpdateSchema', () => {
  it('accepts a partial update', () => {
    expect(RealtorProfileUpdateSchema.parse({ phone: '+998901234567' })).toEqual({
      phone: '+998901234567',
    });
  });

  it('allows clearing an optional text field with null', () => {
    expect(RealtorProfileUpdateSchema.parse({ agency: null })).toEqual({ agency: null });
  });

  it('rejects a name shorter than two characters', () => {
    expect(() => RealtorProfileUpdateSchema.parse({ name: 'A' })).toThrow();
  });
});

describe('slugifyUsername', () => {
  it.each([
    ['Ali_Valiyev', 'ali-valiyev'],
    ['ALI', 'ali'],
    ['  ali  ', 'ali'],
    ['ali--valiyev', 'ali-valiyev'],
    ['__ali__', 'ali'],
  ])('turns %s into %s', (input, expected) => {
    expect(slugifyUsername(input)).toBe(expected);
  });

  it('falls back when nothing usable is left', () => {
    expect(slugifyUsername('Али')).toBe('rieltor');
  });

  it('falls back when the result is shorter than three characters', () => {
    expect(slugifyUsername('ab')).toBe('rieltor');
  });

  it('truncates to thirty characters without a trailing dash', () => {
    const long = slugifyUsername('a'.repeat(40));
    expect(long).toHaveLength(30);
    expect(long.endsWith('-')).toBe(false);
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/shared test`
Expected: FAIL — `Failed to resolve import "./realtor"`.

- [ ] **Step 3: `realtor.ts` ni yozish**

`packages/shared/src/realtor.ts`:

```ts
import * as z from 'zod';

/** +998 and nine digits, no spaces — the format tel: links need. */
export const UZ_PHONE_PATTERN = /^\+998\d{9}$/;

/** Slug used in /r/:username. */
export const USERNAME_PATTERN = /^[a-z0-9-]{3,30}$/;

export const PhoneSchema = z
  .string()
  .regex(UZ_PHONE_PATTERN, "Telefon +998XXXXXXXXX ko'rinishida bo'lishi kerak");

/**
 * What the Telegram Login Widget hands to the browser. Every value arrives as a
 * string in the widget's redirect form, so the numeric fields are coerced.
 */
export const TelegramAuthSchema = z.object({
  id: z.coerce.number().int().positive(),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.coerce.number().int().positive(),
  hash: z.string().regex(/^[a-f0-9]{64}$/),
});

/** What /api/me returns — never includes tgId or anything secret. */
export const RealtorProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  photoUrl: z.string().nullable(),
  phone: z.string().nullable(),
  phoneVerified: z.boolean(),
  agency: z.string().nullable(),
  registryNo: z.string().nullable(),
  trusted: z.boolean(),
});

/**
 * PATCH /api/me body. Every field is optional; `null` clears the text fields the
 * profile can live without. `phone` cannot be cleared — publishing depends on it.
 */
export const RealtorProfileUpdateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  phone: PhoneSchema.optional(),
  agency: z.string().max(80).nullable().optional(),
  registryNo: z.string().max(40).nullable().optional(),
});

const USERNAME_FALLBACK = 'rieltor';
const USERNAME_MAX = 30;

/**
 * Turns a Telegram username or display name into a URL slug. Anything outside
 * [a-z0-9] becomes a dash; a source with no usable characters (Cyrillic, emoji)
 * falls back to a fixed stem that the caller then makes unique.
 */
export function slugifyUsername(source: string): string {
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, USERNAME_MAX)
    .replace(/-+$/g, '');

  return slug.length >= 3 ? slug : USERNAME_FALLBACK;
}

export type TelegramAuth = z.infer<typeof TelegramAuthSchema>;
export type RealtorProfile = z.infer<typeof RealtorProfileSchema>;
export type RealtorProfileUpdate = z.infer<typeof RealtorProfileUpdateSchema>;
```

- [ ] **Step 4: `index.ts` dan eksport qilish**

`packages/shared/src/index.ts` ga mavjud eksportlar yoniga bitta qator qo'shiladi:

```ts
export * from './realtor';
```

- [ ] **Step 5: Testlarni ishga tushirish**

Run: `yarn workspace @rieltor/shared test`
Expected: PASS — barcha `realtor.test.ts` holatlari va mavjud testlar.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/realtor.ts packages/shared/src/realtor.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): add realtor profile and Telegram auth schemas"
```

---

### Task 3: Telegram hash tekshiruvi

**Files:**

- Create: `apps/api/src/auth/telegram.ts`
- Create: `apps/api/src/auth/telegram.test.ts`

**Interfaces:**

- Consumes: `TelegramAuth` (Task 2)
- Produces:
  - `TELEGRAM_AUTH_MAX_AGE_SEC: number` (86400)
  - `telegramDataCheckString(payload: TelegramAuth): string`
  - `verifyTelegramAuth(payload: TelegramAuth, botToken: string, nowSec: number): boolean`

- [ ] **Step 1: Testni yozish**

`apps/api/src/auth/telegram.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { TelegramAuth } from '@rieltor/shared';
import { telegramDataCheckString, verifyTelegramAuth } from './telegram';

const BOT_TOKEN = '123456:TEST-BOT-TOKEN';

/**
 * A vector computed once with node:crypto against the token above. Hard-coding it
 * means the test cannot pass by repeating the implementation's own mistake.
 */
const payload: TelegramAuth = {
  id: 777000,
  first_name: 'Ali',
  username: 'ali_rieltor',
  auth_date: 1754700000,
  hash: 'b0ce1804dbb324c237f5127cd1a886cf1e8368bbd83b9e83d5369a10c9cd0a71',
};

const JUST_AFTER = payload.auth_date + 60;

describe('telegramDataCheckString', () => {
  it('joins the fields alphabetically and leaves out the hash', () => {
    expect(telegramDataCheckString(payload)).toBe(
      'auth_date=1754700000\nfirst_name=Ali\nid=777000\nusername=ali_rieltor',
    );
  });

  it('skips fields the widget did not send', () => {
    expect(telegramDataCheckString({ ...payload, last_name: undefined })).not.toContain(
      'last_name',
    );
  });
});

describe('verifyTelegramAuth', () => {
  it('accepts the golden vector', () => {
    expect(verifyTelegramAuth(payload, BOT_TOKEN, JUST_AFTER)).toBe(true);
  });

  it('rejects a tampered field', () => {
    expect(verifyTelegramAuth({ ...payload, first_name: 'Vali' }, BOT_TOKEN, JUST_AFTER)).toBe(
      false,
    );
  });

  it('rejects a wrong bot token', () => {
    expect(verifyTelegramAuth(payload, 'boshqa-token', JUST_AFTER)).toBe(false);
  });

  it('rejects a hash of the wrong length', () => {
    expect(verifyTelegramAuth({ ...payload, hash: 'ab'.repeat(16) }, BOT_TOKEN, JUST_AFTER)).toBe(
      false,
    );
  });

  it('rejects an auth_date older than 24 hours', () => {
    expect(verifyTelegramAuth(payload, BOT_TOKEN, payload.auth_date + 86_401)).toBe(false);
  });

  it('rejects an auth_date from the future', () => {
    expect(verifyTelegramAuth(payload, BOT_TOKEN, payload.auth_date - 120)).toBe(false);
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run src/auth/telegram.test.ts`
Expected: FAIL — `Failed to resolve import "./telegram"`.

- [ ] **Step 3: `telegram.ts` ni yozish**

`apps/api/src/auth/telegram.ts`:

```ts
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { TelegramAuth } from '@rieltor/shared';

/** Telegram's own recommendation: treat anything older than a day as stale. */
export const TELEGRAM_AUTH_MAX_AGE_SEC = 24 * 60 * 60;

/** Clocks drift; a minute of tolerance avoids rejecting a fresh login. */
const FUTURE_TOLERANCE_SEC = 60;

/**
 * The string Telegram signs: every field except `hash`, as `key=value`, sorted
 * alphabetically and joined with newlines. Fields the widget omitted are left out —
 * including them as "undefined" would change the signature.
 */
export function telegramDataCheckString(payload: TelegramAuth): string {
  // Filtered rather than destructured: `const { hash: _hash, ...rest }` leaves an
  // unused binding, and this repo's no-unused-vars rule only exempts arguments.
  return Object.entries(payload)
    .filter(([key, value]) => key !== 'hash' && value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');
}

export function verifyTelegramAuth(
  payload: TelegramAuth,
  botToken: string,
  nowSec: number,
): boolean {
  const age = nowSec - payload.auth_date;
  if (age > TELEGRAM_AUTH_MAX_AGE_SEC || age < -FUTURE_TOLERANCE_SEC) return false;

  const secret = createHash('sha256').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(telegramDataCheckString(payload)).digest();
  const received = Buffer.from(payload.hash, 'hex');

  // timingSafeEqual throws on a length mismatch, so the guard has to come first.
  if (received.length !== expected.length) return false;

  return timingSafeEqual(received, expected);
}
```

- [ ] **Step 4: Testni ishga tushirish**

Run: `yarn workspace @rieltor/api vitest run src/auth/telegram.test.ts`
Expected: PASS — 8 ta holat.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/telegram.ts apps/api/src/auth/telegram.test.ts
git commit -m "feat(auth): verify Telegram login widget signatures"
```

---

### Task 4: Sessiya tokeni

**Files:**

- Create: `apps/api/src/auth/session-token.ts`
- Create: `apps/api/src/auth/session-token.test.ts`

**Interfaces:**

- Consumes: —
- Produces:
  - `SESSION_TTL_SEC: number` (30 kun)
  - `signSession(realtorId: string, secret: string, nowSec: number, ttlSec?: number): string`
  - `verifySession(token: string, secret: string, nowSec: number): string | null` — `realtorId` yoki `null`

**Nega kutubxona emas:** token bizga faqat bitta maydonni (`realtorId`) tashiydi; `node:crypto` bilan 40 qator kod yozish Netlify'ning fayl-treyseriga yangi paket qo'shishdan xavfsizroq va loyihaning mavjud uslubiga (o'z view-counteri, o'z rasm-quvuri) mos.

- [ ] **Step 1: Testni yozish**

`apps/api/src/auth/session-token.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SESSION_TTL_SEC, signSession, verifySession } from './session-token';

const SECRET = 'test-session-secret';
const NOW = 1_754_700_000;

describe('session token', () => {
  it('round-trips the realtor id', () => {
    const token = signSession('rlt_1', SECRET, NOW);
    expect(verifySession(token, SECRET, NOW + 10)).toBe('rlt_1');
  });

  it('rejects a token signed with another secret', () => {
    const token = signSession('rlt_1', SECRET, NOW);
    expect(verifySession(token, 'boshqa-sir', NOW + 10)).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const token = signSession('rlt_1', SECRET, NOW);
    const [, signature] = token.split('.');
    const forged = `${Buffer.from(JSON.stringify({ sub: 'rlt_2', exp: NOW + 100 })).toString(
      'base64url',
    )}.${signature}`;
    expect(verifySession(forged, SECRET, NOW + 10)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = signSession('rlt_1', SECRET, NOW, 60);
    expect(verifySession(token, SECRET, NOW + 61)).toBeNull();
  });

  it('rejects malformed input', () => {
    for (const bad of ['', 'shunchaki-matn', 'a.b.c', 'a.']) {
      expect(verifySession(bad, SECRET, NOW)).toBeNull();
    }
  });

  it('defaults to a thirty-day lifetime', () => {
    expect(SESSION_TTL_SEC).toBe(30 * 24 * 60 * 60);
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run src/auth/session-token.test.ts`
Expected: FAIL — `Failed to resolve import "./session-token"`.

- [ ] **Step 3: `session-token.ts` ni yozish**

`apps/api/src/auth/session-token.ts`:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_TTL_SEC = 30 * 24 * 60 * 60;

interface SessionPayload {
  /** Realtor id. */
  sub: string;
  /** Unix seconds. */
  exp: number;
}

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

/** `<base64url(payload)>.<base64url(hmac)>` — a JWT without the unused header. */
export function signSession(
  realtorId: string,
  secret: string,
  nowSec: number,
  ttlSec: number = SESSION_TTL_SEC,
): string {
  const payload: SessionPayload = { sub: realtorId, exp: nowSec + ttlSec };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');

  return `${body}.${sign(body, secret)}`;
}

/** Returns the realtor id, or null for anything that does not verify. */
export function verifySession(token: string, secret: string, nowSec: number): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [body, signature] = parts;
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body, secret));
  const received = Buffer.from(signature);
  if (received.length !== expected.length) return null;
  if (!timingSafeEqual(received, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload;
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp <= nowSec) return null;
    return payload.sub;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Testni ishga tushirish**

Run: `yarn workspace @rieltor/api vitest run src/auth/session-token.test.ts`
Expected: PASS — 6 ta holat.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/session-token.ts apps/api/src/auth/session-token.test.ts
git commit -m "feat(auth): add HMAC-signed session tokens"
```

---

### Task 5: Cookie yordamchilari

**Files:**

- Create: `apps/api/src/auth/cookie.ts`
- Create: `apps/api/src/auth/cookie.test.ts`

**Interfaces:**

- Consumes: —
- Produces:
  - `SESSION_COOKIE: 'rlt_session'`
  - `serializeSessionCookie(token: string, maxAgeSec: number, secure: boolean): string`
  - `clearedSessionCookie(secure: boolean): string`
  - `readCookie(header: string | undefined, name: string): string | null`

- [ ] **Step 1: Testni yozish**

`apps/api/src/auth/cookie.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SESSION_COOKIE, clearedSessionCookie, readCookie, serializeSessionCookie } from './cookie';

describe('serializeSessionCookie', () => {
  it('sets the security flags', () => {
    const header = serializeSessionCookie('abc.def', 3600, true);
    expect(header).toBe(
      `${SESSION_COOKIE}=abc.def; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=3600`,
    );
  });

  it('leaves Secure out over plain http, or the browser would drop the cookie', () => {
    expect(serializeSessionCookie('abc.def', 3600, false)).not.toContain('Secure');
  });
});

describe('clearedSessionCookie', () => {
  it('expires the cookie immediately', () => {
    expect(clearedSessionCookie(false)).toContain('Max-Age=0');
  });
});

describe('readCookie', () => {
  it('finds a value among several cookies', () => {
    expect(readCookie(`theme=dark; ${SESSION_COOKIE}=abc.def; lang=uz`, SESSION_COOKIE)).toBe(
      'abc.def',
    );
  });

  it('returns null when the header is missing or the name is absent', () => {
    expect(readCookie(undefined, SESSION_COOKIE)).toBeNull();
    expect(readCookie('theme=dark', SESSION_COOKIE)).toBeNull();
  });

  it('does not match a cookie whose name merely ends with the wanted one', () => {
    expect(readCookie(`other_${SESSION_COOKIE}=abc`, SESSION_COOKIE)).toBeNull();
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run src/auth/cookie.test.ts`
Expected: FAIL — `Failed to resolve import "./cookie"`.

- [ ] **Step 3: `cookie.ts` ni yozish**

`apps/api/src/auth/cookie.ts`:

```ts
export const SESSION_COOKIE = 'rlt_session';

/**
 * SameSite=Lax is the CSRF guard: the browser will not attach this cookie to a
 * cross-site POST, and every state-changing endpoint here is POST or PATCH.
 */
function serialize(value: string, maxAgeSec: number, secure: boolean): string {
  const parts = [`${SESSION_COOKIE}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  parts.push(`Max-Age=${maxAgeSec}`);

  return parts.join('; ');
}

export function serializeSessionCookie(token: string, maxAgeSec: number, secure: boolean): string {
  return serialize(token, maxAgeSec, secure);
}

export function clearedSessionCookie(secure: boolean): string {
  return serialize('', 0, secure);
}

/** No cookie-parser in this app — one header, parsed where it is needed. */
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return part.slice(separator + 1).trim();
  }

  return null;
}
```

- [ ] **Step 4: Testni ishga tushirish**

Run: `yarn workspace @rieltor/api vitest run src/auth/cookie.test.ts`
Expected: PASS — 6 ta holat.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/cookie.ts apps/api/src/auth/cookie.test.ts
git commit -m "feat(auth): add session cookie helpers"
```

---

### Task 6: Env o'zgaruvchilari

**Files:**

- Modify: `apps/api/src/config/env.ts`
- Modify: `apps/api/src/config/env.test.ts`
- Modify: `apps/api/.env.example`

**Interfaces:**

- Consumes: —
- Produces: `Env` tipida yangi ixtiyoriy maydonlar — `TELEGRAM_BOT_TOKEN?`, `JWT_SECRET?`, `ADMIN_TOKEN?`, `DEV_LOGIN_SECRET?`

- [ ] **Step 1: Testni yozish**

`apps/api/src/config/env.test.ts` ichidagi `describe('envSchema', ...)` blokiga qo'shiladi (mavjud holatlar tegilmaydi):

```ts
it('keeps the cabinet variables when they are set', () => {
  const parsed = envSchema.parse({
    ...fullEnv,
    JWT_SECRET: 'e2e-jwt-secret-at-least-16',
    TELEGRAM_BOT_TOKEN: '123456:token',
  });
  expect(parsed.JWT_SECRET).toBe('e2e-jwt-secret-at-least-16');
  expect(parsed.TELEGRAM_BOT_TOKEN).toBe('123456:token');
});

it('leaves the cabinet variables undefined when they are not set', () => {
  const parsed = envSchema.parse(fullEnv);
  expect(parsed.TELEGRAM_BOT_TOKEN).toBeUndefined();
  expect(parsed.JWT_SECRET).toBeUndefined();
  expect(parsed.ADMIN_TOKEN).toBeUndefined();
  expect(parsed.DEV_LOGIN_SECRET).toBeUndefined();
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run src/config/env.test.ts`
Expected: FAIL — `keeps the cabinet variables when they are set` holatida `expected undefined to be 'e2e-jwt-secret-at-least-16'`, chunki Zod sxemada bo'lmagan kalitlarni tashlab yuboradi. (Ikkinchi holat implementatsiyagacha ham o'tadi — bu normal, u regressiya qo'riqchisi.)

- [ ] **Step 3: `env.ts` ga maydonlarni qo'shish**

`apps/api/src/config/env.ts` dagi `envSchema` obyektiga, `WEB_DIST` dan keyin:

```ts
  /**
   * Cabinet variables. All optional on purpose: without them the public site works
   * exactly as before and only the realtor cabinet turns itself off (spec §7.3).
   */
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  /** Signs the session cookie. Without it /api/auth/* answers 503. */
  JWT_SECRET: z.string().min(16).optional(),
  /** Guards the admin endpoints (stage 2 onwards). */
  ADMIN_TOKEN: z.string().min(16).optional(),
  /** Enables POST /api/auth/dev — ignored when NODE_ENV is production. */
  DEV_LOGIN_SECRET: z.string().min(8).optional(),
```

- [ ] **Step 4: `.env.example` ni to'ldirish**

`apps/api/.env.example` oxiriga:

```bash

# --- Kabinet (ixtiyoriy) ---
# Berilmasa sayt avvalgidek ishlaydi, faqat rieltor kabineti o'chadi.
# BotFather'dan olingan token; widget domeni ham o'sha yerda ro'yxatdan o'tkaziladi.
TELEGRAM_BOT_TOKEN=
# Sessiya cookie'sini imzolaydi, kamida 16 belgi: openssl rand -hex 32
JWT_SECRET=
# Admin endpointlari uchun, kamida 16 belgi
ADMIN_TOKEN=
# Faqat lokal dev va e2e uchun: POST /api/auth/dev ni yoqadi (prodda e'tiborsiz qoldiriladi)
DEV_LOGIN_SECRET=
```

- [ ] **Step 5: Testni ishga tushirish**

Run: `yarn workspace @rieltor/api vitest run src/config/env.test.ts`
Expected: PASS — mavjud 5 ta va yangi 2 ta holat.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/config/env.ts apps/api/src/config/env.test.ts apps/api/.env.example
git commit -m "feat(config): add optional cabinet environment variables"
```

---

### Task 7: `AuthService` — Realtor upsert va `username` tanlash

**Files:**

- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/auth.service.test.ts`

**Interfaces:**

- Consumes: `TelegramAuth`, `slugifyUsername` (Task 2); `PrismaService` (`apps/api/src/prisma/prisma.service`)
- Produces:
  - `AuthService.pickUsername(preferred: string): Promise<string>`
  - `AuthService.upsertFromTelegram(payload: TelegramAuth): Promise<{ id: string }>`

- [ ] **Step 1: Testni yozish**

`apps/api/src/auth/auth.service.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import type { TelegramAuth } from '@rieltor/shared';
import type { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const payload: TelegramAuth = {
  id: 777000,
  first_name: 'Ali',
  username: 'Ali_Valiyev',
  photo_url: 'https://t.me/i/userpic/320/ali.jpg',
  auth_date: 1754700000,
  hash: 'b0ce1804dbb324c237f5127cd1a886cf1e8368bbd83b9e83d5369a10c9cd0a71',
};

/** Only the four calls AuthService makes — nothing else is stubbed. */
function fakePrisma(overrides: {
  findUnique?: ReturnType<typeof vi.fn>;
  findFirst?: ReturnType<typeof vi.fn>;
  create?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
}) {
  return {
    realtor: {
      findUnique: overrides.findUnique ?? vi.fn().mockResolvedValue(null),
      findFirst: overrides.findFirst ?? vi.fn().mockResolvedValue(null),
      create: overrides.create ?? vi.fn().mockResolvedValue({ id: 'rlt_new' }),
      update: overrides.update ?? vi.fn().mockResolvedValue({ id: 'rlt_old' }),
    },
  } as unknown as PrismaService;
}

describe('AuthService.pickUsername', () => {
  it('uses the slug when it is free', async () => {
    const service = new AuthService(fakePrisma({}));
    await expect(service.pickUsername('Ali_Valiyev')).resolves.toBe('ali-valiyev');
  });

  it('appends a counter until the slug is free', async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce({ id: 'a' })
      .mockResolvedValueOnce({ id: 'b' })
      .mockResolvedValueOnce(null);
    const service = new AuthService(fakePrisma({ findFirst }));

    await expect(service.pickUsername('ali')).resolves.toBe('ali-3');
    expect(findFirst).toHaveBeenCalledTimes(3);
  });
});

describe('AuthService.upsertFromTelegram', () => {
  it('creates a realtor on the first login', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'rlt_new' });
    const service = new AuthService(fakePrisma({ create }));

    await expect(service.upsertFromTelegram(payload)).resolves.toEqual({ id: 'rlt_new' });
    expect(create).toHaveBeenCalledWith({
      data: {
        tgId: BigInt(777000),
        tgUsername: 'Ali_Valiyev',
        name: 'Ali',
        photoUrl: 'https://t.me/i/userpic/320/ali.jpg',
        username: 'ali-valiyev',
      },
      select: { id: true },
    });
  });

  it('refreshes the Telegram-owned fields on a repeat login', async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: 'rlt_old' });
    const update = vi.fn().mockResolvedValue({ id: 'rlt_old' });
    const create = vi.fn();
    const service = new AuthService(fakePrisma({ findUnique, update, create }));

    await expect(service.upsertFromTelegram(payload)).resolves.toEqual({ id: 'rlt_old' });
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: 'rlt_old' },
      data: {
        tgUsername: 'Ali_Valiyev',
        name: 'Ali',
        photoUrl: 'https://t.me/i/userpic/320/ali.jpg',
      },
      select: { id: true },
    });
  });

  it('builds a name from first and last name together', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'rlt_new' });
    const service = new AuthService(fakePrisma({ create }));

    await service.upsertFromTelegram({ ...payload, last_name: 'Valiyev' });
    expect(create.mock.calls[0][0].data.name).toBe('Ali Valiyev');
  });

  it('falls back to the display name when there is no Telegram username', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'rlt_new' });
    const service = new AuthService(fakePrisma({ create }));

    await service.upsertFromTelegram({ ...payload, username: undefined });
    expect(create.mock.calls[0][0].data.username).toBe('ali');
  });

  it('falls back to the fixed stem when the display name has no usable characters', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'rlt_new' });
    const service = new AuthService(fakePrisma({ create }));

    await service.upsertFromTelegram({ ...payload, username: undefined, first_name: 'Али' });
    expect(create.mock.calls[0][0].data.username).toBe('rieltor');
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run src/auth/auth.service.test.ts`
Expected: FAIL — `Failed to resolve import "./auth.service"`.

- [ ] **Step 3: `auth.service.ts` ni yozish**

`apps/api/src/auth/auth.service.ts`:

```ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { type TelegramAuth, slugifyUsername } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

/** Enough suffixes for any realistic collision; a runaway loop is a bug, not a case. */
const MAX_USERNAME_ATTEMPTS = 50;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns a free slug: "ali", then "ali-2", "ali-3", ... */
  async pickUsername(preferred: string): Promise<string> {
    const base = slugifyUsername(preferred);

    for (let attempt = 1; attempt <= MAX_USERNAME_ATTEMPTS; attempt += 1) {
      const candidate = attempt === 1 ? base : `${base}-${attempt}`;
      const taken = await this.prisma.realtor.findFirst({
        where: { username: candidate },
        select: { id: true },
      });
      if (!taken) return candidate;
    }

    throw new InternalServerErrorException('Bo‘sh username topilmadi');
  }

  /**
   * First login creates the realtor; later logins only refresh what Telegram owns.
   * The profile fields the realtor edits themselves (phone, agency, registryNo) are
   * never overwritten here.
   */
  async upsertFromTelegram(payload: TelegramAuth): Promise<{ id: string }> {
    const name = [payload.first_name, payload.last_name].filter(Boolean).join(' ');
    const photoUrl = payload.photo_url ?? null;

    const existing = await this.prisma.realtor.findUnique({
      where: { tgId: BigInt(payload.id) },
      select: { id: true },
    });

    if (existing) {
      return this.prisma.realtor.update({
        where: { id: existing.id },
        data: { tgUsername: payload.username ?? null, name, photoUrl },
        select: { id: true },
      });
    }

    return this.prisma.realtor.create({
      data: {
        tgId: BigInt(payload.id),
        tgUsername: payload.username ?? null,
        name,
        photoUrl,
        username: await this.pickUsername(payload.username ?? payload.first_name),
      },
      select: { id: true },
    });
  }
}
```

- [ ] **Step 4: Testni ishga tushirish**

Run: `yarn workspace @rieltor/api vitest run src/auth/auth.service.test.ts`
Expected: PASS — 6 ta holat.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/auth.service.ts apps/api/src/auth/auth.service.test.ts
git commit -m "feat(auth): upsert realtors from Telegram logins"
```

---

### Task 8: Auth kontrolleri, moduli va e2e

**Files:**

- Create: `apps/api/src/auth/realtor-select.ts`
- Create: `apps/api/src/auth/auth.dto.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/test/auth.e2e-spec.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**

- Consumes: `verifyTelegramAuth` (Task 3), `signSession`, `SESSION_TTL_SEC` (Task 4), `serializeSessionCookie`, `clearedSessionCookie` (Task 5), `AuthService` (Task 7), `RealtorProfileSchema` (Task 2)
- Produces:
  - `POST /api/auth/telegram` → `RealtorProfile`, `Set-Cookie: rlt_session`
  - `POST /api/auth/logout` → `{ ok: true }`
  - `AuthModule` (`AuthService` ni eksport qiladi)
  - `REALTOR_SELECT` (`apps/api/src/auth/realtor-select.ts`) — profil maydonlari uchun umumiy Prisma `select`; 10- va 11-tasklar shu fayldan import qiladi

- [ ] **Step 1: e2e testni yozish**

`apps/api/test/auth.e2e-spec.ts`:

```ts
import { createHash, createHmac } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SESSION_COOKIE } from '../src/auth/cookie';
import { configureApp } from '../src/bootstrap';

const BOT_TOKEN = '123456:E2E-BOT-TOKEN';
const TG_ID = 990001;

/** Signs a payload the way the widget does, so the test never reuses src/ code. */
function signedPayload(overrides: Record<string, string | number> = {}) {
  const fields: Record<string, string | number> = {
    id: TG_ID,
    first_name: 'E2eAli',
    username: 'e2e_ali',
    auth_date: Math.floor(Date.now() / 1000),
    ...overrides,
  };

  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('\n');
  const secret = createHash('sha256').update(BOT_TOKEN).digest();
  const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex');

  return { ...fields, hash };
}

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
    process.env.JWT_SECRET = 'e2e-jwt-secret-at-least-16';

    // Imported after the env is in place: app.module.ts builds its imports array
    // (including the conditional dev-login module) while the file is being evaluated.
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await prisma.realtor.deleteMany({ where: { tgId: BigInt(TG_ID) } });
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /api/auth/telegram → profile and a session cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/telegram')
      .send(signedPayload())
      .expect(201);

    expect(res.body.name).toBe('E2eAli');
    expect(res.body.username).toBe('e2e-ali');
    expect(res.body.phone).toBeNull();
    expect(res.body).not.toHaveProperty('tgId');

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('a repeat login keeps the same realtor', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/auth/telegram')
      .send(signedPayload())
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/api/auth/telegram')
      .send(signedPayload({ first_name: 'E2eVali' }))
      .expect(201);

    expect(second.body.id).toBe(first.body.id);
    expect(second.body.name).toBe('E2eVali');
  });

  it('rejects a tampered hash', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/telegram')
      .send({ ...signedPayload(), first_name: 'Soxta' })
      .expect(401);
  });

  it('rejects an auth_date older than a day', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/telegram')
      .send(signedPayload({ auth_date: Math.floor(Date.now() / 1000) - 90_000 }))
      .expect(401);
  });

  it('rejects a body that is not a widget payload', async () => {
    await request(app.getHttpServer()).post('/api/auth/telegram').send({ id: 1 }).expect(400);
  });

  it('POST /api/auth/logout clears the cookie', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/logout').expect(201);
    expect(res.headers['set-cookie'][0]).toContain('Max-Age=0');
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run --config vitest.config.e2e.ts test/auth.e2e-spec.ts`
Expected: FAIL — `Cannot find module '../src/auth/cookie'` yoki 404.

- [ ] **Step 3: `realtor-select.ts` va DTO'larni yozish**

`apps/api/src/auth/realtor-select.ts`:

```ts
/**
 * Every field the profile endpoints return — and nothing else. Kept in its own file
 * because three modules (auth, auth-dev, realtors) need it and none of them should
 * have to import a controller to get it.
 */
export const REALTOR_SELECT = {
  id: true,
  name: true,
  username: true,
  photoUrl: true,
  phone: true,
  phoneVerified: true,
  agency: true,
  registryNo: true,
  trusted: true,
} as const;
```

`apps/api/src/auth/auth.dto.ts`:

```ts
import { createZodDto } from 'nestjs-zod';
import { RealtorProfileSchema, TelegramAuthSchema } from '@rieltor/shared';

// The Swagger schema is generated from these classes; the types come from @rieltor/shared.
export class TelegramAuthDto extends createZodDto(TelegramAuthSchema) {}
export class RealtorProfileDto extends createZodDto(RealtorProfileSchema) {}
```

- [ ] **Step 4: Kontrollerni yozish**

`apps/api/src/auth/auth.controller.ts`:

```ts
import {
  Body,
  Controller,
  Post,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { RealtorProfile } from '@rieltor/shared';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { TelegramAuthDto, RealtorProfileDto } from './auth.dto';
import { REALTOR_SELECT } from './realtor-select';
import { SESSION_TTL_SEC, signSession } from './session-token';
import { clearedSessionCookie, serializeSessionCookie } from './cookie';
import { verifyTelegramAuth } from './telegram';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('telegram')
  @ApiOkResponse({ type: RealtorProfileDto })
  async telegram(
    @Body() body: TelegramAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RealtorProfile> {
    const botToken = this.config.get('TELEGRAM_BOT_TOKEN', { infer: true });
    const secret = this.config.get('JWT_SECRET', { infer: true });
    if (!botToken || !secret) {
      // The cabinet is simply not configured on this deployment (spec §7.3).
      throw new ServiceUnavailableException('Kabinet hozircha sozlanmagan');
    }

    if (!verifyTelegramAuth(body, botToken, Math.floor(Date.now() / 1000))) {
      throw new UnauthorizedException('Telegram imzosi tasdiqlanmadi');
    }

    const { id } = await this.auth.upsertFromTelegram(body);
    const token = signSession(id, secret, Math.floor(Date.now() / 1000));
    res.setHeader(
      'set-cookie',
      serializeSessionCookie(token, SESSION_TTL_SEC, this.isProduction()),
    );

    return this.prisma.realtor.findUniqueOrThrow({ where: { id }, select: REALTOR_SELECT });
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    res.setHeader('set-cookie', clearedSessionCookie(this.isProduction()));
    return { ok: true };
  }

  /** A Secure cookie is dropped over plain http, which is what e2e runs on. */
  private isProduction(): boolean {
    return this.config.get('NODE_ENV', { infer: true }) === 'production';
  }
}
```

- [ ] **Step 5: Modulni yozish va `app.module.ts` ga ulash**

`apps/api/src/auth/auth.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

`apps/api/src/app.module.ts` — import qatori va `imports` ro'yxatiga bitta element:

```ts
import { AuthModule } from './auth/auth.module';
```

```ts
    ListingsModule,
    ViewsModule,
    AuthModule,
    SsrModule,
```

- [ ] **Step 6: e2e testni ishga tushirish**

Run: `yarn workspace @rieltor/api vitest run --config vitest.config.e2e.ts test/auth.e2e-spec.ts`
Expected: PASS — 6 ta holat.

- [ ] **Step 7: Butun paket testini ishga tushirish**

Run: `yarn workspace @rieltor/api test`
Expected: PASS — mavjud testlar ham yashil.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/auth apps/api/src/app.module.ts apps/api/test/auth.e2e-spec.ts
git commit -m "feat(auth): add Telegram login and logout endpoints"
```

---

### Task 9: Guard'lar va `@CurrentRealtor()`

**Files:**

- Create: `apps/api/src/auth/realtor.guard.ts`
- Create: `apps/api/src/auth/admin.guard.ts`
- Create: `apps/api/src/auth/current-realtor.decorator.ts`
- Create: `apps/api/src/auth/guards.test.ts`

**Interfaces:**

- Consumes: `verifySession` (Task 4), `readCookie`, `SESSION_COOKIE` (Task 5)
- Produces:
  - `RealtorGuard` — `request.realtorId` ni to'ldiradi
  - `AdminGuard`
  - `CurrentRealtor()` param dekoratori → `string`
  - `interface RequestWithRealtor { realtorId?: string }`

- [ ] **Step 1: Testni yozish**

`apps/api/src/auth/guards.test.ts`:

```ts
import {
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AdminGuard } from './admin.guard';
import { RealtorGuard } from './realtor.guard';
import { SESSION_COOKIE } from './cookie';
import { signSession } from './session-token';

const SECRET = 'guard-test-secret-16+';

/** Only the two properties the guards read — not a full express Request. */
interface FakeRequest {
  headers: Record<string, string>;
  realtorId?: string;
}

/** Minimal ConfigService stand-in: the guards only ever call get(). */
function fakeConfig(values: Record<string, string | undefined>) {
  return { get: (key: string) => values[key] } as never;
}

function contextFor(request: FakeRequest) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('RealtorGuard', () => {
  it('accepts a valid session cookie and exposes the realtor id', () => {
    const token = signSession('rlt_1', SECRET, Math.floor(Date.now() / 1000));
    const request: FakeRequest = { headers: { cookie: `${SESSION_COOKIE}=${token}` } };
    const guard = new RealtorGuard(fakeConfig({ JWT_SECRET: SECRET }));

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.realtorId).toBe('rlt_1');
  });

  it('rejects a request without a cookie', () => {
    const guard = new RealtorGuard(fakeConfig({ JWT_SECRET: SECRET }));
    expect(() => guard.canActivate(contextFor({ headers: {} }))).toThrow(UnauthorizedException);
  });

  it('rejects a cookie signed with another secret', () => {
    const token = signSession('rlt_1', 'boshqa-sir-16-belgidan', Math.floor(Date.now() / 1000));
    const guard = new RealtorGuard(fakeConfig({ JWT_SECRET: SECRET }));

    expect(() =>
      guard.canActivate(contextFor({ headers: { cookie: `${SESSION_COOKIE}=${token}` } })),
    ).toThrow(UnauthorizedException);
  });

  it('answers 503 when the cabinet is not configured', () => {
    const guard = new RealtorGuard(fakeConfig({}));
    expect(() => guard.canActivate(contextFor({ headers: {} }))).toThrow(
      ServiceUnavailableException,
    );
  });
});

describe('AdminGuard', () => {
  it('accepts the configured token', () => {
    const guard = new AdminGuard(fakeConfig({ ADMIN_TOKEN: 'admin-token-16-belgi' }));
    expect(
      guard.canActivate(contextFor({ headers: { 'x-admin-token': 'admin-token-16-belgi' } })),
    ).toBe(true);
  });

  it('rejects a wrong or missing token', () => {
    const guard = new AdminGuard(fakeConfig({ ADMIN_TOKEN: 'admin-token-16-belgi' }));
    expect(() => guard.canActivate(contextFor({ headers: { 'x-admin-token': 'yolg' } }))).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(contextFor({ headers: {} }))).toThrow(ForbiddenException);
  });

  it('answers 503 when no admin token is configured', () => {
    const guard = new AdminGuard(fakeConfig({}));
    expect(() => guard.canActivate(contextFor({ headers: {} }))).toThrow(
      ServiceUnavailableException,
    );
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run src/auth/guards.test.ts`
Expected: FAIL — `Failed to resolve import "./admin.guard"`.

- [ ] **Step 3: `realtor.guard.ts` ni yozish**

```ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Env } from '../config/env';
import { SESSION_COOKIE, readCookie } from './cookie';
import { verifySession } from './session-token';

export interface RequestWithRealtor extends Request {
  realtorId?: string;
}

@Injectable()
export class RealtorGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get('JWT_SECRET', { infer: true });
    if (!secret) throw new ServiceUnavailableException('Kabinet hozircha sozlanmagan');

    const request = context.switchToHttp().getRequest<RequestWithRealtor>();
    const token = readCookie(request.headers.cookie, SESSION_COOKIE);
    const realtorId = token ? verifySession(token, secret, Math.floor(Date.now() / 1000)) : null;
    if (!realtorId) throw new UnauthorizedException('Sessiya topilmadi');

    request.realtorId = realtorId;
    return true;
  }
}
```

- [ ] **Step 4: `admin.guard.ts` ni yozish**

```ts
import { timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Env } from '../config/env';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get('ADMIN_TOKEN', { infer: true });
    if (!expected) throw new ServiceUnavailableException('Admin token sozlanmagan');

    const header = context.switchToHttp().getRequest<Request>().headers['x-admin-token'];
    const received = typeof header === 'string' ? header : '';

    const a = Buffer.from(received);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new ForbiddenException('Admin token noto‘g‘ri');
    }

    return true;
  }
}
```

- [ ] **Step 5: `current-realtor.decorator.ts` ni yozish**

```ts
import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { RequestWithRealtor } from './realtor.guard';

/** Only valid on a handler behind RealtorGuard, which is what fills realtorId in. */
export const CurrentRealtor = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<RequestWithRealtor>();
  return request.realtorId as string;
});
```

- [ ] **Step 6: Testni ishga tushirish**

Run: `yarn workspace @rieltor/api vitest run src/auth/guards.test.ts`
Expected: PASS — 7 ta holat.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/auth/realtor.guard.ts apps/api/src/auth/admin.guard.ts apps/api/src/auth/current-realtor.decorator.ts apps/api/src/auth/guards.test.ts
git commit -m "feat(auth): add realtor and admin guards"
```

---

### Task 10: Dev-login moduli

**Files:**

- Create: `apps/api/src/auth-dev/auth-dev.controller.ts`
- Create: `apps/api/src/auth-dev/auth-dev.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/test/auth-dev.e2e-spec.ts`

**Interfaces:**

- Consumes: `AuthService` (Task 7), `signSession` (Task 4), `serializeSessionCookie` (Task 5), `REALTOR_SELECT` (Task 8)
- Produces: `POST /api/auth/dev` → `RealtorProfile` + cookie

- [ ] **Step 1: e2e testni yozish**

`apps/api/test/auth-dev.e2e-spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SESSION_COOKIE } from '../src/auth/cookie';
import { configureApp } from '../src/bootstrap';

const DEV_SECRET = 'dev-login-secret';
const TG_ID = 990002;

describe('Dev login (e2e)', () => {
  let app: NestExpressApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-jwt-secret-at-least-16';
    process.env.DEV_LOGIN_SECRET = DEV_SECRET;

    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await prisma.realtor.deleteMany({ where: { tgId: BigInt(TG_ID) } });
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /api/auth/dev → profile and a session cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/dev')
      .send({ secret: DEV_SECRET, tgId: TG_ID, name: 'Dev Rieltor' })
      .expect(201);

    expect(res.body.name).toBe('Dev Rieltor');
    expect(res.headers['set-cookie'][0]).toContain(`${SESSION_COOKIE}=`);
  });

  it('rejects a wrong secret', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/dev')
      .send({ secret: 'yolg‘on', tgId: TG_ID })
      .expect(401);
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run --config vitest.config.e2e.ts test/auth-dev.e2e-spec.ts`
Expected: FAIL — 404.

- [ ] **Step 3: Kontrollerni yozish**

`apps/api/src/auth-dev/auth-dev.controller.ts`:

```ts
import { Body, Controller, Post, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import type { Response } from 'express';
import type { RealtorProfile } from '@rieltor/shared';
import * as z from 'zod';
import { REALTOR_SELECT } from '../auth/realtor-select';
import { AuthService } from '../auth/auth.service';
import { serializeSessionCookie } from '../auth/cookie';
import { SESSION_TTL_SEC, signSession } from '../auth/session-token';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

const DevLoginSchema = z.object({
  secret: z.string(),
  tgId: z.coerce.number().int().positive(),
  name: z.string().min(2).default('Dev Rieltor'),
});

class DevLoginDto extends createZodDto(DevLoginSchema) {}

/**
 * Local development and Playwright only: the Telegram widget needs a domain
 * registered with BotFather, which localhost cannot have. AuthDevModule is only
 * registered outside production and only when DEV_LOGIN_SECRET is set (app.module.ts),
 * so this route does not exist in a production build.
 */
@ApiExcludeController()
@Controller('auth')
export class AuthDevController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('dev')
  async devLogin(
    @Body() body: DevLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RealtorProfile> {
    const expected = this.config.get('DEV_LOGIN_SECRET', { infer: true });
    const secret = this.config.get('JWT_SECRET', { infer: true });
    if (!expected || !secret || body.secret !== expected) {
      throw new UnauthorizedException('Dev login siri mos kelmadi');
    }

    const { id } = await this.auth.upsertFromTelegram({
      id: body.tgId,
      first_name: body.name,
      auth_date: Math.floor(Date.now() / 1000),
      hash: '0'.repeat(64),
    });

    const token = signSession(id, secret, Math.floor(Date.now() / 1000));
    res.setHeader('set-cookie', serializeSessionCookie(token, SESSION_TTL_SEC, false));

    return this.prisma.realtor.findUniqueOrThrow({ where: { id }, select: REALTOR_SELECT });
  }
}
```

- [ ] **Step 4: Modulni yozib, `app.module.ts` ga shartli ulash**

`apps/api/src/auth-dev/auth-dev.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthDevController } from './auth-dev.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AuthDevController],
})
export class AuthDevModule {}
```

`apps/api/src/app.module.ts` — import va shartli ro'yxat:

```ts
import { AuthDevModule } from './auth-dev/auth-dev.module';
```

```ts
    AuthModule,
    // Never in production: the module is not even constructed there (spec §7.2).
    ...(process.env.NODE_ENV !== 'production' && process.env.DEV_LOGIN_SECRET
      ? [AuthDevModule]
      : []),
    SsrModule,
```

- [ ] **Step 5: Testni ishga tushirish**

Run: `yarn workspace @rieltor/api vitest run --config vitest.config.e2e.ts test/auth-dev.e2e-spec.ts`
Expected: PASS — 2 ta holat.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/auth-dev apps/api/src/app.module.ts apps/api/test/auth-dev.e2e-spec.ts
git commit -m "feat(auth): add a development-only login endpoint"
```

---

### Task 11: `GET|PATCH /api/me`

**Files:**

- Create: `apps/api/src/realtors/realtors.service.ts`
- Create: `apps/api/src/realtors/realtors.controller.ts`
- Create: `apps/api/src/realtors/realtors.dto.ts`
- Create: `apps/api/src/realtors/realtors.module.ts`
- Create: `apps/api/test/me.e2e-spec.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**

- Consumes: `RealtorGuard`, `CurrentRealtor` (Task 9), `REALTOR_SELECT` (Task 8), `RealtorProfileUpdateSchema` (Task 2)
- Produces:
  - `GET /api/me` → `RealtorProfile`
  - `PATCH /api/me` → `RealtorProfile`

- [ ] **Step 1: e2e testni yozish**

`apps/api/test/me.e2e-spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { configureApp } from '../src/bootstrap';

const DEV_SECRET = 'dev-login-secret';
const TG_ID = 990003;

describe('Me (e2e)', () => {
  let app: NestExpressApplication;
  let cookie: string;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-jwt-secret-at-least-16';
    process.env.DEV_LOGIN_SECRET = DEV_SECRET;

    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/auth/dev')
      .send({ secret: DEV_SECRET, tgId: TG_ID, name: 'Me Rieltor' })
      .expect(201);
    cookie = login.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await prisma.realtor.deleteMany({ where: { tgId: BigInt(TG_ID) } });
    await prisma.$disconnect();
    await app.close();
  });

  it('GET /api/me without a cookie → 401', async () => {
    await request(app.getHttpServer()).get('/api/me').expect(401);
  });

  it('GET /api/me with a session → the profile', async () => {
    const res = await request(app.getHttpServer()).get('/api/me').set('cookie', cookie).expect(200);
    expect(res.body.name).toBe('Me Rieltor');
    expect(res.body.phone).toBeNull();
    expect(res.body.trusted).toBe(false);
  });

  it('PATCH /api/me saves the profile fields', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/me')
      .set('cookie', cookie)
      .send({ phone: '+998901234567', agency: "Toshkent Ko'chmas Mulk", name: 'Me Valiyev' })
      .expect(200);

    expect(res.body.phone).toBe('+998901234567');
    expect(res.body.agency).toBe("Toshkent Ko'chmas Mulk");
    expect(res.body.name).toBe('Me Valiyev');
  });

  it('PATCH /api/me rejects a malformed phone number', async () => {
    await request(app.getHttpServer())
      .patch('/api/me')
      .set('cookie', cookie)
      .send({ phone: '901234567' })
      .expect(400);
  });

  it('PATCH /api/me without a cookie → 401', async () => {
    await request(app.getHttpServer()).patch('/api/me').send({ name: 'Hech kim' }).expect(401);
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run --config vitest.config.e2e.ts test/me.e2e-spec.ts`
Expected: FAIL — 404.

- [ ] **Step 3: Servis va DTO'larni yozish**

`apps/api/src/realtors/realtors.dto.ts`:

```ts
import { createZodDto } from 'nestjs-zod';
import { RealtorProfileUpdateSchema } from '@rieltor/shared';

// The response DTO already exists in auth.dto.ts — re-exported, not redefined, so
// Swagger shows one schema instead of two identical ones.
export { RealtorProfileDto } from '../auth/auth.dto';

export class RealtorProfileUpdateDto extends createZodDto(RealtorProfileUpdateSchema) {}
```

`apps/api/src/realtors/realtors.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { RealtorProfile, RealtorProfileUpdate } from '@rieltor/shared';
import { REALTOR_SELECT } from '../auth/realtor-select';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RealtorsService {
  constructor(private readonly prisma: PrismaService) {}

  profile(realtorId: string): Promise<RealtorProfile> {
    return this.prisma.realtor.findUniqueOrThrow({
      where: { id: realtorId },
      select: REALTOR_SELECT,
    });
  }

  /**
   * Only the keys the request actually sent are written, so a form that submits
   * one field cannot blank the rest.
   */
  updateProfile(realtorId: string, patch: RealtorProfileUpdate): Promise<RealtorProfile> {
    return this.prisma.realtor.update({
      where: { id: realtorId },
      data: patch,
      select: REALTOR_SELECT,
    });
  }
}
```

- [ ] **Step 4: Kontroller va modulni yozib, `app.module.ts` ga ulash**

`apps/api/src/realtors/realtors.controller.ts`:

```ts
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { RealtorProfile } from '@rieltor/shared';
import { CurrentRealtor } from '../auth/current-realtor.decorator';
import { RealtorGuard } from '../auth/realtor.guard';
import { RealtorProfileDto, RealtorProfileUpdateDto } from './realtors.dto';
import { RealtorsService } from './realtors.service';

@ApiTags('me')
@Controller('me')
@UseGuards(RealtorGuard)
@ApiUnauthorizedResponse({ description: 'Sessiya topilmadi' })
export class RealtorsController {
  constructor(private readonly realtors: RealtorsService) {}

  @Get()
  @ApiOkResponse({ type: RealtorProfileDto })
  profile(@CurrentRealtor() realtorId: string): Promise<RealtorProfile> {
    return this.realtors.profile(realtorId);
  }

  @Patch()
  @ApiOkResponse({ type: RealtorProfileDto })
  update(
    @CurrentRealtor() realtorId: string,
    @Body() body: RealtorProfileUpdateDto,
  ): Promise<RealtorProfile> {
    return this.realtors.updateProfile(realtorId, body);
  }
}
```

`apps/api/src/realtors/realtors.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtorsController } from './realtors.controller';
import { RealtorsService } from './realtors.service';

@Module({
  imports: [PrismaModule],
  controllers: [RealtorsController],
  providers: [RealtorsService],
  exports: [RealtorsService],
})
export class RealtorsModule {}
```

`apps/api/src/app.module.ts` — import va `imports` ro'yxatiga `RealtorsModule` (AuthModule'dan keyin).

- [ ] **Step 5: Testni ishga tushirish**

Run: `yarn workspace @rieltor/api vitest run --config vitest.config.e2e.ts test/me.e2e-spec.ts`
Expected: PASS — 5 ta holat.

- [ ] **Step 6: Butun API testini ishga tushirish**

Run: `yarn workspace @rieltor/api test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/realtors apps/api/src/app.module.ts apps/api/test/me.e2e-spec.ts
git commit -m "feat(api): add the realtor profile endpoints"
```

---

### Task 12: Frontend API klientida `body` qo'llab-quvvatlash

**Files:**

- Modify: `apps/web/src/shared/api/client.ts`
- Modify: `apps/web/src/shared/api/client.test.ts`

**Interfaces:**

- Consumes: —
- Produces:
  - `apiGet<T>(path, schema)` — o'zgarmaydi
  - `apiPost<T>(path, schema, body?)` — uchinchi ixtiyoriy argument
  - `apiPatch<T>(path, schema, body)`

- [ ] **Step 1: Testni yozish**

`apps/web/src/shared/api/client.test.ts` ichiga (mavjud holatlar tegilmaydi):

```ts
const okSchema = z.object({ ok: z.boolean() });

/** Typed on purpose: the assertions below read the RequestInit fetch was given. */
function spyFetch() {
  const mock = vi.fn(
    async (_path: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}

describe('request bodies', () => {
  it('sends a JSON body and content-type on POST', async () => {
    const mock = spyFetch();
    await apiPost('/api/echo', okSchema, { phone: '+998901234567' });

    const init = mock.mock.calls[0][1]!;
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ phone: '+998901234567' }));
    expect((init.headers as Record<string, string>)['content-type']).toBe('application/json');
  });

  it('omits the body and content-type when there is nothing to send', async () => {
    const mock = spyFetch();
    await apiPost('/api/ping', okSchema);

    const init = mock.mock.calls[0][1]!;
    expect(init.body).toBeUndefined();
    expect((init.headers as Record<string, string>)['content-type']).toBeUndefined();
  });

  it('sends PATCH with a body', async () => {
    const mock = spyFetch();
    await apiPatch('/api/me', okSchema, { name: 'Ali' });

    expect(mock.mock.calls[0][1]!.method).toBe('PATCH');
  });
});
```

Faylning yuqorisidagi importga `apiPatch` va `apiPost` qo'shiladi (`z` allaqachon import qilingan).

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/web vitest run src/shared/api/client.test.ts`
Expected: FAIL — `apiPatch is not exported`.

- [ ] **Step 3: Klientni kengaytirish**

`apps/web/src/shared/api/client.ts` — `request` va eksportlar quyidagicha bo'ladi (`ApiError` klassi tegilmaydi):

```ts
type Method = 'GET' | 'POST' | 'PATCH';

async function request<T>(
  path: string,
  method: Method,
  schema: ZodType<T>,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';

  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(response.status, `${method} ${path} → ${response.status}`);
  }

  // parse() throws on a mismatched response, so the UI never works with malformed data.
  return schema.parse(await response.json());
}

export function apiGet<T>(path: string, schema: ZodType<T>): Promise<T> {
  return request(path, 'GET', schema);
}

export function apiPost<T>(path: string, schema: ZodType<T>, body?: unknown): Promise<T> {
  return request(path, 'POST', schema, body);
}

export function apiPatch<T>(path: string, schema: ZodType<T>, body: unknown): Promise<T> {
  return request(path, 'PATCH', schema, body);
}
```

- [ ] **Step 4: Testni ishga tushirish**

Run: `yarn workspace @rieltor/web test`
Expected: PASS — mavjud holatlar va 3 ta yangisi.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/shared/api/client.ts apps/web/src/shared/api/client.test.ts
git commit -m "feat(web): support request bodies in the API client"
```

---

### Task 13: `features/auth` — so'rovlar, hook va Telegram tugmasi

**Files:**

- Create: `apps/web/src/features/auth/api.ts`
- Create: `apps/web/src/features/auth/model/use-me.ts`
- Create: `apps/web/src/features/auth/ui/telegram-login-button.tsx`
- Create: `apps/web/src/features/auth/ui/telegram-login-button.test.tsx`
- Create: `apps/web/src/features/auth/index.ts`

**Interfaces:**

- Consumes: `apiGet`, `apiPost`, `apiPatch`, `ApiError` (Task 12); `RealtorProfileSchema`, `RealtorProfile`, `RealtorProfileUpdate` (Task 2)
- Produces:
  - `meQuery()` — TanStack `queryOptions`, `queryKey: ['me']`
  - `useMe(): { realtor: RealtorProfile | null; isLoading: boolean }`
  - `useLogout(): UseMutationResult`
  - `useUpdateProfile(): UseMutationResult<RealtorProfile, Error, RealtorProfileUpdate>`
  - `loginWithTelegram(payload: unknown): Promise<RealtorProfile>`
  - `<TelegramLoginButton />`

- [ ] **Step 1: Testni yozish**

`apps/web/src/features/auth/ui/telegram-login-button.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TelegramLoginButton } from './telegram-login-button';

function renderButton() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TelegramLoginButton />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  document.querySelectorAll('script').forEach((node) => node.remove());
});

describe('TelegramLoginButton', () => {
  it('injects the widget script configured for the bot', () => {
    vi.stubEnv('VITE_TG_BOT_USERNAME', 'rieltor_test_bot');
    const { container } = renderButton();

    const script = container.querySelector('script');
    expect(script).not.toBeNull();
    expect(script?.src).toContain('telegram.org/js/telegram-widget.js');
    expect(script?.getAttribute('data-telegram-login')).toBe('rieltor_test_bot');
    expect(script?.getAttribute('data-onauth')).toBe('onTelegramAuth(user)');
  });

  it('explains itself instead of rendering a dead widget when the bot is not configured', () => {
    vi.stubEnv('VITE_TG_BOT_USERNAME', '');
    const { container } = renderButton();

    expect(screen.getByText(/Telegram orqali kirish sozlanmagan/)).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });

  it('reports a failed login instead of swallowing the rejection', async () => {
    vi.stubEnv('VITE_TG_BOT_USERNAME', 'rieltor_test_bot');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('{}', { status: 500, headers: { 'content-type': 'application/json' } }),
      ),
    );
    renderButton();

    // The widget calls the global directly; act() lets the state update flush.
    await act(async () => {
      await window.onTelegramAuth?.({ id: 777000 });
    });

    expect(screen.getByText(/Kirishda xatolik/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/web vitest run src/features/auth`
Expected: FAIL — `Failed to resolve import "./telegram-login-button"`.

- [ ] **Step 3: `api.ts` ni yozish**

```ts
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RealtorProfileSchema,
  type RealtorProfile,
  type RealtorProfileUpdate,
} from '@rieltor/shared';
import * as z from 'zod';
import { ApiError, apiGet, apiPatch, apiPost } from '@/shared/api/client';

export const meQuery = () =>
  queryOptions({
    queryKey: ['me'] as const,
    queryFn: async (): Promise<RealtorProfile | null> => {
      try {
        return await apiGet('/api/me', RealtorProfileSchema);
      } catch (error) {
        // 401 is the normal "not signed in" answer, not a failure worth retrying.
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  });

export function loginWithTelegram(payload: unknown): Promise<RealtorProfile> {
  return apiPost('/api/auth/telegram', RealtorProfileSchema, payload);
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost('/api/auth/logout', z.object({ ok: z.literal(true) })),
    onSuccess: () => queryClient.setQueryData(['me'], null),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: RealtorProfileUpdate) => apiPatch('/api/me', RealtorProfileSchema, patch),
    onSuccess: (profile) => queryClient.setQueryData(['me'], profile),
  });
}
```

- [ ] **Step 4: `model/use-me.ts` ni yozish**

```ts
import { useQuery } from '@tanstack/react-query';
import type { RealtorProfile } from '@rieltor/shared';
import { meQuery } from '../api';

/** null means "not signed in" — an error state the UI does not need to distinguish. */
export function useMe(): { realtor: RealtorProfile | null; isLoading: boolean } {
  const { data, isLoading } = useQuery(meQuery());

  return { realtor: data ?? null, isLoading };
}
```

- [ ] **Step 5: `ui/telegram-login-button.tsx` ni yozish**

```tsx
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loginWithTelegram } from '../api';

const WIDGET_SRC = 'https://telegram.org/js/telegram-widget.js?22';

declare global {
  interface Window {
    onTelegramAuth?: (user: unknown) => void;
  }
}

/**
 * The widget is a third-party <script> that calls a global function with the signed
 * payload — there is no React-friendly API for it. The script is appended once per
 * mount and removed on unmount together with the global it needs.
 */
export function TelegramLoginButton() {
  const container = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState(false);
  // Read per render, not at module scope: a module-level const is captured once and
  // the tests (which stub the env after import) could never change it.
  const botUsername = import.meta.env.VITE_TG_BOT_USERNAME ?? '';

  useEffect(() => {
    if (!botUsername || !container.current) return;

    // The widget calls this global from a plain script snippet and never awaits it,
    // so a rejection here would be unhandled and a failed login would look like a
    // dead button.
    window.onTelegramAuth = async (user) => {
      try {
        setFailed(false);
        const profile = await loginWithTelegram(user);
        queryClient.setQueryData(['me'], profile);
      } catch {
        setFailed(true);
      }
    };

    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '14');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    container.current.appendChild(script);

    return () => {
      script.remove();
      delete window.onTelegramAuth;
    };
  }, [queryClient, botUsername]);

  if (!botUsername) {
    return (
      <p className="rounded-[14px] border border-line bg-surface px-4 py-3 text-[13px] font-semibold text-ink-3">
        Telegram orqali kirish sozlanmagan. Serverda <code>VITE_TG_BOT_USERNAME</code> ni
        to'ldiring.
      </p>
    );
  }

  return (
    <div>
      <div ref={container} />
      {failed && (
        <p className="mt-2 text-[13px] font-bold text-red-600">
          Kirishda xatolik. Birozdan so'ng qayta urinib ko'ring.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 6: `index.ts` va `apps/web/.env.example` ni yozish**

`apps/web/src/features/auth/index.ts`:

```ts
export { loginWithTelegram, meQuery, useLogout, useUpdateProfile } from './api';
export { useMe } from './model/use-me';
export { TelegramLoginButton } from './ui/telegram-login-button';
```

`apps/web/.env.example` (yangi fayl — Vite build vaqtida o'qiydi):

```bash
# BotFather'dagi bot username'i, @ belgisisiz. Bo'sh bo'lsa kabinetda
# "Telegram orqali kirish sozlanmagan" xabari chiqadi va sayt avvalgidek ishlaydi.
VITE_TG_BOT_USERNAME=
```

- [ ] **Step 7: Testni ishga tushirish**

Run: `yarn workspace @rieltor/web test`
Expected: PASS — 2 ta yangi holat va barcha mavjudlari.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/features/auth
git commit -m "feat(web): add the auth feature slice"
```

---

### Task 14: Kabinet sahifasi

**Files:**

- Create: `apps/web/src/pages/cabinet/ui/cabinet-page.tsx`
- Create: `apps/web/src/pages/cabinet/ui/cabinet-page.test.tsx`
- Create: `apps/web/src/pages/cabinet/index.ts`

**Interfaces:**

- Consumes: `useMe`, `useLogout`, `TelegramLoginButton` (Task 13); `SectionCard`, `PageHeading`, `Icon` (`@/shared/ui/*`)
- Produces: `<CabinetPage />`, `pages/cabinet` public API

- [ ] **Step 1: Testni yozish**

`apps/web/src/pages/cabinet/ui/cabinet-page.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CabinetPage } from './cabinet-page';

const profile = {
  id: 'rlt_1',
  name: 'Ali Valiyev',
  username: 'ali-valiyev',
  photoUrl: null,
  phone: null,
  phoneVerified: false,
  agency: null,
  registryNo: null,
  trusted: false,
};

function stubMe(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status,
          headers: { 'content-type': 'application/json' },
        }),
    ),
  );
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CabinetPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('CabinetPage', () => {
  it('asks an anonymous visitor to sign in', async () => {
    vi.stubEnv('VITE_TG_BOT_USERNAME', 'rieltor_test_bot');
    stubMe(401, { message: 'Sessiya topilmadi' });
    renderPage();

    expect(await screen.findByText(/Rieltor kabineti/)).toBeInTheDocument();
    expect(screen.queryByText('Ali Valiyev')).not.toBeInTheDocument();
  });

  it('shows the profile and warns about the missing phone number', async () => {
    stubMe(200, profile);
    renderPage();

    expect(await screen.findByText('Ali Valiyev')).toBeInTheDocument();
    expect(screen.getByText(/Telefon raqami kiritilmagan/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Profilni tahrirlash/ })).toHaveAttribute(
      'href',
      '/cabinet/profile',
    );
  });

  it('drops the warning once a phone number is saved', async () => {
    stubMe(200, { ...profile, phone: '+998901234567' });
    renderPage();

    expect(await screen.findByText('Ali Valiyev')).toBeInTheDocument();
    expect(screen.queryByText(/Telefon raqami kiritilmagan/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/web vitest run src/pages/cabinet`
Expected: FAIL — `Failed to resolve import "./cabinet-page"`.

- [ ] **Step 3: Sahifani yozish**

`apps/web/src/pages/cabinet/ui/cabinet-page.tsx`:

```tsx
import { Link } from 'react-router';
import { TelegramLoginButton, useLogout, useMe } from '@/features/auth';
import { Icon } from '@/shared/ui/icon';
import { PageHeading } from '@/shared/ui/page-heading';
import { SectionCard } from '@/shared/ui/section-card';

export function CabinetPage() {
  const { realtor, isLoading } = useMe();
  const logout = useLogout();

  if (isLoading) {
    return (
      <main className="px-4 py-6">
        <p className="text-[14px] font-semibold text-ink-3">Yuklanmoqda…</p>
      </main>
    );
  }

  if (!realtor) {
    return (
      <main className="px-4 py-6">
        <PageHeading
          title="Rieltor kabineti"
          subtitle="O'z e'lonlaringizni joylash uchun Telegram orqali kiring — parol yoki SMS kerak emas."
        />
        <div className="mt-4">
          <TelegramLoginButton />
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-6">
      <PageHeading title="Rieltor kabineti" subtitle="Profilingiz va e'lonlaringiz" />

      <SectionCard className="mt-4">
        <div className="flex items-center gap-3 py-2">
          {realtor.photoUrl ? (
            <img
              src={realtor.photoUrl}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
              <Icon name="homeSolid" className="h-5 w-5" strokeWidth={2.2} />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-extrabold">{realtor.name}</span>
            <span className="block text-xs font-semibold text-ink-3">@{realtor.username}</span>
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-telegram">
            <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
            Telegram
          </span>
        </div>
      </SectionCard>

      {!realtor.phone && (
        <p className="mt-3 rounded-[14px] border border-line bg-surface px-4 py-3 text-[13px] font-semibold text-ink-2">
          Telefon raqami kiritilmagan — e'lon joylash uchun u talab qilinadi.
        </p>
      )}

      <SectionCard className="mt-3 py-1">
        <Link to="/cabinet/profile" className="flex items-center gap-3 py-3.5">
          <span className="min-w-0 flex-1 text-[14.5px] font-bold">Profilni tahrirlash</span>
          <Icon name="chevronRight" className="h-4 w-4 text-ink-3" strokeWidth={2.4} />
        </Link>
      </SectionCard>

      <button
        type="button"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="mt-5 w-full rounded-[14px] border-[1.5px] border-line py-3.5 text-[15px] font-extrabold text-ink-2 disabled:opacity-60"
      >
        Chiqish
      </button>
    </main>
  );
}
```

- [ ] **Step 4: `index.ts` ni yozish**

```ts
export { CabinetPage } from './ui/cabinet-page';
```

- [ ] **Step 5: Testni ishga tushirish**

Run: `yarn workspace @rieltor/web vitest run src/pages/cabinet`
Expected: PASS — 3 ta holat.

`PageHeading` o'zida `px-4` beradi, shuning uchun `main` dagi gorizontal paddingni takrorlama: sarlavhadan keyingi bloklarni alohida `px-4` konteynerga o'ra yoki `main` ni `pb-8` bilan cheklab, ichki bloklarga `px-4` ber. Mavjud sahifalar (`/favorites`, `/contact`) qanday qilgan bo'lsa — shu naqshni takrorla, komponentlarning o'zini o'zgartirma.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/cabinet
git commit -m "feat(web): add the cabinet landing page"
```

---

### Task 15: Profil formasi

**Files:**

- Create: `apps/web/src/pages/cabinet/ui/profile-page.tsx`
- Create: `apps/web/src/pages/cabinet/ui/profile-page.test.tsx`
- Modify: `apps/web/src/pages/cabinet/index.ts`

**Interfaces:**

- Consumes: `useMe`, `useUpdateProfile` (Task 13); `PhoneSchema`, `RealtorProfileUpdateSchema` (Task 2)
- Produces: `<ProfilePage />`

- [ ] **Step 1: Testni yozish**

`apps/web/src/pages/cabinet/ui/profile-page.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfilePage } from './profile-page';

const profile = {
  id: 'rlt_1',
  name: 'Ali Valiyev',
  username: 'ali-valiyev',
  photoUrl: null,
  phone: null,
  phoneVerified: false,
  agency: null,
  registryNo: null,
  trusted: false,
};

function renderPage(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('ProfilePage', () => {
  it('fills the form from the current profile', async () => {
    renderPage(vi.fn(async () => jsonResponse(profile)));

    expect(await screen.findByLabelText('Ism')).toHaveValue('Ali Valiyev');
  });

  it('refuses to submit a malformed phone number', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(profile));
    renderPage(fetchMock);

    const phone = await screen.findByLabelText('Telefon');
    await userEvent.type(phone, '901234567');
    await userEvent.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(await screen.findByText(/\+998XXXXXXXXX/)).toBeInTheDocument();
    // Only the initial GET — nothing was sent.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends a PATCH with the edited fields', async () => {
    const fetchMock = vi.fn(async (_path: string, init?: RequestInit) =>
      jsonResponse(init?.method === 'PATCH' ? { ...profile, phone: '+998901234567' } : profile),
    );
    renderPage(fetchMock);

    await userEvent.type(await screen.findByLabelText('Telefon'), '+998901234567');
    await userEvent.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(await screen.findByText(/Saqlandi/)).toBeInTheDocument();
    const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(patchCall).toBeDefined();
    expect(JSON.parse(patchCall![1]!.body as string).phone).toBe('+998901234567');
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/web vitest run src/pages/cabinet/ui/profile-page.test.tsx`
Expected: FAIL — `Failed to resolve import "./profile-page"`.

- [ ] **Step 3: Sahifani yozish**

`apps/web/src/pages/cabinet/ui/profile-page.tsx`:

```tsx
import { type FormEvent, useEffect, useState } from 'react';
import { RealtorProfileUpdateSchema } from '@rieltor/shared';
import { useMe, useUpdateProfile } from '@/features/auth';
import { PageHeading } from '@/shared/ui/page-heading';
import { SectionCard } from '@/shared/ui/section-card';

interface FormState {
  name: string;
  phone: string;
  agency: string;
  registryNo: string;
}

const EMPTY: FormState = { name: '', phone: '', agency: '', registryNo: '' };

const FIELDS: { key: keyof FormState; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Ism', placeholder: 'Ali Valiyev' },
  { key: 'phone', label: 'Telefon', placeholder: '+998901234567' },
  { key: 'agency', label: 'Agentlik', placeholder: "Toshkent Ko'chmas Mulk" },
  { key: 'registryNo', label: 'Reestr raqami', placeholder: '00-0000' },
];

export function ProfilePage() {
  const { realtor } = useMe();
  const update = useUpdateProfile();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!realtor) return;
    setForm({
      name: realtor.name,
      phone: realtor.phone ?? '',
      agency: realtor.agency ?? '',
      registryNo: realtor.registryNo ?? '',
    });
  }, [realtor]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);

    // Empty optional fields are sent as null so the server clears them; phone is
    // only sent when filled, because it cannot be cleared once set.
    const patch = {
      name: form.name,
      ...(form.phone ? { phone: form.phone } : {}),
      agency: form.agency || null,
      registryNo: form.registryNo || null,
    };

    const parsed = RealtorProfileUpdateSchema.safeParse(patch);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri");
      return;
    }

    setError(null);
    update.mutate(parsed.data, { onSuccess: () => setSaved(true) });
  }

  return (
    <main className="px-4 py-6">
      <PageHeading title="Profil" subtitle="Bu ma'lumotlar e'lon sahifasida ko'rinadi" />

      <form onSubmit={submit} className="mt-4">
        <SectionCard>
          {FIELDS.map((field) => (
            <label key={field.key} className="block py-2">
              <span className="mb-1 block text-xs font-bold text-ink-3">{field.label}</span>
              <input
                value={form[field.key]}
                placeholder={field.placeholder}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
                className="w-full rounded-[12px] border border-line bg-card px-3 py-2.5 text-[15px] font-semibold"
              />
            </label>
          ))}
        </SectionCard>

        {error && <p className="mt-3 text-[13px] font-bold text-red-600">{error}</p>}
        {saved && !error && <p className="mt-3 text-[13px] font-bold text-emerald-600">Saqlandi</p>}

        <button
          type="submit"
          disabled={update.isPending}
          className="mt-5 w-full rounded-[14px] bg-accent py-3.5 text-[15px] font-extrabold text-white disabled:opacity-60"
        >
          Saqlash
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: `index.ts` ni to'ldirish**

```ts
export { CabinetPage } from './ui/cabinet-page';
export { ProfilePage } from './ui/profile-page';
```

- [ ] **Step 5: Testni ishga tushirish**

Run: `yarn workspace @rieltor/web test`
Expected: PASS — 3 ta yangi holat va barcha mavjudlari.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/cabinet
git commit -m "feat(web): add the realtor profile form"
```

---

### Task 16: Marshrutlarni ulash (SPA, SSR, Netlify, havolalar)

**Files:**

- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/api/src/ssr/routes.ts`
- Modify: `apps/api/test/ssr.e2e-spec.ts`
- Modify: `netlify.toml`
- Modify: `apps/web/src/widgets/site-header/ui/site-header.tsx`
- Modify: `apps/web/src/pages/contact/ui/contact-page.tsx`

**Interfaces:**

- Consumes: `CabinetPage`, `ProfilePage` (Tasks 14–15)
- Produces: `/cabinet` va `/cabinet/profile` marshrutlari — SPA'da, SSR qobig'ida va Netlify'da

- [ ] **Step 1: SSR e2e testiga yangi holat qo'shish**

`apps/api/test/ssr.e2e-spec.ts` ichidagi mavjud `describe` blokiga (mavjud holatlar tegilmaydi):

```ts
it.each(['/cabinet', '/cabinet/profile'])('GET %s → the SPA shell with a 200', async (path) => {
  const res = await request(app.getHttpServer()).get(path).expect(200);
  expect(res.headers['content-type']).toContain('text/html');
  expect(res.text).toContain('<div id="root"></div>');
});
```

Agar mavjud testda qobiq boshqa marker bilan tekshirilsa — o'sha markerni ishlat.

- [ ] **Step 2: Testni ishga tushirib, yiqilishini ko'rish**

Run: `yarn workspace @rieltor/api vitest run --config vitest.config.e2e.ts test/ssr.e2e-spec.ts`
Expected: FAIL — `/cabinet` uchun 404.

- [ ] **Step 3: `SPA_ROUTES` ro'yxatini to'ldirish**

`apps/api/src/ssr/routes.ts`:

```ts
export const SPA_ROUTES = [
  'search',
  'favorites',
  'contact',
  'offer',
  'cabinet',
  'cabinet/profile',
] as const;
```

- [ ] **Step 4: Testni ishga tushirish**

Run: `yarn workspace @rieltor/api vitest run --config vitest.config.e2e.ts test/ssr.e2e-spec.ts`
Expected: PASS.

- [ ] **Step 5: SPA router'iga marshrutlarni qo'shish**

`apps/web/src/app/router.tsx` — import va `TabLayout` bolalari ro'yxatiga (`/offer` dan keyin):

```tsx
import { CabinetPage, ProfilePage } from '@/pages/cabinet';
```

```tsx
          // Not in the bottom nav either — reached from the header link.
          { path: '/cabinet', element: <CabinetPage /> },
          { path: '/cabinet/profile', element: <ProfilePage /> },
```

- [ ] **Step 6: Netlify rewrite'larini qo'shish**

`netlify.toml` — "SPA shell routes" bo'limiga, `/offer` blokidan keyin:

```toml
[[redirects]]
  from = "/cabinet"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/cabinet/profile"
  to = "/index.html"
  status = 200
```

- [ ] **Step 7: Header va aloqa sahifasiga havola qo'shish**

`apps/web/src/widgets/site-header/ui/site-header.tsx` — "Toshkent" yorlig'idan oldin, `Link` importi bilan birga:

```tsx
<Link to="/cabinet" className="ml-auto mr-2 text-[13px] font-bold text-accent">
  Rieltor uchun
</Link>
```

`apps/web/src/pages/contact/ui/contact-page.tsx` — "Ommaviy oferta" `SectionCard` idan keyin:

```tsx
<SectionCard className="py-1">
  <Link to="/cabinet" className="flex items-center gap-3 py-3.5">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
      <Icon name="homeSolid" className="h-5 w-5" strokeWidth={2.2} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-[14.5px] font-bold">Rieltor uchun</span>
      <span className="block text-xs font-semibold text-ink-3">O'z e'lonlaringizni joylang</span>
    </span>
    <Icon name="chevronRight" className="h-4 w-4 text-ink-3" strokeWidth={2.4} />
  </Link>
</SectionCard>
```

- [ ] **Step 8: To'liq tekshiruv**

Run:

```bash
yarn format && yarn lint && yarn typecheck && yarn build && yarn test
```

Expected: hammasi PASS. `boundaries` qoidasi buzilmasligi kerak — `pages/cabinet` faqat `features` va `shared` dan import qiladi.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/app/router.tsx apps/api/src/ssr/routes.ts apps/api/test/ssr.e2e-spec.ts netlify.toml apps/web/src/widgets/site-header apps/web/src/pages/contact
git commit -m "feat(web): wire the cabinet routes into the app shell"
```

---

### Task 17: Playwright e2e — dev-login orqali kabinet

**Files:**

- Create: `docker-compose.e2e.yml`
- Create: `e2e/cabinet.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: `POST /api/auth/dev` (Task 10), `/cabinet` (Task 16)
- Produces: 360px viewport'da kabinet oqimi uchun regressiya to'ri

- [ ] **Step 1: e2e overlay faylini yozish**

`docker-compose.e2e.yml`:

```yaml
# Overlay used only by the Playwright run:
#   docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
#
# NODE_ENV=test does two things the browser test needs: it registers the dev-login
# module, and it drops the Secure flag from the session cookie, which a browser would
# otherwise refuse to store over plain http://localhost.
services:
  app:
    environment:
      NODE_ENV: test
      JWT_SECRET: e2e-jwt-secret-at-least-16
      DEV_LOGIN_SECRET: e2e-dev-login-secret
```

- [ ] **Step 2: Playwright testini yozish**

`e2e/cabinet.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const DEV_SECRET = 'e2e-dev-login-secret';

test.describe('Cabinet (360px)', () => {
  test('an anonymous visitor is asked to sign in', async ({ page }) => {
    await page.goto('/cabinet');
    await expect(page.getByRole('heading', { name: 'Rieltor kabineti' })).toBeVisible();
  });

  test('a signed-in realtor sees their profile and can edit it', async ({ page, context }) => {
    const response = await context.request.post('/api/auth/dev', {
      data: { secret: DEV_SECRET, tgId: 990100, name: 'E2e Rieltor' },
    });
    expect(response.status()).toBe(201);

    await page.goto('/cabinet');
    await expect(page.getByText('E2e Rieltor')).toBeVisible();
    await expect(page.getByText(/Telefon raqami kiritilmagan/)).toBeVisible();

    await page.getByRole('link', { name: /Profilni tahrirlash/ }).click();
    await page.getByLabel('Telefon').fill('+998901234567');
    await page.getByRole('button', { name: 'Saqlash' }).click();
    await expect(page.getByText('Saqlandi')).toBeVisible();

    await page.goto('/cabinet');
    await expect(page.getByText(/Telefon raqami kiritilmagan/)).toHaveCount(0);
  });

  test('there is no horizontal scroll', async ({ page }) => {
    await page.goto('/cabinet');
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });
});
```

- [ ] **Step 3: CI ish oqimini overlay bilan ko'tarish**

`.github/workflows/ci.yml` dagi "Stack'ni ko'tarish" qadamining `run` qatori:

```yaml
run: docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
```

- [ ] **Step 4: Stack'ni lokal ko'tarib, testni ishga tushirish**

Run:

```bash
SEED_AGENT_TEL='+998901234567' SEED_AGENT_TG='test' \
  docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
until curl -sf http://localhost:3000/api/health > /dev/null; do sleep 2; done
yarn e2e
```

Expected: barcha Playwright testlari (mavjud `listing-page.spec.ts` va yangi `cabinet.spec.ts`) PASS.

- [ ] **Step 5: Stack'ni to'xtatish**

Run: `docker compose -f docker-compose.yml -f docker-compose.e2e.yml down`

- [ ] **Step 6: Commit**

```bash
git add docker-compose.e2e.yml e2e/cabinet.spec.ts .github/workflows/ci.yml
git commit -m "test(e2e): cover the cabinet sign-in flow"
```

---

### Task 18: Bosqichni yakunlash — to'liq tekshiruv va hujjat

**Files:**

- Modify: `docs/project-overview.md`

**Interfaces:**

- Consumes: 1–17 tasklar natijasi
- Produces: yangilangan loyiha tavsifi

- [ ] **Step 1: To'liq quvurni ishga tushirish**

Run:

```bash
yarn format:check && yarn lint && yarn typecheck && yarn build && yarn test
```

Expected: hammasi PASS. Biror qadam yiqilsa — sababini tuzatib, qaytadan ishga tushir.

- [ ] **Step 2: Anonim foydalanuvchi regressiyasini qo'lda tekshirish**

Run: `yarn workspace @rieltor/api dev` (yoki docker stack) va brauzerda `/`, `/search`, `/obj/bx-002`, `/favorites`, `/contact`, `/offer` sahifalarini och.
Expected: barchasi loginsiz avvalgidek ochiladi; header'da "Rieltor uchun" havolasi ko'rinadi.

- [ ] **Step 3: Kabinet o'chirilgan holatni tekshirish**

Run: `JWT_SECRET` va `TELEGRAM_BOT_TOKEN` siz serverni ko'tarib, `curl -i -X POST localhost:3000/api/auth/telegram -H 'content-type: application/json' -d '{}'`
Expected: 400 yoki 503 — ilova yiqilmaydi, ommaviy sahifalar ishlayveradi.

- [ ] **Step 4: `project-overview.md` ni yangilash**

"Funksiyalar ro'yxati" bo'limidagi "Foydalanuvchi ko'radigan qism" ro'yxatiga:

```markdown
- **Rieltor kabineti (`/cabinet`)** — Telegram orqali kirish, profil (ism, telefon, agentlik,
  reestr raqami) va chiqish. Kabinet faqat `TELEGRAM_BOT_TOKEN` va `JWT_SECRET` berilganda
  yoqiladi; ular bo'lmasa sayt avvalgidek anonim rejimda ishlaydi.
```

"Server tomonidagi qism" jadvaliga:

```markdown
| `POST /api/auth/telegram` | Telegram Login Widget imzosini tekshirib sessiya beradi |
| `POST /api/auth/logout` | Sessiya cookie'sini tozalaydi |
| `GET|PATCH /api/me` | Rieltor profili (faqat sessiya bilan) |
```

- [ ] **Step 5: Commit**

```bash
git add docs/project-overview.md
git commit -m "docs: describe the realtor cabinet in the project overview"
```

---

## Bosqich DoD

- [ ] Telegram login → cookie → `GET /api/me` zanjiri ishlaydi (e2e bilan qoplangan)
- [ ] Dev-login faqat `NODE_ENV !== production` va `DEV_LOGIN_SECRET` bilan mavjud
- [ ] HMAC tekshiruvi to'g'ri hash, buzilgan hash va eski `auth_date` uchun testlangan
- [ ] Anonim foydalanuvchi uchun barcha eski sahifalar va endpointlar o'zgarmagan
- [ ] Mavjud testlar to'liq yashil, ularning hech biri o'zgartirilmagan
- [ ] Migratsiyada `DROP`/`ALTER COLUMN` yo'q
- [ ] `format → lint → typecheck → build → test` va `yarn e2e` yashil
