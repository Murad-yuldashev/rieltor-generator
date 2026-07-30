# Rieltor Generator — Implementatsiya rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rieltor uchun bitta ko'chmas mulk obyektining mobil sahifasini quradi; sahifa havolasi Telegram'ga tashlanganda rasm + sarlavha + narx bilan preview chiqadi.

**Architecture:** Yarn 4 monorepo — `apps/web` (React 19 + Vite SPA), `apps/api` (NestJS 11 + Prisma + Postgres), `packages/shared` (Zod sxemalar = front va back uchun yagona tip manbasi). Prod'da NestJS bitta konteynerda API'ni ham, statik front'ni ham serve qiladi va `/obj/:id` so'roviga `index.html` ning `<head>` iga OG teglarini server tomonda inject qiladi — SPA bo'lishiga qaramay Telegram preview ishlaydi.

**Tech Stack:** Node 22 LTS · Yarn 4 · Turborepo · TypeScript · React 19 · Vite · Tailwind CSS v4 · React Router v7 · TanStack Query v5 · NestJS 11 · Prisma · PostgreSQL 16 · Zod v4 + nestjs-zod · sharp · Vitest + React Testing Library + supertest · Playwright · Docker · GitHub Actions

**Spec:** [2026-07-28-rieltor-generator-design.md](../specs/2026-07-28-rieltor-generator-design.md)

---

## Global Constraints

Bu bo'lim har bir taskning talablariga kiradi.

- **Node.js 22 LTS**, **Yarn 4** (npm ishlatilmaydi). Har bir `yarn add` workspace ichida `yarn workspace <nom>` bilan bajariladi. `.yarnrc.yml` `nodeLinker: node-modules` ni ataylab o'rnatadi — Yarn'ning standart Plug'n'Play rejimi Prisma'ning generatsiya qilingan klientini va `sharp`'ning native binarylarini buzadi; keyingi hech qanday task buni PnP'ga "modernizatsiya" qilmasligi kerak.
- **UI matnlari o'zbekcha.** Kod identifikatorlari ham o'zbekcha domen atamalarida (`sarlavha`, `narxSom`, `xona`, `qavat`, `tuman`, `moljal`, `tavsif`, `rasmlar`, `turi`, `tartib`) — bu spec §3 modelidan keladi.
- **Narx formati:** `480 000 000 so'm` va `$40 000` — uch xonadan **oddiy probel** (ASCII ` `) bilan ajratiladi. `so'm` ASCII apostrof bilan yoziladi.
- **Mobil-first:** 360px kenglikda mukammal; desktopda kontent `max-width: 480px` markazda.
- **Urg'u rang:** `#1D4ED8` — faqat `apps/web/src/app/index.css` dagi `@theme` blokida `--color-accent` sifatida. Komponentlarda hech qachon hex yozilmaydi, faqat `bg-accent` / `text-accent`.
- **`narxSom` hech qachon `number` emas.** DB'da `BigInt`, API javobida va frontda `string`.
- **Zod v4** (`import * as z from 'zod'`). Barcha sxemalar faqat `packages/shared` da yashaydi — `apps/web` va `apps/api` ularni import qiladi, o'zi qayta e'lon qilmaydi.
- **Test runner: Vitest** — uchala workspace'da ham. Jest ishlatilmaydi.
- **Har task oxirida commit.** Commit xabari o'zbekcha imperativ: `feat: ...`, `test: ...`, `chore: ...`.
- **Qamrovdan tashqarida** (spec §1): login, kiritish formasi, admin-panel, CRM, narx-radar, to'lovlar, xarita, ko'p til, chuqur SEO. Bulardan birortasi kerakdek tuyulsa — to'xta, spec'ga qara.

---

## Fayl tuzilishi

```
rieltor-app/
├─ package.json                    root skriptlar (turbo orqali) + "workspaces" massivi
├─ .yarnrc.yml
├─ turbo.json
├─ tsconfig.base.json              barcha workspace meros oladigan compilerOptions
├─ eslint.config.mjs               flat config, butun monorepo uchun
├─ .prettierrc
├─ docker-compose.yml              lokal postgres
├─ Dockerfile                      prod: web build → api imijiga
├─ .github/workflows/ci.yml
│
├─ packages/shared/src/
│  ├─ index.ts                     barrel
│  ├─ format.ts                    formatNarxSom, formatNarxUsd
│  ├─ images.ts                    IMAGE_WIDTHS, imageSrcSet, imageFallbackSrc, IMAGE_SIZES
│  └─ schemas.ts                   Agent/Rasm/Object/Views Zod sxemalari + tiplar
│
├─ apps/api/
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  ├─ images.ts                 sharp quvuri (seed va test ishlatadi)
│  │  ├─ seed-data.ts              3 obyekt + agent ma'lumoti (kod emas, data)
│  │  └─ seed.ts                   idempotent upsert + rasm quvuri
│  ├─ public/images/<id>/          quvur natijasi (git'ga kirmaydi)
│  └─ src/
│     ├─ main.ts                   bootstrap, Swagger, global pipe
│     ├─ app.module.ts
│     ├─ config/env.ts             Zod env validatsiyasi
│     ├─ prisma/prisma.service.ts
│     ├─ health/health.controller.ts
│     ├─ objects/                  service · controller · mapper
│     ├─ views/                    service · controller (throttler bilan)
│     └─ ssr/                      html-cache · meta-builder · controller
│
└─ apps/web/src/
   ├─ app/                         providers, router, index.css
   ├─ pages/                       home · object · not-found
   ├─ widgets/                     gallery · sticky-cta
   ├─ features/                    view-counter
   ├─ entities/                    object · agent
   └─ shared/                      ui · lib · api · config
```

**Chegara qoidasi:** yuqori qatlam faqat pastdagini import qiladi (`app → pages → widgets → features → entities → shared`). ESLint `eslint-plugin-boundaries` bilan majburlanadi (Task 9).

---

## Task 1: Monorepo poydevori va tooling

Eski `tsc`-only skeletni o'chirib, Yarn 4 workspace + Turborepo + lint/format/CI o'rnatiladi. Hali hech qanday app yo'q — bu taskning natijasi: `yarn install` va `yarn lint` toza ishlaydi, CI fayli mavjud.

**Files:**

- Create: `.yarnrc.yml`, `.yarn/releases/yarn-4.17.1.cjs`, `turbo.json`, `tsconfig.base.json`, `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `.husky/pre-commit`, `.github/workflows/ci.yml`
- Modify: `package.json`, `.gitignore`
- Delete: `src/index.ts`, `tsconfig.json`

**Interfaces:**

- Consumes: —
- Produces: root skriptlar `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build` — hammasi `turbo run <task>` ga o'raladi. Har workspace o'z `package.json` ida shu nomdagi skriptni e'lon qiladi.

- [ ] **Step 1: Eski skeletni tozalash**

```bash
git rm -f --cached .DS_Store 2>/dev/null || true
rm -f .DS_Store src/index.ts tsconfig.json
rmdir src 2>/dev/null || true
```

`.gitignore` ni to'liq quyidagi bilan almashtir:

```gitignore
node_modules/
dist/
build/
.turbo/
coverage/
*.tsbuildinfo

.env
.env.local
.env.*.local

.DS_Store
.idea/workspace.xml

apps/api/public/images/
playwright-report/
test-results/

.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions
.pnp.*
```

- [ ] **Step 2: Yarn 4 faollashtirish, workspace va root package.json**

Corepack orqali Yarn 4 faollashtiriladi va versiya repoga committed holda saqlanadi (internetsiz `yarn install` ishlashi uchun `yarnPath` bilan ko'rsatilgan release fayl kerak):

```bash
corepack enable
corepack use yarn@4.17.1
```

Bu buyruq `.yarn/releases/yarn-4.17.1.cjs` ni yaratadi — u git'ga committed qilinadi (yuqoridagi `.gitignore` da `!.yarn/releases` shu fayl uchun ochiq qoldirilgan).

`.yarnrc.yml`:

```yaml
nodeLinker: node-modules

yarnPath: .yarn/releases/yarn-4.17.1.cjs
```

> **Diqqat:** `nodeLinker: node-modules` ataylab tanlangan — Yarn'ning standart Plug'n'Play rejimi Prisma'ning generatsiya qilingan klientini va `sharp`'ning native binarylarini buzadi (ikkalasi ham keyingi tasklarda ishlatiladi). Buni PnP'ga o'zgartirma.

Alohida workspace-fayli kerak emas — workspace'lar root `package.json` da e'lon qilinadi.

`package.json` (to'liq almashtir):

```json
{
  "name": "rieltor-app",
  "private": true,
  "packageManager": "yarn@4.17.1+sha512.ccbfabf7d7b6b32075088be9386fb9a2e00bb6887ef07fa56effabc890a56d53da1ccc4128d62db245fcbd3961b236d75335bdf7d5320ed6eafb7588b7ad4697",
  "engines": {
    "node": ">=22"
  },
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "eslint": "^9.17.0",
    "husky": "^9.1.7",
    "lint-staged": "^15.3.0",
    "prettier": "^3.4.2",
    "turbo": "^2.3.3",
    "typescript": "^5.7.2",
    "typescript-eslint": "^8.19.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx,json,css,md,yml,yaml}": "prettier --write"
  }
}
```

- [ ] **Step 3: Turborepo va TypeScript bazasi**

`turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 4: ESLint va Prettier**

`eslint.config.mjs` (ildizdagi `package.json` da `"type": "module"` yo'q, shuning uchun `.mjs`):

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
```

`.prettierrc`:

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "semi": true
}
```

`.prettierignore`:

```
yarn.lock
.superpowers/
```

- [ ] **Step 5: O'rnatish va husky**

```bash
yarn install
yarn husky init
```

`.husky/pre-commit` ichini almashtir:

```sh
yarn lint-staged
```

- [ ] **Step 6: CI workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push: { branches: [main, master] }
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: rieltor
          POSTGRES_PASSWORD: rieltor
          POSTGRES_DB: rieltor
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    env:
      DATABASE_URL: postgresql://rieltor:rieltor@localhost:5432/rieltor
      PUBLIC_BASE_URL: http://localhost:3000
    steps:
      - uses: actions/checkout@v4
      - run: corepack enable
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: yarn }
      - run: yarn install --immutable
      - run: yarn format:check
      - run: yarn lint
      - run: yarn typecheck
      - run: yarn build
      - run: yarn test
```

- [ ] **Step 7: Tekshirish**

```bash
yarn install && yarn lint && yarn prettier --check . && yarn turbo run build
```

Kutilgan: hammasi 0 kod bilan tugaydi (workspace hali bo'sh — turbo "No tasks were executed" deydi, bu normal).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: Yarn 4 monorepo, Turborepo, ESLint/Prettier, Husky va CI poydevori"
```

---

## Task 2: `packages/shared` — Zod sxemalar va formatterlar

Front va back uchun yagona tip manbasi. Bu yerda TDD to'liq qo'llanadi: format funksiyalari sof, testi oson.

**Files:**

- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/vitest.config.ts`
- Create: `packages/shared/src/index.ts`, `format.ts`, `format.test.ts`, `images.ts`, `images.test.ts`, `schemas.ts`, `schemas.test.ts`

**Interfaces:**

- Consumes: `tsconfig.base.json` (Task 1)
- Produces — barcha keyingi tasklar shulardan foydalanadi:
  - `formatNarxSom(narxSom: string): string`
  - `formatNarxUsd(narxUsd: number): string`
  - `IMAGE_WIDTHS: readonly [360, 720, 1200]`
  - `IMAGE_SIZES: string`
  - `imageSrcSet(base: string): string`
  - `imageFallbackSrc(base: string): string`
  - `AgentSchema`, `RasmSchema`, `ObjectTuriSchema`, `ObjectListItemSchema`, `ObjectDetailSchema`, `ViewsSchema`
  - tiplar: `Agent`, `Rasm`, `ObjectTuri`, `ObjectListItem`, `ObjectDetail`, `Views`

- [ ] **Step 1: Paketni yaratish**

```bash
mkdir -p packages/shared/src
```

`packages/shared/package.json`:

```json
{
  "name": "@rieltor/shared",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "lint": "eslint src"
  },
  "dependencies": { "zod": "^4.0.0" },
  "devDependencies": { "typescript": "^5.7.2", "vitest": "^3.0.0" }
}
```

`packages/shared/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

> **Nega CommonJS?** `apps/api` (NestJS) CommonJS'da ishlaydi va ESM paketni `require` qila olmaydi. Vite esa CJS bog'liqlikni muammosiz bundle qiladi. Shuning uchun `@rieltor/shared` CJS chiqaradi — bu ikkala iste'molchini ham qanoatlantiradigan yagona variant.

`packages/shared/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { environment: 'node' } });
```

```bash
yarn install
```

- [ ] **Step 2: Format testlarini yoz (fail bo'lishi kerak)**

`packages/shared/src/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatNarxSom, formatNarxUsd } from './format';

describe('formatNarxSom', () => {
  it('uch xonadan probel bilan ajratadi', () => {
    expect(formatNarxSom('480000000')).toBe("480 000 000 so'm");
  });

  it("to'liq bo'lmagan guruhni to'g'ri ajratadi", () => {
    expect(formatNarxSom('1250000')).toBe("1 250 000 so'm");
  });

  it("uch xonadan kichik sonni o'zgartirmaydi", () => {
    expect(formatNarxSom('500')).toBe("500 so'm");
  });

  it("Int chegarasidan katta sonni yo'qotmaydi", () => {
    expect(formatNarxSom('5000000000')).toBe("5 000 000 000 so'm");
  });
});

describe('formatNarxUsd', () => {
  it('dollar belgisi bilan ajratadi', () => {
    expect(formatNarxUsd(40000)).toBe('$40 000');
  });

  it("ming'dan kichik sonni o'zgartirmaydi", () => {
    expect(formatNarxUsd(900)).toBe('$900');
  });
});
```

> **Diqqat — butun reja bo'ylab amal qiladigan qoida:** o'zbekcha matnda `'` ko'p uchraydi. Ichida apostrof bo'lgan har qanday JS/TS satri **ikki tirnoq** bilan yoziladi (`"480 000 000 so'm"`, `it("to'g'ri ishlaydi", ...)`). Prettier `singleQuote: true` bo'lsa ham bunday satrlarni ikki tirnoqda qoldiradi — bu normal, tuzatishga urinma.

- [ ] **Step 3: Testni ishga tushirib fail ekanini ko'r**

```bash
yarn workspace @rieltor/shared test
```

Kutilgan: FAIL — `Failed to resolve import "./format"`.

- [ ] **Step 4: Formatterni yoz**

`packages/shared/src/format.ts`:

```ts
/** Raqamli satrni uch xonadan oddiy probel bilan ajratadi: "480000000" → "480 000 000" */
function guruhla(raqam: string): string {
  return raqam.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** narxSom har doim string — BigInt qiymati number'ga sig'masligi mumkin. */
export function formatNarxSom(narxSom: string): string {
  return `${guruhla(narxSom)} so'm`;
}

export function formatNarxUsd(narxUsd: number): string {
  return `$${guruhla(String(narxUsd))}`;
}
```

- [ ] **Step 5: Testni qayta ishga tushir**

```bash
yarn workspace @rieltor/shared test
```

Kutilgan: 6 test PASS.

- [ ] **Step 6: Rasm yordamchilari uchun test yoz**

`packages/shared/src/images.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { IMAGE_SIZES, IMAGE_WIDTHS, imageFallbackSrc, imageSrcSet } from './images';

describe('rasm yordamchilari', () => {
  it('uchta kenglik uchun srcset quradi', () => {
    expect(imageSrcSet('/images/bx-001/01')).toBe(
      '/images/bx-001/01-360.webp 360w, /images/bx-001/01-720.webp 720w, /images/bx-001/01-1200.webp 1200w',
    );
  });

  it('fallback sifatida eng katta jpg ni beradi', () => {
    expect(imageFallbackSrc('/images/bx-001/01')).toBe('/images/bx-001/01-1200.jpg');
  });

  it('kengliklar va sizes qiymati qotirilgan', () => {
    expect(IMAGE_WIDTHS).toEqual([360, 720, 1200]);
    expect(IMAGE_SIZES).toBe('(max-width: 480px) 100vw, 480px');
  });
});
```

- [ ] **Step 7: Testni fail holatida ko'r, so'ng yordamchilarni yoz**

```bash
yarn workspace @rieltor/shared test
```

Kutilgan: FAIL — `Failed to resolve import "./images"`.

`packages/shared/src/images.ts`:

```ts
/**
 * Rasm fayl nomlash konvensiyasi — YAGONA manba.
 * Seed quvuri (apps/api/prisma/images.ts) shu nomlar bilan fayl yozadi,
 * front <img srcset> uchun, API esa <link rel=preload> uchun shu yerdan o'qiydi.
 * base = "/images/bx-001/01" → "/images/bx-001/01-720.webp"
 */
export const IMAGE_WIDTHS = [360, 720, 1200] as const;

/** Kontent desktopda 480px bilan cheklangan (spec §10). */
export const IMAGE_SIZES = '(max-width: 480px) 100vw, 480px';

export function imageSrcSet(base: string): string {
  return IMAGE_WIDTHS.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
}

export function imageFallbackSrc(base: string): string {
  return `${base}-1200.jpg`;
}
```

- [ ] **Step 8: Sxemalar uchun test yoz**

`packages/shared/src/schemas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ObjectDetailSchema, ViewsSchema } from './schemas';

const toliqObyekt = {
  id: 'bx-001',
  sarlavha: "2 xonali kvartira, yangi ta'mir",
  narxSom: '480000000',
  narxUsd: 40000,
  xona: 2,
  maydonM2: 60,
  qavat: '4/9',
  tuman: 'Buxoro shahri',
  manzil: "Navoiy ko'chasi 12",
  moljal: 'Bukhara City yaqinida',
  tavsif: 'Uch jumlalik tavsif.',
  turi: 'IKKILAMCHI',
  views: 7,
  sana: '2026-07-28',
  rasmlar: [
    {
      base: '/images/bx-001/01',
      ogUrl: '/images/bx-001/og.jpg',
      width: 1200,
      height: 900,
      tartib: 1,
    },
  ],
  agent: {
    id: 'ag-1',
    ism: 'Murod',
    agentlik: 'Buxoro Uy',
    suratUrl: '/images/agents/ag-1.jpg',
    tel: '+998901234567',
    tg: 'murod',
  },
};

describe('ObjectDetailSchema', () => {
  it("to'liq obyektni qabul qiladi", () => {
    expect(ObjectDetailSchema.parse(toliqObyekt).id).toBe('bx-001');
  });

  it("hovli uchun qavat null bo'lishiga ruxsat beradi", () => {
    const hovli = { ...toliqObyekt, turi: 'HOVLI', qavat: null };
    expect(ObjectDetailSchema.parse(hovli).qavat).toBeNull();
  });

  it("narxSom number bo'lsa rad etadi", () => {
    expect(() => ObjectDetailSchema.parse({ ...toliqObyekt, narxSom: 480000000 })).toThrow();
  });

  it('notanish turi qiymatini rad etadi', () => {
    expect(() => ObjectDetailSchema.parse({ ...toliqObyekt, turi: 'DACHA' })).toThrow();
  });
});

describe('ViewsSchema', () => {
  it('butun son talab qiladi', () => {
    expect(ViewsSchema.parse({ views: 12 }).views).toBe(12);
    expect(() => ViewsSchema.parse({ views: 1.5 })).toThrow();
  });
});
```

- [ ] **Step 9: Testni fail holatida ko'r, so'ng sxemalarni yoz**

```bash
yarn workspace @rieltor/shared test
```

Kutilgan: FAIL — `Failed to resolve import "./schemas"`.

`packages/shared/src/schemas.ts`:

```ts
import * as z from 'zod';

export const AgentSchema = z.object({
  id: z.string(),
  ism: z.string(),
  agentlik: z.string(),
  suratUrl: z.string(),
  tel: z.string(),
  tg: z.string(),
});

export const RasmSchema = z.object({
  /** Variantsiz asos yo'l: "/images/bx-001/01" — imageSrcSet() bilan ishlatiladi. */
  base: z.string(),
  /** 1200×630 crop; faqat birinchi rasmda to'ldiriladi. */
  ogUrl: z.string().nullable(),
  width: z.number().int(),
  height: z.number().int(),
  tartib: z.number().int(),
});

export const ObjectTuriSchema = z.enum(['NOVOSTROYKA', 'IKKILAMCHI', 'HOVLI']);

export const ObjectListItemSchema = z.object({
  id: z.string(),
  sarlavha: z.string(),
  /** BigInt number'ga sig'masligi mumkin — har doim string. */
  narxSom: z.string(),
  narxUsd: z.number().int(),
  xona: z.number().int(),
  maydonM2: z.number(),
  tuman: z.string(),
  rasm: RasmSchema.nullable(),
});

export const ObjectDetailSchema = ObjectListItemSchema.omit({ rasm: true }).extend({
  /** Hovlida qavat bo'lmaydi. */
  qavat: z.string().nullable(),
  manzil: z.string(),
  moljal: z.string(),
  tavsif: z.string(),
  turi: ObjectTuriSchema,
  views: z.number().int(),
  sana: z.string(),
  rasmlar: z.array(RasmSchema),
  agent: AgentSchema,
});

export const ViewsSchema = z.object({ views: z.number().int() });

export type Agent = z.infer<typeof AgentSchema>;
export type Rasm = z.infer<typeof RasmSchema>;
export type ObjectTuri = z.infer<typeof ObjectTuriSchema>;
export type ObjectListItem = z.infer<typeof ObjectListItemSchema>;
export type ObjectDetail = z.infer<typeof ObjectDetailSchema>;
export type Views = z.infer<typeof ViewsSchema>;
```

- [ ] **Step 10: Barrel fayl va to'liq tekshiruv**

`packages/shared/src/index.ts`:

```ts
export * from './format';
export * from './images';
export * from './schemas';
```

```bash
yarn workspace @rieltor/shared test
yarn workspace @rieltor/shared build
yarn workspace @rieltor/shared typecheck
yarn lint
```

Kutilgan: 14 test PASS, `packages/shared/dist/index.d.ts` yaratiladi, lint toza.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: @rieltor/shared — Zod sxemalar, narx formatteri va rasm yordamchilari"
```

---

## Task 3: API skeleti, env validatsiyasi va `/api/health`

NestJS ilovasi ko'tariladi, env Zod bilan tekshiriladi (noto'g'ri env → ilova ishga tushmaydi), va birinchi e2e test yoziladi. DB hali yo'q — u Task 4 da qo'shiladi.

**Files:**

- Create: `apps/api/package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `vitest.config.ts`, `vitest.config.e2e.ts`, `.env.example`
- Create: `apps/api/src/main.ts`, `src/app.module.ts`, `src/config/env.ts`, `src/config/env.test.ts`, `src/health/health.controller.ts`, `src/health/health.module.ts`
- Create: `apps/api/test/health.e2e-spec.ts`

**Interfaces:**

- Consumes: `@rieltor/shared` (Task 2)
- Produces:
  - `envSchema` va `type Env` — `apps/api/src/config/env.ts`
  - `AppModule` — `apps/api/src/app.module.ts`, keyingi tasklar shu yerga modul qo'shadi
  - `GET /api/health` → `{ status: 'ok' }`
  - Global prefix `api` — **lekin** Task 14 dagi SSR kontrolleri prefiksdan tashqarida bo'ladi

- [ ] **Step 1: Paket va bog'liqliklar**

```bash
mkdir -p apps/api/src apps/api/test
```

`apps/api/package.json`:

```json
{
  "name": "@rieltor/api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "test:e2e": "vitest run --config vitest.config.e2e.ts",
    "lint": "eslint ."
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/swagger": "^11.0.0",
    "@rieltor/shared": "workspace:*",
    "nestjs-zod": "^5.5.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@swc/core": "^1.10.0",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.0",
    "@types/supertest": "^6.0.2",
    "supertest": "^7.0.0",
    "typescript": "^5.7.2",
    "unplugin-swc": "^1.5.1",
    "vitest": "^3.0.0"
  }
}
```

Ildizdagi `.yarnrc.yml` ga qo'sh (mavjud `nodeLinker` va `yarnPath` qatorlari saqlanadi):

```yaml
enableScripts: true
```

Ildizdagi `package.json` ga esa alohida maydon sifatida qo'sh:

```json
"dependenciesMeta": {
  "@scarf/scarf": { "built": false }
}
```

> **Nega kerak:** Yarn 4.17 da `enableScripts` ning **standart qiymati `false`** — bu foydalanuvchi sozlamasi emas, Yarn'ning o'z sukuti (`yarn config --why` → `Source: <default>`). Skriptlar bloklangan holda `@prisma/client` generatsiya qilinmaydi va `sharp` ning native binary'si yuklanmaydi, ya'ni Task 4, 5 va 6 umuman ishlamaydi.
>
> **Diqqat:** `dependenciesMeta` — bu `package.json` maydoni, `.yarnrc.yml` sozlamasi emas. `.yarnrc.yml` ga qo'yilsa `yarn install` "Unrecognized or legacy configuration settings found" deb rad etadi. `@scarf/scarf` faqat telemetriya yuboradigan postinstall — u shu yo'l bilan o'chirib qo'yiladi.

```bash
yarn install
```

- [ ] **Step 2: TypeScript va Nest konfiguratsiyasi**

`apps/api/tsconfig.json` — NestJS dekoratorlari uchun bazadan farqli sozlamalar:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "lib": ["ES2023"],
    "types": ["node"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false,
    "outDir": "dist",
    "baseUrl": "."
  },
  "include": ["src", "test", "prisma"]
}
```

`apps/api/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "rootDir": "src" },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "test", "**/*.test.ts", "**/*.spec.ts"]
}
```

> **`rootDir` va `include` KRITIK.** Asosiy `tsconfig.json` da `include: ["src", "test", "prisma"]` turadi, shuning uchun TypeScript ildizni `apps/api` deb hisoblab, natijani `dist/src/main.js` ga yozadi. U holda:
>
> - `"start": "node dist/main"` `MODULE_NOT_FOUND` beradi
> - Task 14 dagi `sozla()` da `__dirname` `apps/api/dist/src` bo'lib, `resolve(__dirname, '..')` `apps/api` emas `apps/api/dist` ni beradi → `public/` va `web/dist` yo'llari noto'g'ri
> - Task 15 dagi Dockerfile `CMD` ishlamaydi
>
> Bu yerdagi `rootDir: "src"` + `include: ["src"]` natijani `dist/main.js` ga tushiradi va `__dirname` ni `apps/api/dist` qiladi — qolgan hamma joy shunga tayanadi. `prisma/` build'dan tushib qoladi, bu to'g'ri: u faqat `tsx` bilan ishlatiladi va `src/` undan hech narsa import qilmaydi.

`apps/api/nest-cli.json`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true, "tsConfigPath": "tsconfig.build.json" }
}
```

> `strictPropertyInitialization: false` — NestJS'da konstruktor orqali inject qilinadigan maydonlar uchun zarur.

- [ ] **Step 3: Vitest konfiguratsiyasi (dekoratorlar uchun SWC)**

`apps/api/vitest.config.ts`:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    root: './',
  },
  // NestJS dekoratorlari emitDecoratorMetadata talab qiladi — esbuild buni qilmaydi, SWC qiladi.
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
```

`apps/api/vitest.config.e2e.ts`:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    root: './',
    fileParallelism: false,
    testTimeout: 30_000,
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
```

> `fileParallelism: false` — e2e testlar bitta DB'ga tegadi (Task 4 dan boshlab), parallel ishlasa bir-birini buzadi.

- [ ] **Step 4: Env validatsiyasi uchun test yoz**

`apps/api/src/config/env.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { envSchema } from './env';

const toliq = {
  DATABASE_URL: 'postgresql://rieltor:rieltor@localhost:5432/rieltor',
  PUBLIC_BASE_URL: 'http://localhost:3000',
};

describe('envSchema', () => {
  it('PORT berilmasa 3000 ni qo'yadi', () => {
    expect(envSchema.parse(toliq).PORT).toBe(3000);
  });

  it('PORT ni satrdan songa aylantiradi', () => {
    expect(envSchema.parse({ ...toliq, PORT: '8080' }).PORT).toBe(8080);
  });

  it('DATABASE_URL yo'q bo'lsa rad etadi', () => {
    expect(() => envSchema.parse({ PUBLIC_BASE_URL: toliq.PUBLIC_BASE_URL })).toThrow();
  });

  it('PUBLIC_BASE_URL URL bo'lmasa rad etadi', () => {
    expect(() => envSchema.parse({ ...toliq, PUBLIC_BASE_URL: 'shunchaki-matn' })).toThrow();
  });

  it('PUBLIC_BASE_URL oxiridagi slashni olib tashlaydi', () => {
    const parsed = envSchema.parse({ ...toliq, PUBLIC_BASE_URL: 'https://misol.uz/' });
    expect(parsed.PUBLIC_BASE_URL).toBe('https://misol.uz');
  });
});
```

Yuqoridagi apostrofli tavsiflarni ikki tirnoqqa o'zgartir: `it("PORT berilmasa 3000 ni qo'yadi", ...)`, `it("DATABASE_URL yo'q bo'lsa rad etadi", ...)`, `it("PUBLIC_BASE_URL URL bo'lmasa rad etadi", ...)`.

- [ ] **Step 5: Testni fail holatida ko'r**

```bash
yarn workspace @rieltor/api test
```

Kutilgan: FAIL — `Failed to resolve import "./env"`.

- [ ] **Step 6: Env sxemasini yoz**

`apps/api/src/config/env.ts`:

```ts
import * as z from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  /**
   * Absolyut og:image URL'i uchun. Telegram nisbiy yo'lni o'qimaydi (spec §8).
   * Oxiridagi slash olib tashlanadi — keyin `${PUBLIC_BASE_URL}/images/...` deb ulanadi.
   */
  PUBLIC_BASE_URL: z.url().transform((v) => v.replace(/\/+$/, '')),
});

export type Env = z.infer<typeof envSchema>;
```

`apps/api/.env.example`:

```
DATABASE_URL=postgresql://rieltor:rieltor@localhost:5432/rieltor
PUBLIC_BASE_URL=http://localhost:3000
PORT=3000

# Seed uchun — o'z kontaktingni qo'y, so'ng `yarn workspace @rieltor/api seed`
SEED_AGENT_TEL=+998901234567
SEED_AGENT_TG=username
```

- [ ] **Step 7: Testni qayta ishga tushir**

```bash
yarn workspace @rieltor/api test
```

Kutilgan: 5 test PASS.

- [ ] **Step 8: Health e2e testini yoz**

`apps/api/test/health.e2e-spec.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', { exclude: [] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health → 200 ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
  });
});
```

- [ ] **Step 9: Testni fail holatida ko'r**

```bash
yarn workspace @rieltor/api test:e2e
```

Kutilgan: FAIL — `Failed to resolve import "../src/app.module"`.

- [ ] **Step 10: Modul, kontroller va bootstrap**

`apps/api/src/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'Servis tirikligi' })
  check() {
    return { status: 'ok' };
  }
}
```

`apps/api/src/health/health.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

`apps/api/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { envSchema } from './config/env';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Noto'g'ri env bilan ilova umuman ko'tarilmaydi — sekin nosozlikdan yaxshiroq.
      validate: (raw) => envSchema.parse(raw),
    }),
    HealthModule,
  ],
  providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
})
export class AppModule {}
```

`apps/api/src/main.ts`:

```ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import type { Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // SSR kontrolleri (Task 14) prefiksdan tashqarida bo'lishi uchun aniq ro'yxat ishlatiladi.
  app.setGlobalPrefix('api', { exclude: [] });

  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Rieltor Generator API')
      .setDescription('Obyekt sahifasi va ko'rishlar hisoblagichi')
      .setVersion('0.1')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(doc));

  const config = app.get(ConfigService<Env, true>);
  await app.listen(config.get('PORT', { infer: true }), '0.0.0.0');
}

void bootstrap();
```

> `.setDescription(...)` ichidagi `ko'rishlar` apostrofli — uni ikki tirnoqqa o'zgartir: `.setDescription("Obyekt sahifasi va ko'rishlar hisoblagichi")`.

- [ ] **Step 11: Testlarni qayta ishga tushir**

```bash
yarn workspace @rieltor/api test:e2e
yarn workspace @rieltor/api build
yarn workspace @rieltor/api typecheck
```

Kutilgan: e2e PASS, `dist/main.js` yaratiladi, typecheck toza.

- [ ] **Step 12: `test` skriptiga e2e ni ulash va commit**

`apps/api/package.json` da `test` skriptini almashtir:

```json
"test": "vitest run && vitest run --config vitest.config.e2e.ts"
```

```bash
yarn lint && yarn workspace @rieltor/api test
git add -A
git commit -m "feat(api): NestJS skeleti, Zod env validatsiyasi, /api/health va Swagger"
```

---

## Task 4: PostgreSQL, Prisma sxemasi va DB health

Lokal Postgres docker-compose orqali ko'tariladi, spec §4 modeli Prisma sxemasiga yoziladi, migratsiya bajariladi va `/api/health` DB holatini ham qaytaradi.

**Files:**

- Create: `docker-compose.yml`, `apps/api/prisma/schema.prisma`, `apps/api/src/prisma/prisma.service.ts`, `apps/api/src/prisma/prisma.module.ts`
- Modify: `apps/api/src/health/health.controller.ts`, `apps/api/src/app.module.ts`, `apps/api/test/health.e2e-spec.ts`, `apps/api/package.json`

> `health.module.ts` **o'zgarmaydi** — `PrismaModule` `@Global()` bo'lgani uchun `PrismaService` unga alohida `imports` yozmasdan inject bo'ladi.

**Interfaces:**

- Consumes: `envSchema.DATABASE_URL` (Task 3)
- Produces:
  - `PrismaService` — `extends PrismaClient`, global `PrismaModule` orqali inject qilinadi
  - Prisma modellari: `Agent`, `Object`, `Rasm`, enum `ObjectTuri`
  - `GET /api/health` → `{ status: 'ok' | 'degraded', db: boolean }`

- [ ] **Step 1: Postgres konteyneri**

Ildizda `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: rieltor
      POSTGRES_PASSWORD: rieltor
      POSTGRES_DB: rieltor
    ports: ['5432:5432']
    volumes: ['pgdata:/var/lib/postgresql/data']
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U rieltor']
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  pgdata:
```

```bash
docker compose up -d postgres
cp apps/api/.env.example apps/api/.env
```

- [ ] **Step 2: Prisma o'rnatish**

```bash
yarn workspace @rieltor/api add @prisma/client
yarn workspace @rieltor/api add -D prisma
```

- [ ] **Step 3: Sxemani yoz**

`apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ObjectTuri {
  NOVOSTROYKA
  IKKILAMCHI
  HOVLI
}

model Agent {
  id       String   @id @default(cuid())
  ism      String
  agentlik String
  suratUrl String
  tel      String
  tg       String
  objects  Object[]
}

model Object {
  id       String     @id
  sarlavha String
  /// Int 2.1 mlrd so'mda to'lib qoladi — hovli undan qimmat bo'lishi mumkin.
  narxSom  BigInt
  narxUsd  Int
  xona     Int
  maydonM2 Float
  /// Hovlida qavat bo'lmaydi.
  qavat    String?
  tuman    String
  manzil   String
  moljal   String
  tavsif   String
  turi     ObjectTuri
  views    Int        @default(0)
  sana     DateTime   @db.Date
  agentId  String
  agent    Agent      @relation(fields: [agentId], references: [id])
  rasmlar  Rasm[]

  @@index([turi])
}

model Rasm {
  id       String  @id @default(cuid())
  objectId String
  /// Variantsiz asos yo'l: "/images/bx-001/01" — @rieltor/shared imageSrcSet() bilan ishlatiladi.
  base     String
  /// 1200×630 crop; faqat birinchi rasmda to'ldiriladi.
  ogUrl    String?
  width    Int
  height   Int
  tartib   Int
  object   Object  @relation(fields: [objectId], references: [id], onDelete: Cascade)

  @@unique([objectId, tartib])
}
```

- [ ] **Step 4: Migratsiya va klient**

`apps/api/package.json` skriptlariga qo'sh:

```json
"prisma": "prisma",
"migrate": "prisma migrate dev",
"migrate:deploy": "prisma migrate deploy",
"generate": "prisma generate"
```

```bash
yarn workspace @rieltor/api exec prisma migrate dev --name init
```

Kutilgan: `apps/api/prisma/migrations/<timestamp>_init/migration.sql` yaratiladi, klient generatsiya qilinadi.

- [ ] **Step 5: PrismaService yoz**

`apps/api/src/prisma/prisma.service.ts`:

```ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Health uchun — ulanish tirikmi. Xato tashlamaydi. */
  async ishlayaptimi(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.warn(`DB javob bermayapti: ${String(error)}`);
      return false;
    }
  }
}
```

`apps/api/src/prisma/prisma.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

- [ ] **Step 6: Health e2e testini kengaytir (fail bo'lishi kerak)**

`apps/api/test/health.e2e-spec.ts` dagi testni almashtir:

```ts
it('GET /api/health → 200, db holati bilan', async () => {
  const res = await request(app.getHttpServer()).get('/api/health').expect(200);
  expect(res.body).toEqual({ status: 'ok', db: true });
});
```

```bash
yarn workspace @rieltor/api test:e2e
```

Kutilgan: FAIL — javobda `db` maydoni yo'q.

- [ ] **Step 7: Health kontrollerini yangila**

`apps/api/src/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ description: 'Servis va DB tirikligi' })
  async check() {
    const db = await this.prisma.ishlayaptimi();
    return { status: db ? 'ok' : 'degraded', db };
  }
}
```

`apps/api/src/app.module.ts` ga `PrismaModule` ni qo'sh (`imports` ro'yxatiga, `ConfigModule` dan keyin):

```ts
import { PrismaModule } from './prisma/prisma.module';
// ...
    PrismaModule,
    HealthModule,
```

- [ ] **Step 8: Testni qayta ishga tushir**

```bash
yarn workspace @rieltor/api test
```

Kutilgan: unit + e2e hammasi PASS.

- [ ] **Step 9: Commit**

```bash
yarn lint && yarn typecheck
git add -A
git commit -m "feat(api): Postgres, Prisma sxemasi (Agent/Object/Rasm) va DB health tekshiruvi"
```

---

## Task 5: `sharp` rasm quvuri

Har manba rasmdan 360/720/1200 kenglikdagi WebP, 1200 kenglikdagi JPG fallback va (birinchi rasm uchun) 1200×630 OG crop yasaydigan sof funksiya. Nomlash konvensiyasi `@rieltor/shared/images.ts` bilan bir xil bo'lishi **shart** — aks holda front 404 rasm oladi.

**Files:**

- Create: `apps/api/prisma/images.ts`, `apps/api/prisma/images.test.ts`
- Modify: `apps/api/vitest.config.ts` (test `include` ga `prisma` qo'shiladi), `apps/api/package.json`

**Interfaces:**

- Consumes: `IMAGE_WIDTHS` (`@rieltor/shared`, Task 2)
- Produces:
  - `interface RasmNatija { base: string; ogUrl: string | null; width: number; height: number }`
  - `async function rasmniQayta(opts: { manba: string | Buffer; chiqishRoot: string; objectId: string; tartib: number; ogYasa: boolean }): Promise<RasmNatija>`

- [ ] **Step 1: sharp o'rnat va vitest include'ni kengaytir**

```bash
yarn workspace @rieltor/api add sharp
```

`apps/api/vitest.config.ts` da `include` ni almashtir:

```ts
    include: ['src/**/*.{test,spec}.ts', 'prisma/**/*.{test,spec}.ts'],
```

- [ ] **Step 2: Testni yoz (fail bo'lishi kerak)**

`apps/api/prisma/images.test.ts`:

```ts
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rasmniQayta } from './images';

let chiqishRoot: string;

/** Testda binar fayl saqlamaslik uchun manba rasm shu yerda generatsiya qilinadi. */
async function manbaRasm(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 30, g: 90, b: 200 } },
  })
    .jpeg()
    .toBuffer();
}

beforeEach(async () => {
  chiqishRoot = await mkdtemp(join(tmpdir(), 'rieltor-img-'));
});

afterEach(async () => {
  await rm(chiqishRoot, { recursive: true, force: true });
});

describe('rasmniQayta', () => {
  it('uchta webp va bitta jpg fallback yozadi', async () => {
    const natija = await rasmniQayta({
      manba: await manbaRasm(2000, 1500),
      chiqishRoot,
      objectId: 'bx-001',
      tartib: 1,
      ogYasa: false,
    });

    expect(natija.base).toBe('/images/bx-001/01');

    for (const w of [360, 720, 1200]) {
      const meta = await sharp(join(chiqishRoot, `images/bx-001/01-${w}.webp`)).metadata();
      expect(meta.width).toBe(w);
      expect(meta.format).toBe('webp');
    }

    const fallback = await sharp(join(chiqishRoot, 'images/bx-001/01-1200.jpg')).metadata();
    expect(fallback.format).toBe('jpeg');
    expect(fallback.width).toBe(1200);
  });

  it('1200 variantining haqiqiy o'lchamini qaytaradi', async () => {
    const natija = await rasmniQayta({
      manba: await manbaRasm(2000, 1500),
      chiqishRoot,
      objectId: 'bx-001',
      tartib: 1,
      ogYasa: false,
    });

    expect(natija.width).toBe(1200);
    expect(natija.height).toBe(900);
  });

  it('kichik manbani kattalashtirmaydi', async () => {
    const natija = await rasmniQayta({
      manba: await manbaRasm(800, 600),
      chiqishRoot,
      objectId: 'bx-002',
      tartib: 1,
      ogYasa: false,
    });

    expect(natija.width).toBe(800);
    expect(natija.height).toBe(600);
  });

  it('ogYasa=true bo'lganda 1200x630 crop yozadi', async () => {
    const natija = await rasmniQayta({
      manba: await manbaRasm(2000, 1500),
      chiqishRoot,
      objectId: 'bx-001',
      tartib: 1,
      ogYasa: true,
    });

    expect(natija.ogUrl).toBe('/images/bx-001/og.jpg');
    const og = await sharp(join(chiqishRoot, 'images/bx-001/og.jpg')).metadata();
    expect(og.width).toBe(1200);
    expect(og.height).toBe(630);
  });

  it('ogYasa=false bo'lganda ogUrl null', async () => {
    const natija = await rasmniQayta({
      manba: await manbaRasm(2000, 1500),
      chiqishRoot,
      objectId: 'bx-001',
      tartib: 2,
      ogYasa: false,
    });

    expect(natija.ogUrl).toBeNull();
    expect(natija.base).toBe('/images/bx-001/02');
  });

  it('har variant 250 KB dan kichik', async () => {
    await rasmniQayta({
      manba: await manbaRasm(2400, 1800),
      chiqishRoot,
      objectId: 'bx-001',
      tartib: 1,
      ogYasa: false,
    });

    const katta = await readFile(join(chiqishRoot, 'images/bx-001/01-1200.jpg'));
    expect(katta.byteLength).toBeLessThan(250 * 1024);
  });
});
```

Apostrofli tavsiflarni ikki tirnoqqa o'zgartir: `it("1200 variantining haqiqiy o'lchamini qaytaradi", ...)`, `it("ogYasa=true bo'lganda 1200x630 crop yozadi", ...)`, `it("ogYasa=false bo'lganda ogUrl null", ...)`.

- [ ] **Step 3: Testni fail holatida ko'r**

```bash
yarn workspace @rieltor/api test
```

Kutilgan: FAIL — `Failed to resolve import "./images"`.

- [ ] **Step 4: Quvurni yoz**

`apps/api/prisma/images.ts`:

```ts
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { IMAGE_WIDTHS } from '@rieltor/shared';

export interface RasmNatija {
  /** Variantsiz asos yo'l, DB'ga shu yoziladi: "/images/bx-001/01" */
  base: string;
  ogUrl: string | null;
  /** Eng katta variantning haqiqiy o'lchami — front <img width/height> uchun (CLS = 0). */
  width: number;
  height: number;
}

export interface RasmniQaytaOpts {
  manba: string | Buffer;
  /** Statik fayllar ildizi, odatda apps/api/public */
  chiqishRoot: string;
  objectId: string;
  /** 1 dan boshlanadi; fayl nomi ikki xonali bo'ladi: 01, 02, ... */
  tartib: number;
  ogYasa: boolean;
}

const SIFAT = 78;
const OG_KENGLIK = 1200;
const OG_BALANDLIK = 630;

export async function rasmniQayta(opts: RasmniQaytaOpts): Promise<RasmNatija> {
  const { manba, chiqishRoot, objectId, tartib, ogYasa } = opts;

  const papka = join(chiqishRoot, 'images', objectId);
  await mkdir(papka, { recursive: true });

  const nom = String(tartib).padStart(2, '0');
  const base = `/images/${objectId}/${nom}`;

  let width = 0;
  let height = 0;

  for (const w of IMAGE_WIDTHS) {
    // withoutEnlargement — kichik manbani cho'zmaymiz, aks holda sifat buziladi.
    const info = await sharp(manba)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: SIFAT })
      .toFile(join(papka, `${nom}-${w}.webp`));

    if (w === 1200) {
      width = info.width;
      height = info.height;
    }
  }

  // WebP'ni qo'llamaydigan eski brauzerlar uchun yagona fallback.
  await sharp(manba)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: SIFAT, mozjpeg: true })
    .toFile(join(papka, `${nom}-1200.jpg`));

  let ogUrl: string | null = null;
  if (ogYasa) {
    // Telegram qat'iy 1200×630 kutadi — bu yerda cho'zish shart, cover crop bilan.
    await sharp(manba)
      .resize({ width: OG_KENGLIK, height: OG_BALANDLIK, fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(papka, 'og.jpg'));
    ogUrl = `/images/${objectId}/og.jpg`;
  }

  return { base, ogUrl, width, height };
}
```

- [ ] **Step 5: Testni qayta ishga tushir**

```bash
yarn workspace @rieltor/api test
```

Kutilgan: `images.test.ts` dagi 6 test PASS.

- [ ] **Step 6: Commit**

```bash
yarn lint && yarn typecheck
git add -A
git commit -m "feat(api): sharp rasm quvuri — responsive variantlar va OG crop"
```

---

## Task 6: Seed — agent, 3 obyekt va rasmlar

Spec §4.1: idempotent seed. Kontakt env'dan keladi, rasm manbalari `prisma/seed-images/<id>/` dan; papka bo'sh bo'lsa placeholder generatsiya qilinadi, shunda repo binar fayl saqlamaydi va ish to'xtamaydi.

**Files:**

- Create: `apps/api/prisma/seed-data.ts`, `apps/api/prisma/placeholders.ts`, `apps/api/prisma/seed.ts`, `apps/api/prisma/seed-images/.gitkeep`
- Modify: `apps/api/package.json`

**Interfaces:**

- Consumes: `rasmniQayta` (Task 5), Prisma modellari (Task 4)
- Produces: `yarn workspace @rieltor/api seed` — DB'da 1 `Agent` va 3 `Object` (`bx-001` novostroyka, `bx-002` ikkilamchi, `bx-003` hovli), har birida 5 `Rasm`

- [ ] **Step 1: Seed ma'lumoti**

`apps/api/prisma/seed-data.ts` — **faqat data, mantiq yo'q.** Qiymatlar OLX.uz e'lonlaridagi real bozor parametrlariga mos (narx, tuman, m², qavat); tavsif matnlari o'zimizniki.

```ts
import type { ObjectTuri } from '@prisma/client';

export interface SeedObject {
  id: string;
  sarlavha: string;
  narxSom: bigint;
  narxUsd: number;
  xona: number;
  maydonM2: number;
  qavat: string | null;
  tuman: string;
  manzil: string;
  moljal: string;
  tavsif: string;
  turi: ObjectTuri;
  sana: string;
  rasmSoni: number;
}

export const SEED_OBJECTS: SeedObject[] = [
  {
    id: 'bx-001',
    sarlavha: '3 xonali kvartira, yangi bino, Buxoro City turar-joy majmuasi',
    narxSom: 780_000_000n,
    narxUsd: 65_000,
    xona: 3,
    maydonM2: 84,
    qavat: '6/9',
    tuman: 'Buxoro shahri',
    manzil: "Alpomish ko'chasi 4",
    moljal: 'Buxoro City majmuasi ichida, savdo markazi yonida',
    tavsif:
      "Yangi topshirilgan binoda uch xonali keng kvartira. Uy egasi tomonidan to'liq ta'mirlangan, oshxona jihozlari qoldiriladi. Deraza old tomonga qaraydi, quyosh kun bo'yi tushadi. Hovlida yopiq avtoturargoh va bolalar maydonchasi bor.",
    turi: 'NOVOSTROYKA',
    sana: '2026-07-20',
    rasmSoni: 5,
  },
  {
    id: 'bx-002',
    sarlavha: "2 xonali kvartira, o'rta ta'mir, G'ijduvon ko'chasi",
    narxSom: 480_000_000n,
    narxUsd: 40_000,
    xona: 2,
    maydonM2: 58,
    qavat: '4/5',
    tuman: 'Buxoro shahri',
    manzil: "G'ijduvon ko'chasi 27",
    moljal: '12-maktab va Oltin Vodiy bozori yaqinida',
    tavsif:
      "Panel uyning to'rtinchi qavatida ikki xonali kvartira. Xonalar alohida, oshxona kengaytirilgan. Suv va issiqlik uzilishsiz keladi. Metro bekati va bozorga piyoda besh daqiqa. Hujjatlar tayyor, kadastr mavjud.",
    turi: 'IKKILAMCHI',
    sana: '2026-07-22',
    rasmSoni: 5,
  },
  {
    id: 'bx-003',
    sarlavha: "5 xonali hovli uy, 6 sotix yer, Kogon yo'li",
    narxSom: 1_450_000_000n,
    narxUsd: 121_000,
    xona: 5,
    maydonM2: 180,
    qavat: null,
    tuman: 'Kogon tumani',
    manzil: "Mustaqillik ko'chasi 9",
    moljal: "Kogon temir yo'l bekatidan uch kilometr",
    tavsif:
      "Olti sotix yerda joylashgan besh xonali hovli uy. Uy g'ishtdan qurilgan, tomi yangilangan. Hovlida mevali daraxtlar, alohida oshxona va garaj bor. Tabiiy gaz, markaziy suv va kanalizatsiya ulangan. Yer uchun tuman hujjati bor.",
    turi: 'HOVLI',
    sana: '2026-07-25',
    rasmSoni: 5,
  },
];
```

> `sarlavha` va boshqa apostrofli satrlar ikki tirnoqda — buni buzma.

- [ ] **Step 2: Placeholder rasm generatori**

`apps/api/prisma/placeholders.ts`:

```ts
import sharp from 'sharp';

const RANGLAR: Record<string, { r: number; g: number; b: number }> = {
  'bx-001': { r: 29, g: 78, b: 216 },
  'bx-002': { r: 15, g: 118, b: 110 },
  'bx-003': { r: 133, g: 77, b: 14 },
};

/**
 * Manba rasm topilmasa ishlatiladigan bir rangli 1600×1200 surat.
 * Repo'da binar fayl saqlamaslik uchun — real rasmlar
 * prisma/seed-images/<id>/ ga qo'yilsa, seed avtomatik ularni oladi.
 */
export async function placeholderYasa(objectId: string, tartib: number): Promise<Buffer> {
  const asos = RANGLAR[objectId] ?? { r: 100, g: 116, b: 139 };
  const ochlik = tartib * 12;
  return sharp({
    create: {
      width: 1600,
      height: 1200,
      channels: 3,
      background: {
        r: Math.min(255, asos.r + ochlik),
        g: Math.min(255, asos.g + ochlik),
        b: Math.min(255, asos.b + ochlik),
      },
    },
  })
    .jpeg()
    .toBuffer();
}

export async function agentPlaceholder(): Promise<Buffer> {
  return sharp({
    create: { width: 400, height: 400, channels: 3, background: { r: 148, g: 163, b: 184 } },
  })
    .jpeg()
    .toBuffer();
}
```

- [ ] **Step 3: Seed skriptini yoz**

`apps/api/prisma/seed.ts`:

```ts
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { rasmniQayta } from './images';
import { agentPlaceholder, placeholderYasa } from './placeholders';
import { SEED_OBJECTS } from './seed-data';

const prisma = new PrismaClient();

const API_ROOT = resolve(__dirname, '..');
const PUBLIC_ROOT = join(API_ROOT, 'public');
const MANBA_ROOT = join(API_ROOT, 'prisma', 'seed-images');
const AGENT_ID = 'agent-1';

/** seed-images/<id>/ dagi fayllarni tartib bo'yicha o'qiydi; bo'sh bo'lsa placeholder qaytaradi. */
async function manbalarniOl(objectId: string, kerakli: number): Promise<(string | Buffer)[]> {
  let fayllar: string[] = [];
  try {
    fayllar = (await readdir(join(MANBA_ROOT, objectId)))
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();
  } catch {
    fayllar = [];
  }

  if (fayllar.length === 0) {
    console.log(`  ${objectId}: manba rasm topilmadi, placeholder ishlatiladi`);
    return Promise.all(
      Array.from({ length: kerakli }, (_, i) => placeholderYasa(objectId, i + 1)),
    );
  }

  return fayllar.map((f) => join(MANBA_ROOT, objectId, f));
}

async function agentniSeed() {
  const tel = process.env.SEED_AGENT_TEL;
  const tg = process.env.SEED_AGENT_TG;
  if (!tel || !tg) {
    throw new Error('SEED_AGENT_TEL va SEED_AGENT_TG env o'zgaruvchilari kerak (.env.example ga qara)');
  }

  const suratYoli = join(PUBLIC_ROOT, 'images', 'agents');
  await mkdir(suratYoli, { recursive: true });
  await writeFile(join(suratYoli, `${AGENT_ID}.jpg`), await agentPlaceholder());

  return prisma.agent.upsert({
    where: { id: AGENT_ID },
    update: { tel, tg },
    create: {
      id: AGENT_ID,
      ism: 'Rieltor',
      agentlik: 'Buxoro Ko'chmas Mulk',
      suratUrl: `/images/agents/${AGENT_ID}.jpg`,
      tel,
      tg,
    },
  });
}

async function main() {
  await agentniSeed();

  for (const obj of SEED_OBJECTS) {
    console.log(`${obj.id} seed qilinmoqda...`);

    // upsert — qayta ishga tushirilganda views nolga tushmasligi kerak.
    await prisma.object.upsert({
      where: { id: obj.id },
      update: {
        sarlavha: obj.sarlavha,
        narxSom: obj.narxSom,
        narxUsd: obj.narxUsd,
        xona: obj.xona,
        maydonM2: obj.maydonM2,
        qavat: obj.qavat,
        tuman: obj.tuman,
        manzil: obj.manzil,
        moljal: obj.moljal,
        tavsif: obj.tavsif,
        turi: obj.turi,
        sana: new Date(obj.sana),
      },
      create: {
        id: obj.id,
        sarlavha: obj.sarlavha,
        narxSom: obj.narxSom,
        narxUsd: obj.narxUsd,
        xona: obj.xona,
        maydonM2: obj.maydonM2,
        qavat: obj.qavat,
        tuman: obj.tuman,
        manzil: obj.manzil,
        moljal: obj.moljal,
        tavsif: obj.tavsif,
        turi: obj.turi,
        sana: new Date(obj.sana),
        agentId: AGENT_ID,
      },
    });

    const manbalar = await manbalarniOl(obj.id, obj.rasmSoni);

    // Rasmlar to'liq qayta yaratiladi — fayl nomlari tartibga bog'liq.
    await prisma.rasm.deleteMany({ where: { objectId: obj.id } });

    for (const [i, manba] of manbalar.entries()) {
      const natija = await rasmniQayta({
        manba,
        chiqishRoot: PUBLIC_ROOT,
        objectId: obj.id,
        tartib: i + 1,
        ogYasa: i === 0,
      });

      await prisma.rasm.create({
        data: {
          objectId: obj.id,
          base: natija.base,
          ogUrl: natija.ogUrl,
          width: natija.width,
          height: natija.height,
          tartib: i + 1,
        },
      });
    }

    console.log(`  ${manbalar.length} rasm qayta ishlandi`);
  }
}

main()
  .then(() => console.log('Seed tugadi.'))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
```

> Apostrofli satrlarni ikki tirnoqqa o'zgartir: `"Buxoro Ko'chmas Mulk"` va `"SEED_AGENT_TEL va SEED_AGENT_TG env o'zgaruvchilari kerak (.env.example ga qara)"`.

- [ ] **Step 4: Skript va papkani ro'yxatga ol**

```bash
mkdir -p apps/api/prisma/seed-images && touch apps/api/prisma/seed-images/.gitkeep
yarn workspace @rieltor/api add -D tsx
```

`apps/api/package.json` skriptlariga qo'sh:

```json
"seed": "tsx prisma/seed.ts"
```

- [ ] **Step 5: Seed ni ishga tushir va natijani tekshir**

```bash
docker compose up -d postgres
yarn workspace @rieltor/api seed
```

Kutilgan chiqish: uchala obyekt uchun "5 rasm qayta ishlandi", oxirida "Seed tugadi."

```bash
yarn workspace @rieltor/api exec prisma studio
```

yoki tezroq tekshiruv:

```bash
docker compose exec -T postgres psql -U rieltor -d rieltor -c \
  'SELECT o.id, o."narxSom", o.turi, count(r.id) AS rasmlar FROM "Object" o LEFT JOIN "Rasm" r ON r."objectId" = o.id GROUP BY o.id ORDER BY o.id;'
```

Kutilgan: 3 qator, har birida `rasmlar = 5`, `bx-003` uchun `turi = HOVLI`.

```bash
ls apps/api/public/images/bx-001/
```

Kutilgan: `01-360.webp 01-720.webp 01-1200.webp 01-1200.jpg og.jpg` va `02..05` variantlari.

- [ ] **Step 6: Idempotentlikni tekshir**

```bash
docker compose exec -T postgres psql -U rieltor -d rieltor -c \
  'UPDATE "Object" SET views = 42 WHERE id = '"'"'bx-001'"'"';'
yarn workspace @rieltor/api seed
docker compose exec -T postgres psql -U rieltor -d rieltor -c \
  'SELECT views FROM "Object" WHERE id = '"'"'bx-001'"'"';'
```

Kutilgan: `views` hamon `42` — seed uni nolga tushirmadi.

- [ ] **Step 7: Commit**

```bash
yarn lint && yarn typecheck
git add -A
git commit -m "feat(api): idempotent seed — agent, 3 obyekt va rasm quvuri"
```

---

## Task 7: Obyektlar API'si

`GET /api/objects` va `GET /api/objects/:id`. Prisma natijasini `@rieltor/shared` sxemalariga moslaydigan mapper — bu yerda `BigInt → string` va `Date → 'YYYY-MM-DD'` konvertatsiyasi bo'ladi.

**Files:**

- Create: `apps/api/src/objects/mapper.ts`, `mapper.test.ts`, `objects.dto.ts`, `objects.service.ts`, `objects.controller.ts`, `objects.module.ts`
- Create: `apps/api/test/objects.e2e-spec.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**

- Consumes: `PrismaService` (Task 4), `ObjectDetailSchema` / `ObjectListItemSchema` (Task 2)
- Produces:
  - `ObjectsService.royxat(): Promise<ObjectListItem[]>`
  - `ObjectsService.bittasi(id: string): Promise<ObjectDetail>` — topilmasa `NotFoundException`
  - `GET /api/objects`, `GET /api/objects/:id`
  - `detailgaAylantir(row)` va `royxatgaAylantir(row)` mapperlari — Task 14 (SSR) `detailgaAylantir` ni qayta ishlatadi

- [ ] **Step 1: Mapper testini yoz**

`apps/api/src/objects/mapper.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ObjectDetailSchema } from '@rieltor/shared';
import { detailgaAylantir, royxatgaAylantir } from './mapper';

const qator = {
  id: 'bx-002',
  sarlavha: 'Test',
  narxSom: 480000000n,
  narxUsd: 40000,
  xona: 2,
  maydonM2: 58,
  qavat: '4/5',
  tuman: 'Buxoro shahri',
  manzil: 'Manzil',
  moljal: 'Moljal',
  tavsif: 'Tavsif',
  turi: 'IKKILAMCHI' as const,
  views: 3,
  sana: new Date('2026-07-22T00:00:00.000Z'),
  agentId: 'agent-1',
  agent: {
    id: 'agent-1',
    ism: 'Rieltor',
    agentlik: 'Agentlik',
    suratUrl: '/images/agents/agent-1.jpg',
    tel: '+998901234567',
    tg: 'username',
  },
  rasmlar: [
    { base: '/images/bx-002/01', ogUrl: '/images/bx-002/og.jpg', width: 1200, height: 900, tartib: 1 },
    { base: '/images/bx-002/02', ogUrl: null, width: 1200, height: 900, tartib: 2 },
  ],
};

describe('detailgaAylantir', () => {
  it('narxSom ni satrga aylantiradi', () => {
    expect(detailgaAylantir(qator).narxSom).toBe('480000000');
  });

  it('sana ni YYYY-MM-DD ko'rinishida beradi', () => {
    expect(detailgaAylantir(qator).sana).toBe('2026-07-22');
  });

  it('natija ObjectDetailSchema dan o'tadi', () => {
    expect(() => ObjectDetailSchema.parse(detailgaAylantir(qator))).not.toThrow();
  });

  it('agentId ni javobga qo'shmaydi', () => {
    expect(detailgaAylantir(qator)).not.toHaveProperty('agentId');
  });
});

describe('royxatgaAylantir', () => {
  it('faqat birinchi rasmni beradi', () => {
    expect(royxatgaAylantir(qator).rasm?.base).toBe('/images/bx-002/01');
  });

  it('rasm bo'lmasa null qaytaradi', () => {
    expect(royxatgaAylantir({ ...qator, rasmlar: [] }).rasm).toBeNull();
  });

  it('tavsif kabi og'ir maydonlarni tashlab ketadi', () => {
    expect(royxatgaAylantir(qator)).not.toHaveProperty('tavsif');
  });
});
```

Apostrofli tavsiflarni ikki tirnoqqa o'zgartir.

- [ ] **Step 2: Testni fail holatida ko'r**

```bash
yarn workspace @rieltor/api test
```

Kutilgan: FAIL — `Failed to resolve import "./mapper"`.

- [ ] **Step 3: Mapperni yoz**

`apps/api/src/objects/mapper.ts`:

```ts
import type { Agent, Object as ObjectRow, Rasm } from '@prisma/client';
import type { ObjectDetail, ObjectListItem, Rasm as RasmDto } from '@rieltor/shared';

export type ObjectQatori = ObjectRow & { agent: Agent; rasmlar: Pick<Rasm, keyof RasmDto>[] };

/** DB'da @db.Date, JS'da UTC yarim tuni — ISO ning birinchi 10 belgisi kifoya. */
function sanaMatni(sana: Date): string {
  return sana.toISOString().slice(0, 10);
}

function rasmDto(r: Pick<Rasm, keyof RasmDto>): RasmDto {
  return { base: r.base, ogUrl: r.ogUrl, width: r.width, height: r.height, tartib: r.tartib };
}

export function detailgaAylantir(qator: ObjectQatori): ObjectDetail {
  return {
    id: qator.id,
    sarlavha: qator.sarlavha,
    // BigInt JSON'ga serializatsiya qilinmaydi va number'ga sig'masligi mumkin.
    narxSom: qator.narxSom.toString(),
    narxUsd: qator.narxUsd,
    xona: qator.xona,
    maydonM2: qator.maydonM2,
    qavat: qator.qavat,
    tuman: qator.tuman,
    manzil: qator.manzil,
    moljal: qator.moljal,
    tavsif: qator.tavsif,
    turi: qator.turi,
    views: qator.views,
    sana: sanaMatni(qator.sana),
    rasmlar: [...qator.rasmlar].sort((a, b) => a.tartib - b.tartib).map(rasmDto),
    agent: {
      id: qator.agent.id,
      ism: qator.agent.ism,
      agentlik: qator.agent.agentlik,
      suratUrl: qator.agent.suratUrl,
      tel: qator.agent.tel,
      tg: qator.agent.tg,
    },
  };
}

export function royxatgaAylantir(qator: ObjectQatori): ObjectListItem {
  const birinchi = [...qator.rasmlar].sort((a, b) => a.tartib - b.tartib)[0];
  return {
    id: qator.id,
    sarlavha: qator.sarlavha,
    narxSom: qator.narxSom.toString(),
    narxUsd: qator.narxUsd,
    xona: qator.xona,
    maydonM2: qator.maydonM2,
    tuman: qator.tuman,
    rasm: birinchi ? rasmDto(birinchi) : null,
  };
}
```

- [ ] **Step 4: Testni qayta ishga tushir**

```bash
yarn workspace @rieltor/api test
```

Kutilgan: 7 test PASS.

- [ ] **Step 5: e2e testini yoz**

`apps/api/test/objects.e2e-spec.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ObjectDetailSchema, ObjectListItemSchema } from '@rieltor/shared';
import { AppModule } from '../src/app.module';

describe('Objects (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', { exclude: [] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/objects → seed qilingan 3 obyekt', async () => {
    const res = await request(app.getHttpServer()).get('/api/objects').expect(200);
    expect(res.body).toHaveLength(3);
    for (const item of res.body) {
      expect(() => ObjectListItemSchema.parse(item)).not.toThrow();
    }
  });

  it('GET /api/objects/bx-002 → to'liq obyekt', async () => {
    const res = await request(app.getHttpServer()).get('/api/objects/bx-002').expect(200);
    const obj = ObjectDetailSchema.parse(res.body);
    expect(obj.turi).toBe('IKKILAMCHI');
    expect(obj.rasmlar.length).toBeGreaterThan(0);
    expect(obj.agent.tel).toMatch(/^\+998/);
  });

  it('hovlida qavat null', async () => {
    const res = await request(app.getHttpServer()).get('/api/objects/bx-003').expect(200);
    expect(res.body.qavat).toBeNull();
  });

  it('narxSom satr sifatida keladi', async () => {
    const res = await request(app.getHttpServer()).get('/api/objects/bx-002').expect(200);
    expect(typeof res.body.narxSom).toBe('string');
  });

  it("mavjud bo'lmagan id → 404", async () => {
    await request(app.getHttpServer()).get('/api/objects/yoq-000').expect(404);
  });
});
```

```bash
yarn workspace @rieltor/api test:e2e
```

Kutilgan: FAIL — 404 (marshrut hali yo'q).

- [ ] **Step 6: Service, DTO, controller, module**

`apps/api/src/objects/objects.dto.ts`:

```ts
import { createZodDto } from 'nestjs-zod';
import { ObjectDetailSchema, ObjectListItemSchema } from '@rieltor/shared';

// Swagger sxemasi shu sinflardan generatsiya qilinadi — tip manbasi baribir @rieltor/shared.
export class ObjectDetailDto extends createZodDto(ObjectDetailSchema) {}
export class ObjectListItemDto extends createZodDto(ObjectListItemSchema) {}
```

`apps/api/src/objects/objects.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import type { ObjectDetail, ObjectListItem } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { detailgaAylantir, royxatgaAylantir } from './mapper';

const TOLIQ_INCLUDE = { agent: true, rasmlar: { orderBy: { tartib: 'asc' } } } as const;

@Injectable()
export class ObjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async royxat(): Promise<ObjectListItem[]> {
    const qatorlar = await this.prisma.object.findMany({
      include: TOLIQ_INCLUDE,
      orderBy: { id: 'asc' },
    });
    return qatorlar.map(royxatgaAylantir);
  }

  async bittasi(id: string): Promise<ObjectDetail> {
    const qator = await this.prisma.object.findUnique({ where: { id }, include: TOLIQ_INCLUDE });
    if (!qator) {
      throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    }
    return detailgaAylantir(qator);
  }
}
```

`apps/api/src/objects/objects.controller.ts`:

```ts
import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ObjectDetailDto, ObjectListItemDto } from './objects.dto';
import { ObjectsService } from './objects.service';

@ApiTags('objects')
@Controller('objects')
export class ObjectsController {
  constructor(private readonly objects: ObjectsService) {}

  @Get()
  @ApiOkResponse({ type: [ObjectListItemDto] })
  royxat() {
    return this.objects.royxat();
  }

  @Get(':id')
  @ApiOkResponse({ type: ObjectDetailDto })
  @ApiNotFoundResponse({ description: 'Obyekt topilmadi' })
  bittasi(@Param('id') id: string) {
    return this.objects.bittasi(id);
  }
}
```

`apps/api/src/objects/objects.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ObjectsController } from './objects.controller';
import { ObjectsService } from './objects.service';

@Module({
  controllers: [ObjectsController],
  providers: [ObjectsService],
  exports: [ObjectsService],
})
export class ObjectsModule {}
```

`apps/api/src/app.module.ts` `imports` ga `ObjectsModule` qo'sh (import satri bilan birga).

- [ ] **Step 7: Testlarni qayta ishga tushir**

```bash
yarn workspace @rieltor/api test
```

Kutilgan: mapper unit + objects e2e + health e2e — hammasi PASS.

- [ ] **Step 8: Swagger'ni ko'z bilan tekshir**

```bash
yarn workspace @rieltor/api dev
```

Brauzerda `http://localhost:3000/api/docs` — `objects` tegi ostida ikki endpoint, `ObjectDetailDto` sxemasi `narxSom: string` bilan ko'rinishi kerak. So'ng serverni to'xtat.

- [ ] **Step 9: Commit**

```bash
yarn lint && yarn typecheck
git add -A
git commit -m "feat(api): obyektlar endpointlari, mapper va Swagger sxemalari"
```

---

## Task 8: Ko'rishlar hisoblagichi API'si

Spec §6: atomik increment, IP+obyekt bo'yicha 10 daqiqalik oyna, limitdan oshsa **200 va joriy son** (429 emas — foydalanuvchi hech nima sezmasligi kerak).

**Files:**

- Create: `apps/api/src/views/views.service.ts`, `views.service.test.ts`, `views.controller.ts`, `views.module.ts`, `views.dto.ts`
- Create: `apps/api/test/views.e2e-spec.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**

- Consumes: `PrismaService` (Task 4), `ViewsSchema` (Task 2)
- Produces:
  - `ViewsService.korish(id: string, ip: string): Promise<number>` — oyna ichida takror bo'lsa incrementsiz joriy sonni qaytaradi
  - `ViewsService.joriy(id: string): Promise<number>`
  - `POST /api/view/:id` → `{ views }`, `GET /api/view/:id` → `{ views }`

> **Nega `@nestjs/throttler` emas?** Throttler guard limitdan oshganda 429 tashlaydi, bizga esa 200 + joriy son kerak. Oynani service ichida saqlash sodda, testlanadigan va spec talabiga aniq mos.

- [ ] **Step 1: Service testini yoz**

`apps/api/src/views/views.service.test.ts`:

```ts
import { NotFoundException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewsService } from './views.service';

function prismaSoxta(boshlangich = 5) {
  const holat = { views: boshlangich, mavjud: true };
  return {
    holat,
    object: {
      update: vi.fn(async () => {
        if (!holat.mavjud) {
          const xato = new Error('Record to update not found.') as Error & { code: string };
          xato.code = 'P2025';
          throw xato;
        }
        holat.views += 1;
        return { views: holat.views };
      }),
      findUnique: vi.fn(async () => (holat.mavjud ? { views: holat.views } : null)),
    },
  };
}

describe('ViewsService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('birinchi kirishda sonni oshiradi', async () => {
    const prisma = prismaSoxta(5);
    const service = new ViewsService(prisma as never);
    expect(await service.korish('bx-001', '1.1.1.1')).toBe(6);
  });

  it('oyna ichida takror kirishda oshirmaydi', async () => {
    const prisma = prismaSoxta(5);
    const service = new ViewsService(prisma as never);

    await service.korish('bx-001', '1.1.1.1');
    const ikkinchi = await service.korish('bx-001', '1.1.1.1');

    expect(ikkinchi).toBe(6);
    expect(prisma.object.update).toHaveBeenCalledTimes(1);
  });

  it('boshqa IP alohida hisoblanadi', async () => {
    const prisma = prismaSoxta(5);
    const service = new ViewsService(prisma as never);

    await service.korish('bx-001', '1.1.1.1');
    expect(await service.korish('bx-001', '2.2.2.2')).toBe(7);
  });

  it('boshqa obyekt alohida hisoblanadi', async () => {
    const prisma = prismaSoxta(5);
    const service = new ViewsService(prisma as never);

    await service.korish('bx-001', '1.1.1.1');
    await service.korish('bx-002', '1.1.1.1');

    expect(prisma.object.update).toHaveBeenCalledTimes(2);
  });

  it('oyna tugagach yana oshiradi', async () => {
    const prisma = prismaSoxta(5);
    const service = new ViewsService(prisma as never);

    await service.korish('bx-001', '1.1.1.1');
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    await service.korish('bx-001', '1.1.1.1');

    expect(prisma.object.update).toHaveBeenCalledTimes(2);
  });

  it("mavjud bo'lmagan obyektda NotFoundException", async () => {
    const prisma = prismaSoxta(5);
    prisma.holat.mavjud = false;
    const service = new ViewsService(prisma as never);

    await expect(service.korish('yoq-000', '1.1.1.1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('joriy() sonni oshirmasdan qaytaradi', async () => {
    const prisma = prismaSoxta(5);
    const service = new ViewsService(prisma as never);

    expect(await service.joriy('bx-001')).toBe(5);
    expect(prisma.object.update).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Testni fail holatida ko'r**

```bash
yarn workspace @rieltor/api test
```

Kutilgan: FAIL — `Failed to resolve import "./views.service"`.

- [ ] **Step 3: Service'ni yoz**

`apps/api/src/views/views.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Bitta IP bitta obyektni shu oyna ichida faqat bir marta oshira oladi. */
const OYNA_MS = 10 * 60 * 1000;
/** Xotira cheksiz o'smasligi uchun tozalash chegarasi. */
const MAKS_KALIT = 10_000;

@Injectable()
export class ViewsService {
  private readonly songgiKirish = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  async korish(id: string, ip: string): Promise<number> {
    // JSON.stringify — oddiy ajratgich emas. `trust proxy` yoqilgani uchun `ip`
    // X-Forwarded-For dan keladi va Express uni IP shaklida ekanini tekshirmaydi,
    // ya'ni ichida ajratgich belgisi bo'lishi mumkin. `${ip}|${id}` da
    // ("A|B","C") va ("A","B|C") bir xil kalit berardi.
    const kalit = JSON.stringify([ip, id]);
    const hozir = Date.now();
    const songgi = this.songgiKirish.get(kalit);

    if (songgi !== undefined && hozir - songgi < OYNA_MS) {
      // Limitdan oshdi — lekin foydalanuvchiga xato emas, joriy son qaytariladi.
      return this.joriy(id);
    }

    this.tozala(hozir);
    this.songgiKirish.set(kalit, hozir);

    try {
      // Atomik: UPDATE ... SET views = views + 1 RETURNING views
      const qator = await this.prisma.object.update({
        where: { id },
        data: { views: { increment: 1 } },
        select: { views: true },
      });
      return qator.views;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        this.songgiKirish.delete(kalit);
        throw new NotFoundException(`Obyekt topilmadi: ${id}`);
      }
      throw error;
    }
  }

  async joriy(id: string): Promise<number> {
    const qator = await this.prisma.object.findUnique({ where: { id }, select: { views: true } });
    if (!qator) {
      throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    }
    return qator.views;
  }

  private tozala(hozir: number): void {
    if (this.songgiKirish.size < MAKS_KALIT) return;
    for (const [kalit, vaqt] of this.songgiKirish) {
      if (hozir - vaqt >= OYNA_MS) this.songgiKirish.delete(kalit);
    }
  }
}
```

- [ ] **Step 4: Testni qayta ishga tushir**

```bash
yarn workspace @rieltor/api test
```

Kutilgan: 7 test PASS.

- [ ] **Step 5: e2e testini yoz**

`apps/api/test/views.e2e-spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ViewsSchema } from '@rieltor/shared';
import { AppModule } from '../src/app.module';

describe('Views (e2e)', () => {
  // `app.set(...)` INestApplication da yo'q — Express'ga xos metod.
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.set('trust proxy', true);
    app.setGlobalPrefix('api', { exclude: [] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/view/:id sonni oshiradi', async () => {
    const oldin = await request(app.getHttpServer()).get('/api/view/bx-001').expect(200);
    const keyin = await request(app.getHttpServer())
      .post('/api/view/bx-001')
      .set('X-Forwarded-For', '203.0.113.10')
      .expect(201);

    expect(ViewsSchema.parse(keyin.body).views).toBe(ViewsSchema.parse(oldin.body).views + 1);
  });

  it('bir xil IP dan takror POST sonni oshirmaydi', async () => {
    const birinchi = await request(app.getHttpServer())
      .post('/api/view/bx-002')
      .set('X-Forwarded-For', '203.0.113.20')
      .expect(201);
    const ikkinchi = await request(app.getHttpServer())
      .post('/api/view/bx-002')
      .set('X-Forwarded-For', '203.0.113.20')
      .expect(201);

    expect(ikkinchi.body.views).toBe(birinchi.body.views);
  });

  it('boshqa IP dan POST sonni oshiradi', async () => {
    const birinchi = await request(app.getHttpServer())
      .post('/api/view/bx-003')
      .set('X-Forwarded-For', '203.0.113.30')
      .expect(201);
    const ikkinchi = await request(app.getHttpServer())
      .post('/api/view/bx-003')
      .set('X-Forwarded-For', '203.0.113.31')
      .expect(201);

    expect(ikkinchi.body.views).toBe(birinchi.body.views + 1);
  });

  it('GET sonni oshirmaydi', async () => {
    const a = await request(app.getHttpServer()).get('/api/view/bx-001').expect(200);
    const b = await request(app.getHttpServer()).get('/api/view/bx-001').expect(200);
    expect(b.body.views).toBe(a.body.views);
  });

  it("mavjud bo'lmagan id → 404", async () => {
    await request(app.getHttpServer()).get('/api/view/yoq-000').expect(404);
    await request(app.getHttpServer())
      .post('/api/view/yoq-000')
      .set('X-Forwarded-For', '203.0.113.99')
      .expect(404);
  });
});
```

```bash
yarn workspace @rieltor/api test:e2e
```

Kutilgan: FAIL — marshrut yo'q.

- [ ] **Step 6: DTO, controller, module**

`apps/api/src/views/views.dto.ts`:

```ts
import { createZodDto } from 'nestjs-zod';
import { ViewsSchema } from '@rieltor/shared';

export class ViewsDto extends createZodDto(ViewsSchema) {}
```

`apps/api/src/views/views.controller.ts`:

```ts
import { Controller, Get, Ip, Param, Post } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ViewsDto } from './views.dto';
import { ViewsService } from './views.service';

@ApiTags('views')
@Controller('view')
export class ViewsController {
  constructor(private readonly views: ViewsService) {}

  @Post(':id')
  @ApiOkResponse({ type: ViewsDto })
  @ApiNotFoundResponse({ description: 'Obyekt topilmadi' })
  async korish(@Param('id') id: string, @Ip() ip: string) {
    return { views: await this.views.korish(id, ip) };
  }

  @Get(':id')
  @ApiOkResponse({ type: ViewsDto })
  @ApiNotFoundResponse({ description: 'Obyekt topilmadi' })
  async joriy(@Param('id') id: string) {
    return { views: await this.views.joriy(id) };
  }
}
```

`apps/api/src/views/views.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ViewsController } from './views.controller';
import { ViewsService } from './views.service';

@Module({ controllers: [ViewsController], providers: [ViewsService] })
export class ViewsModule {}
```

`apps/api/src/app.module.ts` `imports` ga `ViewsModule` qo'sh.

- [ ] **Step 7: Reverse proxy ortida to'g'ri IP olish**

`apps/api/src/main.ts` da `NestFactory.create` dan keyin qo'sh:

```ts
// Railway/Render ortida haqiqiy mijoz IP'si X-Forwarded-For da keladi.
app.set('trust proxy', 1);
```

Bu `NestExpressApplication` tipini talab qiladi — `create` chaqiruvini almashtir:

```ts
import { NestExpressApplication } from '@nestjs/platform-express';
// ...
const app = await NestFactory.create<NestExpressApplication>(AppModule);
```

- [ ] **Step 8: Testlarni qayta ishga tushir**

```bash
yarn workspace @rieltor/api test
```

Kutilgan: barcha unit va e2e PASS.

> Agar `bir xil IP dan takror POST` testi tushsa — service instansi e2e fayllar orasida qayta yaratilishi mumkin. `vitest.config.e2e.ts` da `fileParallelism: false` borligini tekshir (Task 3, Step 3).

- [ ] **Step 9: Commit**

```bash
yarn lint && yarn typecheck
git add -A
git commit -m "feat(api): ko'rishlar hisoblagichi — atomik increment va IP oynasi"
```

---

## Task 9: Web skeleti — Vite, Tailwind v4, Router, TanStack Query

FSD qatlamlari, dizayn tokenlari, API klienti va ikkita sodda sahifa (`/` va 404). Obyekt sahifasi Task 10–13 da to'ldiriladi.

**Files:**

- Create: `apps/web/package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `vitest.config.ts`, `index.html`, `vitest.setup.ts`
- Create: `apps/web/src/main.tsx`, `src/app/providers.tsx`, `src/app/router.tsx`, `src/app/index.css`
- Create: `src/shared/config/index.ts`, `src/shared/api/client.ts`, `src/shared/api/client.test.ts`, `src/shared/lib/cn.ts`
- Create: `src/entities/object/api.ts`, `src/entities/object/index.ts`
- Create: `src/pages/home/ui/home-page.tsx`, `src/pages/home/index.ts`, `src/pages/home/ui/home-page.test.tsx`
- Create: `src/pages/not-found/ui/not-found-page.tsx`, `src/pages/not-found/index.ts`
- Modify: `eslint.config.mjs` (FSD chegara qoidasi)

**Interfaces:**

- Consumes: `@rieltor/shared` (Task 2), API endpointlari (Task 7, 8)
- Produces:
  - `apiGet<T>(path: string, schema: ZodType<T>): Promise<T>` — `shared/api/client.ts`
  - `apiPost<T>(path: string, schema: ZodType<T>): Promise<T>`
  - `objectRoyxatQuery()` va `objectQuery(id: string)` — TanStack Query `queryOptions` obyektlari (`entities/object`)
  - `cn(...)` — sinf nomlarini birlashtiruvchi (`shared/lib/cn.ts`)
  - Marshrutlar: `/`, `/obj/:id`, `*` → 404

- [ ] **Step 1: Paket va bog'liqliklar**

```bash
mkdir -p apps/web/src
```

`apps/web/package.json`:

```json
{
  "name": "@rieltor/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b --noEmit",
    "test": "vitest run",
    "lint": "eslint src"
  },
  "dependencies": {
    "@fontsource-variable/inter": "^5.1.0",
    "@rieltor/shared": "workspace:*",
    "@tanstack/react-query": "^5.62.0",
    "clsx": "^2.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.1.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.2",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

```bash
yarn install
```

- [ ] **Step 2: Vite, TypeScript va Vitest konfiguratsiyasi**

`apps/web/vite.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': new URL('./src/', import.meta.url).pathname } },
  server: {
    port: 5173,
    // Dev'da API va rasmlar NestJS'dan keladi — prod'da ular bir xil originda bo'ladi.
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/images': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
});
```

`apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "types": ["vite/client"],
    "noEmit": true,
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  },
  "include": ["src", "vitest.setup.ts"]
}
```

`apps/web/vitest.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': new URL('./src/', import.meta.url).pathname } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

`apps/web/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Dizayn tokenlari va HTML qobiq**

`apps/web/src/app/index.css`:

```css
@import 'tailwindcss';
@import '@fontsource-variable/inter';

@theme {
  /* Yagona urg'u rang — komponentlarda hech qachon hex yozilmaydi (spec §10). */
  --color-accent: #1d4ed8;

  --font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;

  --radius-card: 1rem;

  /* Kontent kengligi — mobil-first, desktopda markazda (spec §10). */
  /* max-w-* utility'lari `--container-*` namespace'idan keladi, `--spacing-*` dan EMAS.
     `--spacing-content` deb yozilsa `max-w-content` umuman generatsiya qilinmaydi va
     desktopdagi 480px cheklovi jimgina ishlamay qoladi. */
  --container-content: 30rem; /* 480px */
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-sans);
  background-color: white;
  color: var(--color-slate-900);
}

/* Sticky CTA balandligi — sahifa oxiri tugmalar ostida qolib ketmasligi uchun. */
:root {
  --cta-balandlik: 4.5rem;
}
```

`apps/web/index.html`:

```html
<!doctype html>
<html lang="uz">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Rieltor Generator</title>
    <!-- OG teglari server tomonda shu joyga inject qilinadi (Task 14). Marker o'zgartirilmasin. -->
    <!--OG-META-->
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: API klienti uchun test yoz**

`apps/web/src/shared/api/client.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import { apiGet, ApiXatosi } from './client';

const Sxema = z.object({ views: z.number().int() });

afterEach(() => vi.unstubAllGlobals());

function fetchSoxta(status: number, body: unknown) {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

describe('apiGet', () => {
  it('javobni sxema bilan parse qiladi', async () => {
    vi.stubGlobal('fetch', fetchSoxta(200, { views: 7 }));
    expect(await apiGet('/api/view/bx-001', Sxema)).toEqual({ views: 7 });
  });

  it('404 da status bilan ApiXatosi tashlaydi', async () => {
    vi.stubGlobal('fetch', fetchSoxta(404, { message: 'topilmadi' }));
    await expect(apiGet('/api/view/yoq', Sxema)).rejects.toMatchObject({ status: 404 });
  });

  it('sxemaga mos kelmagan javobda xato tashlaydi', async () => {
    vi.stubGlobal('fetch', fetchSoxta(200, { views: 'kop' }));
    await expect(apiGet('/api/view/bx-001', Sxema)).rejects.toThrow();
  });

  it('ApiXatosi instansi to'g'ri tipda', async () => {
    vi.stubGlobal('fetch', fetchSoxta(500, {}));
    await expect(apiGet('/api/view/bx-001', Sxema)).rejects.toBeInstanceOf(ApiXatosi);
  });
});
```

Apostrofli tavsifni ikki tirnoqqa o'zgartir: `it("ApiXatosi instansi to'g'ri tipda", ...)`.

- [ ] **Step 5: Testni fail holatida ko'r, so'ng klientni yoz**

```bash
yarn workspace @rieltor/web test
```

Kutilgan: FAIL — `Failed to resolve import "./client"`.

`apps/web/src/shared/api/client.ts`:

```ts
import type { ZodType } from 'zod';

export class ApiXatosi extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiXatosi';
  }
}

async function sorov<T>(path: string, method: 'GET' | 'POST', schema: ZodType<T>): Promise<T> {
  const javob = await fetch(path, {
    method,
    headers: { accept: 'application/json' },
  });

  if (!javob.ok) {
    throw new ApiXatosi(javob.status, `${method} ${path} → ${javob.status}`);
  }

  // parse() mos kelmagan javobda tashlaydi — front noto'g'ri shakldagi ma'lumot bilan ishlamaydi.
  return schema.parse(await javob.json());
}

export function apiGet<T>(path: string, schema: ZodType<T>): Promise<T> {
  return sorov(path, 'GET', schema);
}

export function apiPost<T>(path: string, schema: ZodType<T>): Promise<T> {
  return sorov(path, 'POST', schema);
}
```

```bash
yarn workspace @rieltor/web test
```

Kutilgan: 4 test PASS.

- [ ] **Step 6: `cn` va obyekt query'lari**

`apps/web/src/shared/lib/cn.ts`:

```ts
import clsx, { type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
```

`apps/web/src/entities/object/api.ts`:

```ts
import { queryOptions } from '@tanstack/react-query';
import { ObjectDetailSchema, ObjectListItemSchema } from '@rieltor/shared';
import * as z from 'zod';
import { apiGet } from '@/shared/api/client';

export const objectRoyxatQuery = () =>
  queryOptions({
    queryKey: ['objects'] as const,
    queryFn: () => apiGet('/api/objects', z.array(ObjectListItemSchema)),
  });

export const objectQuery = (id: string) =>
  queryOptions({
    queryKey: ['object', id] as const,
    queryFn: () => apiGet(`/api/objects/${id}`, ObjectDetailSchema),
    // Obyekt ma'lumoti demo davomida o'zgarmaydi.
    staleTime: 5 * 60 * 1000,
  });
```

`apps/web/src/entities/object/index.ts`:

```ts
export { objectQuery, objectRoyxatQuery } from './api';
```

- [ ] **Step 7: Home sahifasi uchun test yoz**

`apps/web/src/pages/home/ui/home-page.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './home-page';

const royxat = [
  {
    id: 'bx-001',
    sarlavha: '3 xonali kvartira',
    narxSom: '780000000',
    narxUsd: 65000,
    xona: 3,
    maydonM2: 84,
    tuman: 'Buxoro shahri',
    rasm: { base: '/images/bx-001/01', ogUrl: null, width: 1200, height: 900, tartib: 1 },
  },
];

function chiqar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('HomePage', () => {
  it('obyektlar ro'yxatini havola sifatida ko'rsatadi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify(royxat), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    chiqar();

    const havola = await screen.findByRole('link', { name: /3 xonali kvartira/ });
    expect(havola).toHaveAttribute('href', '/obj/bx-001');
    expect(screen.getByText("780 000 000 so'm")).toBeInTheDocument();
  });
});
```

Apostrofli tavsifni ikki tirnoqqa o'zgartir.

- [ ] **Step 8: Testni fail holatida ko'r, so'ng sahifalarni yoz**

```bash
yarn workspace @rieltor/web test
```

Kutilgan: FAIL — `Failed to resolve import "./home-page"`.

`apps/web/src/pages/home/ui/home-page.tsx`:

```tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { formatNarxSom, imageFallbackSrc, imageSrcSet, IMAGE_SIZES } from '@rieltor/shared';
import { objectRoyxatQuery } from '@/entities/object';

export function HomePage() {
  const { data, isPending, isError } = useQuery(objectRoyxatQuery());

  if (isPending) return <p className="p-4 text-slate-500">Yuklanmoqda…</p>;
  if (isError) return <p className="p-4 text-slate-500">Obyektlarni yuklab bo'lmadi.</p>;

  return (
    <main className="mx-auto max-w-content p-4">
      <h1 className="mb-4 text-xl font-semibold">Obyektlar</h1>
      <ul className="space-y-3">
        {data.map((obj) => (
          <li key={obj.id}>
            <Link
              to={`/obj/${obj.id}`}
              className="block overflow-hidden rounded-card border border-slate-200"
            >
              {obj.rasm && (
                <img
                  src={imageFallbackSrc(obj.rasm.base)}
                  srcSet={imageSrcSet(obj.rasm.base)}
                  sizes={IMAGE_SIZES}
                  width={obj.rasm.width}
                  height={obj.rasm.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
              )}
              <div className="p-3">
                <p className="font-medium">{obj.sarlavha}</p>
                <p className="mt-1 text-lg font-semibold text-accent">
                  {formatNarxSom(obj.narxSom)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {obj.xona} xona · {obj.maydonM2} m² · {obj.tuman}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

`apps/web/src/pages/home/index.ts`:

```ts
export { HomePage } from './ui/home-page';
```

`apps/web/src/pages/not-found/ui/not-found-page.tsx`:

```tsx
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-4xl font-semibold text-slate-300">404</p>
      <h1 className="text-lg font-medium">Bunday obyekt topilmadi</h1>
      <p className="text-sm text-slate-500">Havola eskirgan yoki e'lon olib tashlangan.</p>
      <Link to="/" className="mt-2 text-accent underline">
        Barcha obyektlar
      </Link>
    </main>
  );
}
```

`apps/web/src/pages/not-found/index.ts`:

```ts
export { NotFoundPage } from './ui/not-found-page';
```

- [ ] **Step 9: Router, providerlar va entry**

`apps/web/src/app/router.tsx`:

```tsx
import { createBrowserRouter } from 'react-router';
import { HomePage } from '@/pages/home';
import { NotFoundPage } from '@/pages/not-found';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  // Obyekt sahifasi Task 10–13 da qo'shiladi.
  { path: '*', element: <NotFoundPage /> },
]);
```

`apps/web/src/app/providers.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

`apps/web/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/providers';
import './app/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root topilmadi');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 10: FSD chegara qoidasini ESLint'ga qo'sh**

```bash
yarn add -D eslint-plugin-boundaries
```

`eslint.config.mjs` ning birinchi qatorlariga import qo'sh:

```js
import boundaries from 'eslint-plugin-boundaries';
```

So'ng fayl oxiridagi `);` dan oldin quyidagi blokni qo'sh:

```js
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'apps/web/src/app/*' },
        { type: 'pages', pattern: 'apps/web/src/pages/*' },
        { type: 'widgets', pattern: 'apps/web/src/widgets/*' },
        { type: 'features', pattern: 'apps/web/src/features/*' },
        { type: 'entities', pattern: 'apps/web/src/entities/*' },
        { type: 'shared', pattern: 'apps/web/src/shared/*' },
      ],
    },
    rules: {
      // FSD: yuqori qatlam faqat pastdagini import qiladi.
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'app', allow: ['pages', 'widgets', 'features', 'entities', 'shared'] },
            { from: 'pages', allow: ['widgets', 'features', 'entities', 'shared'] },
            { from: 'widgets', allow: ['features', 'entities', 'shared'] },
            { from: 'features', allow: ['entities', 'shared'] },
            { from: 'entities', allow: ['shared'] },
            { from: 'shared', allow: ['shared'] },
          ],
        },
      ],
    },
  },
```

- [ ] **Step 11: To'liq tekshiruv**

```bash
yarn workspace @rieltor/web test
yarn workspace @rieltor/web build
yarn lint && yarn typecheck
```

Kutilgan: 5 test PASS, `apps/web/dist/index.html` yaratiladi, lint va typecheck toza.

- [ ] **Step 12: Brauzerda ko'z bilan tekshir**

Ikki terminalda:

```bash
yarn workspace @rieltor/api dev
yarn workspace @rieltor/web dev
```

`http://localhost:5173` — uchta obyekt kartasi rasmi, sarlavhasi va so'mdagi narxi bilan ko'rinishi kerak. Kartaga bosilsa 404 sahifasi chiqadi (obyekt marshruti hali yo'q — bu kutilgan). `http://localhost:5173/yoq` ham 404 beradi.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat(web): Vite/Tailwind/Router skeleti, FSD chegaralari, API klienti va bosh sahifa"
```

---

## Task 10: Obyekt sahifasining sodda komponentlari

Spec §9 dagi 2–6 punktlar: `PriceBlock`, `ParamsRow`, `Description`, `Location` (`entities/object`) va `AgentCard` (`entities/agent`). Hammasi sof prezentatsion — props qabul qiladi, ma'lumot olmaydi.

**Files:**

- Create: `apps/web/src/entities/object/ui/price-block.tsx`, `params-row.tsx`, `description.tsx`, `location.tsx`
- Create: `apps/web/src/entities/object/ui/price-block.test.tsx`, `params-row.test.tsx`
- Create: `apps/web/src/entities/agent/ui/agent-card.tsx`, `agent-card.test.tsx`, `apps/web/src/entities/agent/index.ts`
- Modify: `apps/web/src/entities/object/index.ts`

**Interfaces:**

- Consumes: `formatNarxSom`, `formatNarxUsd`, tiplar `ObjectDetail`, `Agent` (Task 2)
- Produces:
  - `<PriceBlock narxSom={string} narxUsd={number} />`
  - `<ParamsRow xona={number} maydonM2={number} qavat={string | null} tuman={string} />`
  - `<Description matn={string} />`
  - `<Location moljal={string} manzil={string} />`
  - `<AgentCard agent={Agent} />`

- [ ] **Step 1: PriceBlock testini yoz**

`apps/web/src/entities/object/ui/price-block.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PriceBlock } from './price-block';

describe('PriceBlock', () => {
  it("so'm narxini probel bilan ko'rsatadi", () => {
    render(<PriceBlock narxSom="480000000" narxUsd={40000} />);
    expect(screen.getByText("480 000 000 so'm")).toBeInTheDocument();
  });

  it('dollar narxini ham chiqaradi', () => {
    render(<PriceBlock narxSom="480000000" narxUsd={40000} />);
    expect(screen.getByText('$40 000')).toBeInTheDocument();
  });

  it("Int chegarasidan katta narxni yo'qotmaydi", () => {
    render(<PriceBlock narxSom="5000000000" narxUsd={420000} />);
    expect(screen.getByText("5 000 000 000 so'm")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: ParamsRow testini yoz**

`apps/web/src/entities/object/ui/params-row.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ParamsRow } from './params-row';

describe('ParamsRow', () => {
  it("to'rtala parametrni ko'rsatadi", () => {
    render(<ParamsRow xona={2} maydonM2={58} qavat="4/5" tuman="Buxoro shahri" />);
    expect(screen.getByText('2 xona')).toBeInTheDocument();
    expect(screen.getByText('58 m²')).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument();
    expect(screen.getByText('Buxoro shahri')).toBeInTheDocument();
  });

  it("qavat null bo'lsa o'sha elementni chiqarmaydi", () => {
    const { container } = render(
      <ParamsRow xona={5} maydonM2={180} qavat={null} tuman="Kogon tumani" />,
    );
    expect(container.querySelectorAll('li')).toHaveLength(3);
  });
});
```

> Ikkinchi `it(...)` tavsifini ikki tirnoqqa o'zgartir: `it("qavat null bo'lsa o'sha elementni chiqarmaydi", ...)`.

- [ ] **Step 3: Testlarni fail holatida ko'r**

```bash
yarn workspace @rieltor/web test
```

Kutilgan: FAIL — `./price-block` va `./params-row` topilmaydi.

- [ ] **Step 4: Komponentlarni yoz**

`apps/web/src/entities/object/ui/price-block.tsx`:

```tsx
import { formatNarxSom, formatNarxUsd } from '@rieltor/shared';

interface Props {
  narxSom: string;
  narxUsd: number;
}

export function PriceBlock({ narxSom, narxUsd }: Props) {
  return (
    <div className="px-4 pt-4">
      <p className="text-2xl leading-tight font-bold tracking-tight">{formatNarxSom(narxSom)}</p>
      <p className="mt-0.5 text-base text-slate-500">{formatNarxUsd(narxUsd)}</p>
    </div>
  );
}
```

`apps/web/src/entities/object/ui/params-row.tsx`:

```tsx
interface Props {
  xona: number;
  maydonM2: number;
  qavat: string | null;
  tuman: string;
}

/** Ikonkalar — inline SVG. Tashqi ikonka paketi qo'shilmaydi (bundle va LCP uchun). */
const IKONKA = {
  xona: 'M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z',
  maydon: 'M4 4h16v16H4V4Zm0 6h16M10 4v16',
  qavat: 'M4 20h16M4 14h16M4 8h16',
  tuman:
    'M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Zm0-8.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z',
} as const;

function Element({ d, matn }: { d: string; matn: string }) {
  return (
    <li className="flex flex-col items-center gap-1 text-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-5 w-5 text-slate-400"
        aria-hidden="true"
      >
        <path d={d} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm text-slate-700">{matn}</span>
    </li>
  );
}

export function ParamsRow({ xona, maydonM2, qavat, tuman }: Props) {
  return (
    // grid-flow-col + auto-cols-fr — ustunlar soni elementlar soniga qarab o'zi moslashadi,
    // shuning uchun qavat tushib qolganda ham qator teng bo'linadi.
    <ul className="grid auto-cols-fr grid-flow-col gap-2 border-y border-slate-100 px-4 py-3">
      <Element d={IKONKA.xona} matn={`${xona} xona`} />
      <Element d={IKONKA.maydon} matn={`${maydonM2} m²`} />
      {/* Hovlida qavat yo'q — element butunlay tushib qoladi. */}
      {qavat !== null && <Element d={IKONKA.qavat} matn={qavat} />}
      <Element d={IKONKA.tuman} matn={tuman} />
    </ul>
  );
}
```

`apps/web/src/entities/object/ui/description.tsx`:

```tsx
export function Description({ matn }: { matn: string }) {
  return (
    <section className="px-4 py-4">
      <h2 className="mb-1.5 text-sm font-semibold text-slate-900">Tavsif</h2>
      <p className="text-[15px] leading-relaxed whitespace-pre-line text-slate-700">{matn}</p>
    </section>
  );
}
```

`apps/web/src/entities/object/ui/location.tsx`:

```tsx
interface Props {
  moljal: string;
  manzil: string;
}

/** Xarita YO'Q — spec §9 bo'yicha qamrovdan tashqarida. Faqat matn. */
export function Location({ moljal, manzil }: Props) {
  return (
    <section className="border-t border-slate-100 px-4 py-4">
      <h2 className="mb-1.5 text-sm font-semibold text-slate-900">Joylashuv</h2>
      <p className="text-[15px] text-slate-700">{manzil}</p>
      <p className="mt-0.5 text-sm text-slate-500">{moljal}</p>
    </section>
  );
}
```

`apps/web/src/entities/object/index.ts` ni almashtir:

```ts
export { objectQuery, objectRoyxatQuery } from './api';
export { Description } from './ui/description';
export { Location } from './ui/location';
export { ParamsRow } from './ui/params-row';
export { PriceBlock } from './ui/price-block';
```

- [ ] **Step 5: AgentCard testini yoz**

`apps/web/src/entities/agent/ui/agent-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AgentCard } from './agent-card';

const agent = {
  id: 'agent-1',
  ism: 'Murod',
  agentlik: 'Buxoro Uy',
  suratUrl: '/images/agents/agent-1.jpg',
  tel: '+998901234567',
  tg: 'murod',
};

describe('AgentCard', () => {
  it('ism, agentlik va telefonni matn sifatida chiqaradi', () => {
    render(<AgentCard agent={agent} />);
    expect(screen.getByText('Murod')).toBeInTheDocument();
    expect(screen.getByText('Buxoro Uy')).toBeInTheDocument();
    expect(screen.getByText('+998 90 123 45 67')).toBeInTheDocument();
  });

  it('suratga alt matn beradi', () => {
    render(<AgentCard agent={agent} />);
    expect(screen.getByAltText('Murod')).toHaveAttribute('src', '/images/agents/agent-1.jpg');
  });
});
```

- [ ] **Step 6: AgentCard va telefon formatterini yoz**

`apps/web/src/entities/agent/ui/agent-card.tsx`:

```tsx
import type { Agent } from '@rieltor/shared';

/** +998901234567 → "+998 90 123 45 67". Boshqa formatda kelsa o'zgartirmaydi. */
export function formatTel(tel: string): string {
  const m = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(tel);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : tel;
}

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <section className="flex items-center gap-3 border-t border-slate-100 px-4 py-4">
      <img
        src={agent.suratUrl}
        alt={agent.ism}
        width={56}
        height={56}
        loading="lazy"
        decoding="async"
        className="h-14 w-14 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0">
        <p className="font-medium">{agent.ism}</p>
        <p className="text-sm text-slate-500">{agent.agentlik}</p>
        <p className="mt-0.5 text-sm text-slate-700">{formatTel(agent.tel)}</p>
      </div>
    </section>
  );
}
```

`apps/web/src/entities/agent/index.ts`:

```ts
export { AgentCard, formatTel } from './ui/agent-card';
```

- [ ] **Step 7: Testlarni ishga tushir va commit**

```bash
yarn workspace @rieltor/web test
yarn lint && yarn typecheck
```

Kutilgan: barcha testlar PASS (5 ta oldingi + 7 ta yangi).

```bash
git add -A
git commit -m "feat(web): narx, parametrlar, tavsif, joylashuv va rieltor kartasi komponentlari"
```

---

## Task 11: `Gallery` — svayp galereyasi va responsive rasm

Spec §9.1: touch-svayp, nuqtali indikator, birinchi rasm LCP. **Kutubxona qo'shilmaydi** — CSS `scroll-snap` + `IntersectionObserver`.

**Files:**

- Create: `apps/web/src/shared/ui/responsive-image.tsx`
- Create: `apps/web/src/widgets/gallery/ui/gallery.tsx`, `gallery.test.tsx`, `apps/web/src/widgets/gallery/index.ts`

**Interfaces:**

- Consumes: `imageSrcSet`, `imageFallbackSrc`, `IMAGE_SIZES` (Task 2), tip `Rasm`
- Produces:
  - `<ResponsiveImage rasm={Rasm} alt={string} birinchi={boolean} className={string?} />`
  - `<Gallery rasmlar={Rasm[]} alt={string} />`

- [ ] **Step 1: Gallery testini yoz**

`apps/web/src/widgets/gallery/ui/gallery.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Gallery } from './gallery';

const rasmlar = [
  {
    base: '/images/bx-001/01',
    ogUrl: '/images/bx-001/og.jpg',
    width: 1200,
    height: 900,
    tartib: 1,
  },
  { base: '/images/bx-001/02', ogUrl: null, width: 1200, height: 900, tartib: 2 },
  { base: '/images/bx-001/03', ogUrl: null, width: 1200, height: 900, tartib: 3 },
];

beforeEach(() => {
  // jsdom'da IntersectionObserver yo'q — komponent unsiz ham qulamasligi kerak.
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});

describe('Gallery', () => {
  it('har rasm uchun bitta img chiqaradi', () => {
    render(<Gallery rasmlar={rasmlar} alt="Kvartira" />);
    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('birinchi rasmni ustuvor yuklaydi, qolganlarini lazy', () => {
    render(<Gallery rasmlar={rasmlar} alt="Kvartira" />);
    const imgs = screen.getAllByRole('img');
    expect(imgs[0]).toHaveAttribute('loading', 'eager');
    expect(imgs[0]).toHaveAttribute('fetchpriority', 'high');
    expect(imgs[1]).toHaveAttribute('loading', 'lazy');
  });

  it('srcset va sizes beradi', () => {
    render(<Gallery rasmlar={rasmlar} alt="Kvartira" />);
    const img = screen.getAllByRole('img')[0];
    expect(img).toHaveAttribute(
      'srcset',
      expect.stringContaining('/images/bx-001/01-720.webp 720w'),
    );
    expect(img).toHaveAttribute('sizes', '(max-width: 480px) 100vw, 480px');
  });

  it('CLS oldini olish uchun width/height beradi', () => {
    render(<Gallery rasmlar={rasmlar} alt="Kvartira" />);
    const img = screen.getAllByRole('img')[0];
    expect(img).toHaveAttribute('width', '1200');
    expect(img).toHaveAttribute('height', '900');
  });

  it('rasmlar soniga teng nuqta indikatori chiqaradi', () => {
    render(<Gallery rasmlar={rasmlar} alt="Kvartira" />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('birinchi nuqta boshida faol', () => {
    render(<Gallery rasmlar={rasmlar} alt="Kvartira" />);
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('bitta rasmda indikator chiqmaydi', () => {
    render(<Gallery rasmlar={[rasmlar[0]!]} alt="Kvartira" />);
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Testni fail holatida ko'r**

```bash
yarn workspace @rieltor/web test
```

Kutilgan: FAIL — `./gallery` topilmaydi.

- [ ] **Step 3: `ResponsiveImage` ni yoz**

`apps/web/src/shared/ui/responsive-image.tsx`:

```tsx
import { IMAGE_SIZES, imageFallbackSrc, imageSrcSet, type Rasm } from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';

interface Props {
  rasm: Rasm;
  alt: string;
  /** Birinchi rasm = LCP nomzodi: eager + fetchpriority=high (spec §7). */
  birinchi?: boolean;
  className?: string;
}

export function ResponsiveImage({ rasm, alt, birinchi = false, className }: Props) {
  return (
    <img
      src={imageFallbackSrc(rasm.base)}
      srcSet={imageSrcSet(rasm.base)}
      sizes={IMAGE_SIZES}
      width={rasm.width}
      height={rasm.height}
      alt={alt}
      loading={birinchi ? 'eager' : 'lazy'}
      fetchPriority={birinchi ? 'high' : 'auto'}
      decoding={birinchi ? 'sync' : 'async'}
      className={cn('object-cover', className)}
    />
  );
}
```

- [ ] **Step 4: `Gallery` ni yoz**

`apps/web/src/widgets/gallery/ui/gallery.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import type { Rasm } from '@rieltor/shared';
import { ResponsiveImage } from '@/shared/ui/responsive-image';

interface Props {
  rasmlar: Rasm[];
  alt: string;
}

/**
 * Svayp CSS scroll-snap orqali — kutubxonasiz.
 * iOS'da native momentum ishlaydi, JS bundle o'smaydi, LCP'ga xalaqit bermaydi.
 */
export function Gallery({ rasmlar, alt }: Props) {
  const [faol, setFaol] = useState(0);
  const lentaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lenta = lentaRef.current;
    if (!lenta || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (yozuvlar) => {
        for (const yozuv of yozuvlar) {
          if (!yozuv.isIntersecting) continue;
          const index = Number((yozuv.target as HTMLElement).dataset.index);
          if (!Number.isNaN(index)) setFaol(index);
        }
      },
      { root: lenta, threshold: 0.6 },
    );

    for (const bola of lenta.children) observer.observe(bola);
    return () => observer.disconnect();
  }, [rasmlar.length]);

  function nuqtagaOt(index: number) {
    const bola = lentaRef.current?.children[index];
    bola?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }

  return (
    <div className="relative">
      <div
        ref={lentaRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {rasmlar.map((rasm, i) => (
          <div key={rasm.base} data-index={i} className="w-full shrink-0 snap-start">
            <ResponsiveImage
              rasm={rasm}
              // Har rasmga o'z o'rnini bildiruvchi alt. Bo'sh alt bo'lsa <img>
              // role="presentation" ga aylanadi (test getAllByRole('img') bilan
              // sanaydi), bir xil alt bo'lsa esa ekran o'quvchi bitta jumlani
              // besh marta o'qiydi. Bu rasmlar bezak emas — uyning xonalari.
              alt={`${alt} — ${i + 1}/${rasmlar.length}`}
              birinchi={i === 0}
              className="aspect-[4/3] w-full"
            />
          </div>
        ))}
      </div>

      {rasmlar.length > 1 && (
        <div
          role="tablist"
          aria-label="Rasmlar"
          className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5"
        >
          {rasmlar.map((rasm, i) => (
            <button
              key={rasm.base}
              type="button"
              role="tab"
              aria-selected={i === faol}
              aria-label={`${i + 1}-rasm`}
              onClick={() => nuqtagaOt(i)}
              className={
                i === faol
                  ? 'h-1.5 w-4 rounded-full bg-white shadow'
                  : 'h-1.5 w-1.5 rounded-full bg-white/60 shadow'
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

`apps/web/src/widgets/gallery/index.ts`:

```ts
export { Gallery } from './ui/gallery';
```

- [ ] **Step 5: Testlarni qayta ishga tushir**

```bash
yarn workspace @rieltor/web test
```

Kutilgan: 7 ta yangi test PASS.

> `fetchpriority` atributi: React 19 `fetchPriority` prop'ini kichik harfli HTML atributiga aylantiradi. Test `toHaveAttribute('fetchpriority', 'high')` bilan tekshiradi — agar tushsa, React versiyasini tekshir.

- [ ] **Step 6: Commit**

```bash
yarn lint && yarn typecheck
git add -A
git commit -m "feat(web): kutubxonasiz svayp galereyasi va responsive rasm komponenti"
```

---

## Task 12: `StickyCTA` va obyekt sahifasini yig'ish

Spec §9.7: ekran pastiga yopishgan ikki tugma, iOS safe-area hisobga olingan. So'ng `/obj/:id` marshruti barcha komponentlarni birlashtiradi.

**Files:**

- Create: `apps/web/src/widgets/sticky-cta/ui/sticky-cta.tsx`, `sticky-cta.test.tsx`, `apps/web/src/widgets/sticky-cta/index.ts`
- Create: `apps/web/src/pages/object/ui/object-page.tsx`, `object-page.test.tsx`, `apps/web/src/pages/object/index.ts`
- Modify: `apps/web/src/app/router.tsx`

**Interfaces:**

- Consumes: `Gallery` (Task 11), `PriceBlock`/`ParamsRow`/`Description`/`Location` (Task 10), `AgentCard` (Task 10), `objectQuery` (Task 9)
- Produces:
  - `<StickyCTA tel={string} tg={string} />`
  - `<ObjectPage />` — `useParams()` dan `id` oladi, `objectQuery` bilan yuklaydi, 404 da `NotFoundPage` ko'rsatadi

- [ ] **Step 1: StickyCTA testini yoz**

`apps/web/src/widgets/sticky-cta/ui/sticky-cta.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StickyCTA } from './sticky-cta';

describe('StickyCTA', () => {
  it("qo'ng'iroq havolasi tel: sxemasi bilan", () => {
    render(<StickyCTA tel="+998901234567" tg="murod" />);
    expect(screen.getByRole('link', { name: /Qo'ng'iroq/ })).toHaveAttribute(
      'href',
      'tel:+998901234567',
    );
  });

  it('Telegram havolasi t.me manzili bilan', () => {
    render(<StickyCTA tel="+998901234567" tg="murod" />);
    expect(screen.getByRole('link', { name: /Telegram/ })).toHaveAttribute(
      'href',
      'https://t.me/murod',
    );
  });

  it('username oldidagi @ belgisini tashlab yuboradi', () => {
    render(<StickyCTA tel="+998901234567" tg="@murod" />);
    expect(screen.getByRole('link', { name: /Telegram/ })).toHaveAttribute(
      'href',
      'https://t.me/murod',
    );
  });

  it('Telegram havolasi yangi oynada ochiladi', () => {
    render(<StickyCTA tel="+998901234567" tg="murod" />);
    const havola = screen.getByRole('link', { name: /Telegram/ });
    expect(havola).toHaveAttribute('target', '_blank');
    expect(havola).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
```

- [ ] **Step 2: Testni fail holatida ko'r, so'ng komponentni yoz**

```bash
yarn workspace @rieltor/web test
```

Kutilgan: FAIL — `./sticky-cta` topilmaydi.

`apps/web/src/widgets/sticky-cta/ui/sticky-cta.tsx`:

```tsx
interface Props {
  tel: string;
  tg: string;
}

export function StickyCTA({ tel, tg }: Props) {
  const username = tg.replace(/^@/, '');

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-content border-t border-slate-200 bg-white/95 px-3 pt-3 backdrop-blur"
      // iOS'da pastki indikator paneli tugmalarni yopib qo'ymasligi uchun (spec §9.7).
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex gap-2">
        <a
          href={`tel:${tel}`}
          className="flex h-12 flex-1 items-center justify-center rounded-xl bg-accent font-medium text-white"
        >
          📞 Qo'ng'iroq
        </a>
        <a
          href={`https://t.me/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 flex-1 items-center justify-center rounded-xl border border-accent font-medium text-accent"
        >
          ✈️ Telegram
        </a>
      </div>
    </div>
  );
}
```

`apps/web/src/widgets/sticky-cta/index.ts`:

```ts
export { StickyCTA } from './ui/sticky-cta';
```

- [ ] **Step 3: Obyekt sahifasi testini yoz**

`apps/web/src/pages/object/ui/object-page.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectPage } from './object-page';

const obyekt = {
  id: 'bx-002',
  sarlavha: '2 xonali kvartira',
  narxSom: '480000000',
  narxUsd: 40000,
  xona: 2,
  maydonM2: 58,
  qavat: '4/5',
  tuman: 'Buxoro shahri',
  manzil: "G'ijduvon ko'chasi 27",
  moljal: '12-maktab yaqinida',
  tavsif: 'Ikki xonali kvartira.',
  turi: 'IKKILAMCHI',
  views: 3,
  sana: '2026-07-22',
  rasmlar: [
    {
      base: '/images/bx-002/01',
      ogUrl: '/images/bx-002/og.jpg',
      width: 1200,
      height: 900,
      tartib: 1,
    },
  ],
  agent: {
    id: 'agent-1',
    ism: 'Murod',
    agentlik: 'Buxoro Uy',
    suratUrl: '/images/agents/agent-1.jpg',
    tel: '+998901234567',
    tg: 'murod',
  },
};

function javob(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function chiqar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/obj/bx-002']}>
        <Routes>
          <Route path="/obj/:id" element={<ObjectPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('ObjectPage', () => {
  it("obyekt maydonlarini ko'rsatadi", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('/api/view/') ? javob(200, { views: 3 }) : javob(200, obyekt),
      ),
    );

    chiqar();

    expect(await screen.findByText("480 000 000 so'm")).toBeInTheDocument();
    expect(screen.getByText('2 xona')).toBeInTheDocument();
    expect(screen.getByText('Ikki xonali kvartira.')).toBeInTheDocument();
    expect(screen.getByText('Murod')).toBeInTheDocument();
  });

  it('CTA tugmalarini seed kontakti bilan chiqaradi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('/api/view/') ? javob(200, { views: 3 }) : javob(200, obyekt),
      ),
    );

    chiqar();

    expect(await screen.findByRole('link', { name: /Qo'ng'iroq/ })).toHaveAttribute(
      'href',
      'tel:+998901234567',
    );
  });

  it('404 da "topilmadi" sahifasini ko\'rsatadi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => javob(404, { message: 'topilmadi' })),
    );

    chiqar();

    expect(await screen.findByText(/topilmadi/i)).toBeInTheDocument();
  });
});
```

> Apostrofli tavsiflarni ikki tirnoqqa o'zgartir: `it("obyekt maydonlarini ko'rsatadi", ...)` va `it('404 da "topilmadi" sahifasini ko\'rsatadi', ...)` → `it("404 da topilmadi sahifasini ko'rsatadi", ...)`.

- [ ] **Step 4: Sahifani yoz**

`apps/web/src/pages/object/ui/object-page.tsx`:

```tsx
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { AgentCard } from '@/entities/agent';
import { Description, Location, ParamsRow, PriceBlock, objectQuery } from '@/entities/object';
import { NotFoundPage } from '@/pages/not-found';
import { ApiXatosi } from '@/shared/api/client';
import { Gallery } from '@/widgets/gallery';
import { StickyCTA } from '@/widgets/sticky-cta';

export function ObjectPage() {
  const { id = '' } = useParams();
  const { data, isPending, error } = useQuery(objectQuery(id));

  if (isPending) {
    return (
      <div className="mx-auto max-w-content">
        <div className="aspect-[4/3] w-full animate-pulse bg-slate-100" />
        <div className="space-y-3 p-4">
          <div className="h-7 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    // 404 — sodda "topilmadi" sahifasi (spec §14). Boshqa xatolar ham shu yerga tushadi.
    if (error instanceof ApiXatosi && error.status === 404) return <NotFoundPage />;
    return <p className="p-4 text-slate-500">Obyektni yuklab bo'lmadi.</p>;
  }

  return (
    <main
      className="mx-auto max-w-content"
      // Sticky CTA sahifa oxirini yopib qo'ymasligi uchun.
      style={{ paddingBottom: 'calc(var(--cta-balandlik) + env(safe-area-inset-bottom))' }}
    >
      <Gallery rasmlar={data.rasmlar} alt={data.sarlavha} />
      <PriceBlock narxSom={data.narxSom} narxUsd={data.narxUsd} />
      <h1 className="px-4 pt-2 text-base font-medium text-slate-800">{data.sarlavha}</h1>
      <ParamsRow xona={data.xona} maydonM2={data.maydonM2} qavat={data.qavat} tuman={data.tuman} />
      <Description matn={data.tavsif} />
      <Location moljal={data.moljal} manzil={data.manzil} />
      <AgentCard agent={data.agent} />
      <StickyCTA tel={data.agent.tel} tg={data.agent.tg} />
    </main>
  );
}
```

`apps/web/src/pages/object/index.ts`:

```ts
export { ObjectPage } from './ui/object-page';
```

- [ ] **Step 5: Marshrutni ulash**

`apps/web/src/app/router.tsx` ni almashtir:

```tsx
import { createBrowserRouter } from 'react-router';
import { HomePage } from '@/pages/home';
import { NotFoundPage } from '@/pages/not-found';
import { ObjectPage } from '@/pages/object';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/obj/:id', element: <ObjectPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
```

- [ ] **Step 6: Testlarni ishga tushir va brauzerda ko'r**

```bash
yarn workspace @rieltor/web test
yarn lint && yarn typecheck
```

Ikki terminalda serverlarni ko'tarib, `http://localhost:5173/obj/bx-002` ni **360px kenglikdagi** brauzer oynasida (DevTools qurilma rejimi) och. Tekshir:

- galereya svayp qilinadi, nuqtalar o'zgaradi
- narx katta, `$` kichik
- pastda ikki tugma doim ko'rinadi va sahifa oxirini yopmaydi
- `/obj/yoq-000` → "Bunday obyekt topilmadi"

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(web): sticky CTA va to'liq obyekt sahifasi"
```

---

## Task 13: `ViewCounter` — hisoblagich va degradatsiya

Spec §6: sessiyada bir marta POST, keyin GET. Xato bo'lsa komponent **hech narsa render qilmaydi**, sahifaning qolgani ishlayveradi.

**Files:**

- Create: `apps/web/src/features/view-counter/model/use-views.ts`, `use-views.test.ts`
- Create: `apps/web/src/features/view-counter/ui/view-counter.tsx`, `view-counter.test.tsx`, `apps/web/src/features/view-counter/index.ts`
- Modify: `apps/web/src/pages/object/ui/object-page.tsx`

**Interfaces:**

- Consumes: `apiGet`, `apiPost` (Task 9), `ViewsSchema` (Task 2)
- Produces:
  - `useViews(id: string)` — `{ views: number | null }`; xatoda `null`
  - `<ViewCounter id={string} />`
  - sessionStorage kaliti: `viewed:<id>`

- [ ] **Step 1: Hook testini yoz**

`apps/web/src/features/view-counter/model/use-views.test.ts`:

```ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useViews } from './use-views';

function javob(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function orov() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('useViews', () => {
  it('birinchi kirishda POST qiladi', async () => {
    const f = vi.fn(async () => javob(200, { views: 8 }));
    vi.stubGlobal('fetch', f);

    const { result } = renderHook(() => useViews('bx-001'), { wrapper: orov() });

    await waitFor(() => expect(result.current.views).toBe(8));
    expect(f).toHaveBeenCalledWith('/api/view/bx-001', expect.objectContaining({ method: 'POST' }));
  });

  it('POST dan keyin sessionStorage kalitini belgilaydi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => javob(200, { views: 8 })),
    );

    const { result } = renderHook(() => useViews('bx-001'), { wrapper: orov() });

    await waitFor(() => expect(result.current.views).toBe(8));
    expect(sessionStorage.getItem('viewed:bx-001')).toBe('1');
  });

  it("kalit mavjud bo'lsa GET qiladi", async () => {
    sessionStorage.setItem('viewed:bx-001', '1');
    const f = vi.fn(async () => javob(200, { views: 8 }));
    vi.stubGlobal('fetch', f);

    const { result } = renderHook(() => useViews('bx-001'), { wrapper: orov() });

    await waitFor(() => expect(result.current.views).toBe(8));
    expect(f).toHaveBeenCalledWith('/api/view/bx-001', expect.objectContaining({ method: 'GET' }));
  });

  it("xatoda views null bo'ladi", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => javob(500, {})),
    );

    const { result } = renderHook(() => useViews('bx-001'), { wrapper: orov() });

    await waitFor(() => expect(result.current.views).toBeNull());
  });
});
```

> Apostrofli tavsiflarni ikki tirnoqqa o'zgartir.

- [ ] **Step 2: Testni fail holatida ko'r, so'ng hookni yoz**

```bash
yarn workspace @rieltor/web test
```

Kutilgan: FAIL — `./use-views` topilmaydi.

`apps/web/src/features/view-counter/model/use-views.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { ViewsSchema } from '@rieltor/shared';
import { apiGet, apiPost } from '@/shared/api/client';

const kalit = (id: string) => `viewed:${id}`;

function korilganmi(id: string): boolean {
  try {
    return sessionStorage.getItem(kalit(id)) === '1';
  } catch {
    // Private rejimda sessionStorage tashlashi mumkin — hisoblagich baribir ishlasin.
    return false;
  }
}

function belgila(id: string): void {
  try {
    sessionStorage.setItem(kalit(id), '1');
  } catch {
    /* e'tiborsiz */
  }
}

export function useViews(id: string): { views: number | null } {
  const { data } = useQuery({
    queryKey: ['views', id] as const,
    queryFn: async () => {
      if (korilganmi(id)) {
        return apiGet(`/api/view/${id}`, ViewsSchema);
      }
      const natija = await apiPost(`/api/view/${id}`, ViewsSchema);
      belgila(id);
      return natija;
    },
    // Degradatsiya (spec §6.3): xatoda qayta urinilmaydi va sahifa bloklanmaydi.
    retry: false,
    staleTime: Infinity,
  });

  return { views: data?.views ?? null };
}
```

- [ ] **Step 3: Komponent testini yoz va komponentni yoz**

`apps/web/src/features/view-counter/ui/view-counter.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewCounter } from './view-counter';

function javob(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function chiqar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ViewCounter id="bx-001" />
    </QueryClientProvider>,
  );
}

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('ViewCounter', () => {
  it("sonni ko'z belgisi bilan chiqaradi", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => javob(200, { views: 42 })),
    );
    chiqar();
    expect(await screen.findByText(/42/)).toBeInTheDocument();
  });

  it('API xato bersa hech narsa render qilmaydi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => javob(500, {})),
    );
    const { container } = chiqar();
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
```

`apps/web/src/features/view-counter/ui/view-counter.tsx`:

```tsx
import { useViews } from '../model/use-views';

export function ViewCounter({ id }: { id: string }) {
  const { views } = useViews(id);

  // Spec §6.3: hisoblagich ishlamasa jimgina yo'qoladi, sahifa qolgani ishlayveradi.
  if (views === null) return null;

  return (
    <p className="px-4 pb-1 text-sm text-slate-400" aria-label={`${views} marta ko'rilgan`}>
      👁 {views}
    </p>
  );
}
```

`apps/web/src/features/view-counter/index.ts`:

```ts
export { ViewCounter } from './ui/view-counter';
```

- [ ] **Step 4: Sahifaga ulash**

`apps/web/src/pages/object/ui/object-page.tsx` da:

- import qo'sh: `import { ViewCounter } from '@/features/view-counter';`
- `<AgentCard ... />` dan keyin, `<StickyCTA ... />` dan oldin qo'y: `<ViewCounter id={data.id} />`

- [ ] **Step 5: Testlar va degradatsiyani qo'lda tekshir**

```bash
yarn workspace @rieltor/web test
yarn lint && yarn typecheck
```

Degradatsiya sinovini qo'lda bajar: API serverni to'xtat, `http://localhost:5173/obj/bx-002` sahifasini ochiq holda **qayta yuklamasdan** turgan holatda emas — aksincha, avval sahifa yuklangan holda API'ni to'xtatib, boshqa obyektga o'tib ko'r. Kutilgan: hisoblagich yo'qoladi, galereya va tugmalar ishlayveradi.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(web): ko'rishlar hisoblagichi — sessiyaga bir marta va degradatsiya"
```

---

## Task 14: OG head-inject — Telegram preview

Loyihaning eng kritik qismi (spec §8). NestJS `/obj/:id` so'roviga `index.html` ning `<head>` iga OG teglarini va LCP rasm preload'ini inject qiladi.

**Files:**

- Create: `apps/api/src/bootstrap.ts`
- Create: `apps/api/src/ssr/meta.ts`, `meta.test.ts`, `html-cache.service.ts`, `ssr.controller.ts`, `ssr.module.ts`
- Create: `apps/api/test/ssr.e2e-spec.ts`
- Modify: `apps/api/src/main.ts`, `src/app.module.ts`, `src/config/env.ts`
- Modify: `apps/api/test/health.e2e-spec.ts`, `objects.e2e-spec.ts`, `views.e2e-spec.ts`

**Interfaces:**

- Consumes: `ObjectsService.bittasi` (Task 7), `PUBLIC_BASE_URL` (Task 3), `imageSrcSet`/`IMAGE_SIZES` (Task 2)
- Produces:
  - `sozla(app: NestExpressApplication): void` — global prefiks, trust proxy, statik fayllar. `main.ts` va **barcha e2e testlar** shuni ishlatadi.
  - `escapeHtml(s: string): string`
  - `metaTeglar(obj: ObjectDetail, baseUrl: string): string`
  - `GET /` va `GET /obj/:id` → inject qilingan HTML

- [ ] **Step 1: `WEB_DIST` env qo'sh**

`apps/api/src/config/env.ts` dagi `envSchema` ga qo'sh:

```ts
  /** Vite build natijasi. Test va Docker'da boshqa yo'l berilishi mumkin. */
  WEB_DIST: z.string().optional(),
```

- [ ] **Step 2: Meta quruvchi testini yoz**

`apps/api/src/ssr/meta.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { escapeHtml, metaTeglar } from './meta';

const obj = {
  id: 'bx-001',
  sarlavha: '3 xonali kvartira, yangi bino',
  narxSom: '780000000',
  narxUsd: 65000,
  xona: 3,
  maydonM2: 84,
  qavat: '6/9',
  tuman: 'Buxoro shahri',
  manzil: 'Manzil',
  moljal: 'Moljal',
  tavsif: 'Birinchi jumla. Ikkinchi jumla. Uchinchi jumla.',
  turi: 'NOVOSTROYKA' as const,
  views: 0,
  sana: '2026-07-20',
  rasmlar: [
    {
      base: '/images/bx-001/01',
      ogUrl: '/images/bx-001/og.jpg',
      width: 1200,
      height: 900,
      tartib: 1,
    },
  ],
  agent: {
    id: 'agent-1',
    ism: 'Rieltor',
    agentlik: 'Agentlik',
    suratUrl: '/images/agents/agent-1.jpg',
    tel: '+998901234567',
    tg: 'username',
  },
};

const BASE = 'https://misol.uz';

describe('escapeHtml', () => {
  it('HTML uchun xavfli belgilarni almashtiradi', () => {
    expect(escapeHtml(`<a href="x">O'g'ri & Co</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;O&#39;g&#39;ri &amp; Co&lt;/a&gt;',
    );
  });
});

describe('metaTeglar', () => {
  const html = metaTeglar(obj, BASE);

  it("sarlavha va narxni og:title ga qo'shadi", () => {
    expect(html).toContain('property="og:title"');
    expect(html).toContain('3 xonali kvartira, yangi bino');
    expect(html).toContain('780 000 000 so&#39;m');
  });

  it('og:image ni absolyut URL qiladi', () => {
    expect(html).toContain(`content="${BASE}/images/bx-001/og.jpg"`);
  });

  it("og:image o'lchamlarini beradi", () => {
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
  });

  it("twitter kartasini katta rasm rejimiga qo'yadi", () => {
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });

  it("og:url ni obyekt manziliga qo'yadi", () => {
    expect(html).toContain(`content="${BASE}/obj/bx-001"`);
  });

  it("LCP rasmi uchun preload qo'shadi", () => {
    expect(html).toContain('rel="preload"');
    expect(html).toContain('as="image"');
    expect(html).toContain('/images/bx-001/01-720.webp 720w');
  });

  it('tavsifni 200 belgigacha qisqartiradi', () => {
    const uzun = { ...obj, tavsif: 'a'.repeat(400) };
    const chiqish = metaTeglar(uzun, BASE);
    const moslik = /property="og:description" content="([^"]*)"/.exec(chiqish);
    expect(moslik?.[1]?.length).toBeLessThanOrEqual(201);
  });

  it("rasm bo'lmasa og:image chiqarmaydi va qulamaydi", () => {
    const rasmsiz = { ...obj, rasmlar: [] };
    expect(() => metaTeglar(rasmsiz, BASE)).not.toThrow();
    expect(metaTeglar(rasmsiz, BASE)).not.toContain('og:image');
  });

  it('sarlavhadagi apostrof head ni buzmaydi', () => {
    const apostrofli = { ...obj, sarlavha: `Kvartira "lyuks" & ta'mir` };
    expect(metaTeglar(apostrofli, BASE)).not.toMatch(/content="[^"]*"[^">]*"/);
  });
});
```

> Apostrofli `it(...)` tavsiflarini ikki tirnoqqa o'zgartir.

- [ ] **Step 3: Testni fail holatida ko'r, so'ng meta quruvchini yoz**

```bash
yarn workspace @rieltor/api test
```

Kutilgan: FAIL — `./meta` topilmaydi.

`apps/api/src/ssr/meta.ts`:

```ts
import { IMAGE_SIZES, formatNarxSom, imageSrcSet, type ObjectDetail } from '@rieltor/shared';

const TAVSIF_MAKS = 200;

/**
 * O'zbekcha sarlavhalarda apostrof ko'p — escape qilinmasa <head> buziladi
 * yoki atributdan chiqib ketish (injection) mumkin bo'ladi.
 */
export function escapeHtml(matn: string): string {
  return matn
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function meta(nom: 'property' | 'name', kalit: string, qiymat: string): string {
  return `<meta ${nom}="${kalit}" content="${escapeHtml(qiymat)}" />`;
}

function qisqartir(matn: string): string {
  const bir = matn.replace(/\s+/g, ' ').trim();
  return bir.length <= TAVSIF_MAKS ? bir : `${bir.slice(0, TAVSIF_MAKS - 1)}…`;
}

export function metaTeglar(obj: ObjectDetail, baseUrl: string): string {
  const sarlavha = `${obj.sarlavha} — ${formatNarxSom(obj.narxSom)}`;
  const tavsif = qisqartir(obj.tavsif);
  const sahifaUrl = `${baseUrl}/obj/${obj.id}`;
  const birinchi = obj.rasmlar[0];

  const teglar = [
    `<title>${escapeHtml(sarlavha)}</title>`,
    meta('name', 'description', tavsif),
    `<link rel="canonical" href="${escapeHtml(sahifaUrl)}" />`,
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', 'Rieltor'),
    meta('property', 'og:url', sahifaUrl),
    meta('property', 'og:title', sarlavha),
    meta('property', 'og:description', tavsif),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', sarlavha),
    meta('name', 'twitter:description', tavsif),
  ];

  if (birinchi?.ogUrl) {
    // Telegram nisbiy yo'lni o'qimaydi — absolyut URL shart.
    teglar.push(
      meta('property', 'og:image', `${baseUrl}${birinchi.ogUrl}`),
      meta('property', 'og:image:width', '1200'),
      meta('property', 'og:image:height', '630'),
      meta('name', 'twitter:image', `${baseUrl}${birinchi.ogUrl}`),
    );
  }

  if (birinchi) {
    // LCP rasmini oldindan yuklash — Lighthouse ≥90 uchun eng katta ta'sir (spec §8).
    teglar.push(
      `<link rel="preload" as="image" imagesrcset="${escapeHtml(imageSrcSet(birinchi.base))}" imagesizes="${escapeHtml(IMAGE_SIZES)}" />`,
    );
  }

  return teglar.join('\n    ');
}
```

```bash
yarn workspace @rieltor/api test
```

Kutilgan: 10 test PASS.

- [ ] **Step 4: HTML keshi va SSR kontrolleri**

`apps/api/src/ssr/html-cache.service.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';

/** index.html ichidagi marker — Vite build'da ham saqlanadi. */
export const OG_MARKER = '<!--OG-META-->';

@Injectable()
export class HtmlCacheService {
  private readonly logger = new Logger(HtmlCacheService.name);
  private kesh: string | null = null;

  constructor(private readonly config: ConfigService<Env, true>) {}

  get distYoli(): string {
    return (
      this.config.get('WEB_DIST', { infer: true }) ??
      resolve(__dirname, '..', '..', '..', 'web', 'dist')
    );
  }

  /** Diskdan bir marta o'qiladi; keyingi so'rovlarda faqat satr almashtirish bo'ladi. */
  async qobiq(): Promise<string> {
    if (this.kesh !== null) return this.kesh;

    const yol = join(this.distYoli, 'index.html');
    const html = await readFile(yol, 'utf8');

    if (!html.includes(OG_MARKER)) {
      this.logger.error(`${yol} ichida ${OG_MARKER} markeri yo'q — OG teglari inject qilinmaydi`);
    }

    this.kesh = html;
    return html;
  }

  /**
   * Markerni tayyor teglar bilan almashtiradi.
   *
   * Avval qobiqdagi mavjud <title> o'chiriladi: `metaTeglar` o'z <title> ini
   * chiqaradi, marker esa index.html da statik <title> dan KEYIN turadi.
   * Tozalanmasa sahifada ikkita <title> qoladi va HTML standarti bo'yicha
   * faqat birinchisi hisobga olinadi — ya'ni brauzer tab'ida e'lon nomi
   * o'rniga umumiy "Rieltor Generator" ko'rinadi. Hech qanday test buni
   * tutmaydi, chunki og:title alohida teg va u to'g'ri chiqadi.
   */
  injectQil(qobiq: string, teglar: string): string {
    const tozalangan = qobiq.replace(/<title>[^<]*<\/title>\s*/i, '');
    return tozalangan.includes(OG_MARKER)
      ? tozalangan.replace(OG_MARKER, teglar)
      : tozalangan.replace('</head>', `    ${teglar}\n  </head>`);
  }
}
```

`apps/api/src/ssr/ssr.controller.ts`:

```ts
import { Controller, Get, Header, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { Env } from '../config/env';
import { ObjectsService } from '../objects/objects.service';
import { HtmlCacheService } from './html-cache.service';
import { metaTeglar } from './meta';

@ApiExcludeController()
@Controller()
export class SsrController {
  constructor(
    private readonly objects: ObjectsService,
    private readonly html: HtmlCacheService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get()
  @Header('content-type', 'text/html; charset=utf-8')
  async bosh(): Promise<string> {
    return this.html.qobiq();
  }

  @Get('obj/:id')
  @Header('content-type', 'text/html; charset=utf-8')
  async obyekt(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const qobiq = await this.html.qobiq();
    const baseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });

    try {
      const obj = await this.objects.bittasi(id);
      return this.html.injectQil(qobiq, metaTeglar(obj, baseUrl));
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      // 404 status bilan bir xil SPA qobig'i — front o'zi "topilmadi" sahifasini ko'rsatadi.
      res.status(404);
      return qobiq;
    }
  }
}
```

`apps/api/src/ssr/ssr.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ObjectsModule } from '../objects/objects.module';
import { HtmlCacheService } from './html-cache.service';
import { SsrController } from './ssr.controller';

@Module({
  imports: [ObjectsModule],
  controllers: [SsrController],
  providers: [HtmlCacheService],
})
export class SsrModule {}
```

`apps/api/src/app.module.ts` `imports` ga `SsrModule` qo'sh (oxirgi bo'lsin).

- [ ] **Step 5: `sozla()` yordamchisini ajrat**

> **Diqqat — bir qismi allaqachon bor.** Task 9 da `main.ts` ga statik rasmlarni serve qilish oldindan qo'shilgan (galereyani 404 rasmlar bilan tekshirib bo'lmagani uchun):
>
> ```ts
> app.useStaticAssets(join(__dirname, '..', 'public', 'images'), { prefix: '/images/' });
> ```
>
> Uni **`sozla()` ichiga ko'chir**, takrorlama. `main.ts` da faqat `sozla(app)` chaqiruvi qolsin.
>
> Yo'l hisobi to'g'ri ishlashi uchun `tsconfig.build.json` da `rootDir: "src"` turishi shart (Task 3) — u holda `__dirname` build'da ham, `nest start --watch` da ham `apps/api/dist` bo'ladi va `resolve(__dirname, '..')` `apps/api` ni beradi. Agar bu buzilsa, `public/` ham, `web/dist` ham noto'g'ri joyga ishora qiladi va hech qanday xato chiqmaydi — rasmlar va Telegram preview jimgina ishlamay qoladi.

`apps/api/src/bootstrap.ts`:

```ts
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { RequestMethod } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

/**
 * main.ts va barcha e2e testlar shu funksiyani ishlatadi —
 * prefiks/exclude ro'yxati ikki joyda ayrilib qolmasligi uchun.
 */
export function sozla(app: NestExpressApplication): void {
  // Railway/Render ortida haqiqiy mijoz IP'si X-Forwarded-For da keladi.
  app.set('trust proxy', 1);

  // SSR marshrutlari 'api' prefiksidan tashqarida bo'lishi shart.
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: 'obj/:id', method: RequestMethod.GET },
    ],
  });

  const apiRoot = resolve(__dirname, '..');
  const publicDir = join(apiRoot, 'public');
  if (existsSync(publicDir)) {
    // Rasmlar: /images/... — kontent-adresli emas, shuning uchun mo'tadil kesh.
    app.useStaticAssets(publicDir, { maxAge: '7d' });
  }

  const webDist = process.env.WEB_DIST ?? resolve(apiRoot, '..', 'web', 'dist');
  if (existsSync(webDist)) {
    // index:false — '/' ni SsrController ushlashi uchun.
    // Vite asset nomlari hash'li, shuning uchun uzoq muddatli immutable kesh.
    app.useStaticAssets(webDist, { index: false, maxAge: '1y', immutable: true });
  }
}
```

`apps/api/src/main.ts` da `app.set('trust proxy', 1)` va `app.setGlobalPrefix(...)` qatorlarini olib tashlab, o'rniga:

```ts
import { sozla } from './bootstrap';
// ...
const app = await NestFactory.create<NestExpressApplication>(AppModule);
sozla(app);
```

Uchala mavjud e2e faylda (`health`, `objects`, `views`) `app.setGlobalPrefix(...)` va `app.set('trust proxy', true)` qatorlarini almashtir:

```ts
import { sozla } from '../src/bootstrap';
// ...
app = moduleRef.createNestApplication<NestExpressApplication>();
sozla(app);
await app.init();
```

`import type { NestExpressApplication } from '@nestjs/platform-express';` ni ham qo'sh va `let app: INestApplication;` ni `let app: NestExpressApplication;` ga o'zgartir.

- [ ] **Step 6: SSR e2e testini yoz**

`apps/api/test/ssr.e2e-spec.ts`:

```ts
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { sozla } from '../src/bootstrap';

const QOBIQ = `<!doctype html>
<html lang="uz"><head><meta charset="UTF-8" /><title>Rieltor Generator</title><!--OG-META--></head>
<body><div id="root"></div></body></html>`;

describe('SSR / OG (e2e)', () => {
  let app: NestExpressApplication;
  let distDir: string;

  beforeAll(async () => {
    distDir = await mkdtemp(join(tmpdir(), 'rieltor-dist-'));
    await writeFile(join(distDir, 'index.html'), QOBIQ, 'utf8');
    process.env.WEB_DIST = distDir;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    sozla(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await rm(distDir, { recursive: true, force: true });
    delete process.env.WEB_DIST;
  });

  it('GET /obj/bx-001 → 200 va og:title narx bilan', async () => {
    const res = await request(app.getHttpServer()).get('/obj/bx-001').expect(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('property="og:title"');
    expect(res.text).toContain('780 000 000 so&#39;m');
  });

  it('og:image absolyut URL', async () => {
    const res = await request(app.getHttpServer()).get('/obj/bx-001').expect(200);
    const moslik = /property="og:image" content="([^"]+)"/.exec(res.text);
    expect(moslik?.[1]).toMatch(/^https?:\/\/.+\/images\/bx-001\/og\.jpg$/);
  });

  it('LCP rasmi preload qilinadi', async () => {
    const res = await request(app.getHttpServer()).get('/obj/bx-001').expect(200);
    expect(res.text).toContain('rel="preload"');
    expect(res.text).toContain('imagesrcset=');
  });

  it('marker qolmaydi', async () => {
    const res = await request(app.getHttpServer()).get('/obj/bx-001').expect(200);
    expect(res.text).not.toContain('<!--OG-META-->');
  });

  it("mavjud bo'lmagan id → 404, lekin HTML qaytaradi", async () => {
    const res = await request(app.getHttpServer()).get('/obj/yoq-000').expect(404);
    expect(res.text).toContain('<div id="root">');
    expect(res.text).not.toContain('og:title');
  });

  it("GET / → 200 SPA qobig'i", async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.text).toContain('<div id="root">');
  });

  it('/api/health hamon ishlaydi', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200);
  });
});
```

> Oxirgi `it('GET / → 200 SPA qobig\'i', ...)` tavsifini ikki tirnoqqa o'zgartir.

- [ ] **Step 7: Testlarni ishga tushir**

```bash
yarn workspace @rieltor/api test
```

Kutilgan: barcha unit va e2e PASS (meta 10 ta, ssr 7 ta, oldingilar o'zgarishsiz).

- [ ] **Step 8: Haqiqiy build bilan qo'lda tekshir**

```bash
yarn workspace @rieltor/web build
yarn workspace @rieltor/api build
yarn workspace @rieltor/api start
```

```bash
curl -s http://localhost:3000/obj/bx-001 | grep -E 'og:(title|image)'
```

Kutilgan: ikkala teg ham to'ldirilgan, `og:image` `http://localhost:3000/images/bx-001/og.jpg`.

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/images/bx-001/og.jpg
```

Kutilgan: `200`.

- [ ] **Step 9: Commit**

```bash
yarn lint && yarn typecheck
git add -A
git commit -m "feat(api): OG head-inject, LCP preload va statik front serve"
```

---

## Task 15: Prod Docker imiji — bitta konteyner

Spec §12: multi-stage build, web `dist` API imijiga ko'chiriladi, bitta jarayon hammasini serve qiladi.

**Files:**

- Create: `Dockerfile`, `.dockerignore`
- Modify: `docker-compose.yml`, `package.json` (root)

**Interfaces:**

- Consumes: `sozla()` statik serve mantiqi (Task 14), `prisma migrate deploy` (Task 4)
- Produces: `rieltor-app` imiji — `PORT` da tinglaydi, `/api/health` javob beradi

- [ ] **Step 1: `.dockerignore`**

```
node_modules
**/node_modules
**/dist
.git
.turbo
coverage
apps/api/public/images
playwright-report
test-results
*.md
.yarn/cache
.env
apps/api/.env
```

> `.yarn/cache` — yuzlab megabayt bo'lishi mumkin va `--immutable` o'rnatishda kerak emas.
> `.env` — `build` va `prod-deps` bosqichlari `COPY . .` qiladi, ya'ni lokal `.env` oraliq qatlamga tushib qolardi. Yakuniy imijga u ko'chmaydi (runner faqat aniq yo'llarni oladi), lekin qattiqlashtirish arzon.

- [ ] **Step 2: Dockerfile**

```dockerfile
# syntax=docker/dockerfile:1

FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app

# ---------- bog'liqliklar ----------
FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases/ .yarn/releases/
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN yarn install --immutable

# ---------- build ----------
FROM deps AS build
COPY . .
RUN yarn workspace @rieltor/api exec prisma generate
RUN yarn workspace @rieltor/shared build
RUN yarn workspace @rieltor/web build
RUN yarn workspace @rieltor/api build

# ---------- prod bog'liqliklari ----------
FROM deps AS prod-deps
COPY . .
RUN yarn workspace @rieltor/api exec prisma generate
RUN yarn workspace @rieltor/shared build
# `--all` EMAS, aynan @rieltor/api. Aks holda apps/web ning runtime bog'liqliklari
# (react, react-dom, react-router, @tanstack) ham server imijiga tushadi — front
# allaqachon statik fayllarga build qilingan, ya'ni bu o'lik kod (~19 MB va o'sib boradi).
# @rieltor/shared `workspace:*` orqali baribir tortiladi.
RUN yarn workspaces focus --production @rieltor/api

# ---------- ishga tushirish ----------
FROM base AS runner
ENV NODE_ENV=production
# sharp glibc talab qiladi — node:22-slim da bor, alpine'da qo'shimcha paket kerak bo'lardi.

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/packages/shared ./packages/shared
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY package.json ./

# sozla() shu yo'lni kutadi: apps/api/dist dan ../../web/dist
WORKDIR /app/apps/api
EXPOSE 3000

# Migratsiya har deploy'da, so'ng server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
```

> **Diqqat:** `sozla()` da `webDist = resolve(apiRoot, '..', 'web', 'dist')` va `apiRoot = resolve(__dirname, '..')`. Konteynerda `__dirname` = `/app/apps/api/dist` → `apiRoot` = `/app/apps/api` → `webDist` = `/app/apps/web/dist`. Yuqoridagi COPY yo'llari shunga mos. Agar mos kelmasa, `WEB_DIST` env bilan aniq yo'l ber.

- [ ] **Step 3: Imijni qur va lokal sinab ko'r**

```bash
docker build -t rieltor-app .
```

```bash
docker run --rm -p 3000:3000 --network host \
  -e DATABASE_URL='postgresql://rieltor:rieltor@localhost:5432/rieltor' \
  -e PUBLIC_BASE_URL='http://localhost:3000' \
  rieltor-app
```

Boshqa terminalda:

```bash
curl -s http://localhost:3000/api/health
curl -s http://localhost:3000/obj/bx-001 | grep -c 'og:image'
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/objects
```

Kutilgan: `{"status":"ok","db":true}`, `og:image` topiladi (≥1), `200`.

> Konteynerda `public/images/` bo'sh — u `.dockerignore` da. Rasmlarni to'ldirish uchun konteyner ichida bir marta seed bajarilishi kerak (Step 4).

- [ ] **Step 4: Seed'ni prod oqimiga qo'sh**

Rasmlar `public/images/` ga seed vaqtida yoziladi, ya'ni konteyner har qayta ishga tushganda ular yo'qoladi. Demo uchun eng sodda yechim — startda seed'ni ham bajarish. `Dockerfile` dagi `CMD` ni almashtir:

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/main"]
```

`tsx` prod bog'liqligi bo'lishi uchun uni `dependencies` ga ko'chir:

```bash
yarn workspace @rieltor/api remove tsx
yarn workspace @rieltor/api add tsx
```

Imijni qayta qurib, `docker run` ni takrorla va tekshir:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/images/bx-001/og.jpg
```

Kutilgan: `200`.

> **Keyingi bosqichga yozib qo'yiladi:** rasmlarni R2/Supabase Storage'ga ko'chirish — shunda har startda qayta generatsiya kerak bo'lmaydi (spec §7).

- [ ] **Step 5: docker-compose'ga to'liq stack qo'sh**

`docker-compose.yml` ga `postgres` yoniga qo'sh:

```yaml
app:
  build: .
  depends_on:
    postgres: { condition: service_healthy }
  environment:
    DATABASE_URL: postgresql://rieltor:rieltor@postgres:5432/rieltor
    PUBLIC_BASE_URL: http://localhost:3000
    SEED_AGENT_TEL: ${SEED_AGENT_TEL}
    SEED_AGENT_TG: ${SEED_AGENT_TG}
    PORT: 3000
  ports: ['3000:3000']
```

```bash
SEED_AGENT_TEL=+998901234567 SEED_AGENT_TG=username docker compose up --build
```

Kutilgan: `http://localhost:3000/obj/bx-001` to'liq ishlaydi.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: bitta konteynerli prod imiji — web build API bilan birga serve qilinadi"
```

---

## Task 16: Playwright E2E, deploy va DoD tekshiruvi

Oxirgi task: mobil viewport'da E2E, Railway + Neon'ga deploy, Lighthouse va Telegram preview sinovi.

**Files:**

- Create: `playwright.config.ts`, `e2e/object-page.spec.ts`
- Create: `docs/deploy.md`
- Modify: `package.json` (root), `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: prod imiji (Task 15), `docker compose` stack
- Produces: `yarn e2e` — 360px viewport'da galereya svaypi va CTA havolalarini tekshiradi

- [ ] **Step 1: Playwright o'rnat**

```bash
yarn add -D @playwright/test
yarn playwright install --with-deps chromium
```

`playwright.config.ts` (ildizda):

```ts
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobil',
      use: {
        ...devices['Pixel 5'],
        // Spec §13: 360px kenglikda mukammal ishlashi kerak.
        viewport: { width: 360, height: 740 },
      },
    },
  ],
});
```

`package.json` (root) skriptlariga qo'sh:

```json
"e2e": "playwright test"
```

- [ ] **Step 2: E2E testini yoz**

`e2e/object-page.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test.describe('Obyekt sahifasi (360px)', () => {
  test('sahifa asosiy bloklar bilan ochiladi', async ({ page }) => {
    await page.goto('/obj/bx-002');

    await expect(page.getByText("480 000 000 so'm")).toBeVisible();
    await expect(page.getByText('$40 000')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test("gorizontal skroll yo'q", async ({ page }) => {
    await page.goto('/obj/bx-002');
    const oshib = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(oshib).toBe(false);
  });

  test("galereya svaypi faol nuqtani o'zgartiradi", async ({ page }) => {
    await page.goto('/obj/bx-002');

    const nuqtalar = page.getByRole('tab');
    await expect(nuqtalar.first()).toHaveAttribute('aria-selected', 'true');

    // Ikkinchi nuqtaga bosish lentani suradi (svayp bilan bir xil natija).
    await nuqtalar.nth(1).click();
    await expect(nuqtalar.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(nuqtalar.first()).toHaveAttribute('aria-selected', 'false');
  });

  test("CTA tugmalari to'g'ri havolalarga ega", async ({ page }) => {
    await page.goto('/obj/bx-002');

    const qongiroq = page.getByRole('link', { name: /Qo'ng'iroq/ });
    await expect(qongiroq).toHaveAttribute('href', /^tel:\+998\d+$/);

    const telegram = page.getByRole('link', { name: /Telegram/ });
    await expect(telegram).toHaveAttribute('href', /^https:\/\/t\.me\/[\w_]+$/);
  });

  test("CTA doim ekranda ko'rinadi", async ({ page }) => {
    await page.goto('/obj/bx-002');
    await page.mouse.wheel(0, 2000);
    await expect(page.getByRole('link', { name: /Qo'ng'iroq/ })).toBeInViewport();
  });

  test("hisoblagich ko'rinadi", async ({ page }) => {
    await page.goto('/obj/bx-002');
    await expect(page.getByText(/👁\s*\d+/)).toBeVisible();
  });

  test("noto'g'ri id → 404 sahifa va 404 status", async ({ page }) => {
    const javob = await page.goto('/obj/yoq-000');
    expect(javob?.status()).toBe(404);
    await expect(page.getByText('Bunday obyekt topilmadi')).toBeVisible();
  });

  test('OG teglari HTML ichida mavjud', async ({ request }) => {
    const javob = await request.get('/obj/bx-002');
    const html = await javob.text();

    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:image"');
    expect(html).toMatch(/property="og:image" content="https?:\/\//);
  });
});
```

> Apostrofli `test(...)` tavsiflarini ikki tirnoqqa o'zgartir.

- [ ] **Step 3: E2E ni lokal prod stack'ga qarshi ishga tushir**

```bash
SEED_AGENT_TEL=+998901234567 SEED_AGENT_TG=username docker compose up -d --build
yarn e2e
```

Kutilgan: 8 test PASS. Tushgan testni tuzatmasdan keyingi qadamga o'tma.

```bash
docker compose down
```

- [ ] **Step 4: CI ga E2E ni qo'sh**

`.github/workflows/ci.yml` ga `check` job'idan keyin yangi job:

```yaml
e2e:
  runs-on: ubuntu-latest
  needs: check
  steps:
    - uses: actions/checkout@v4
    - run: corepack enable
    - uses: actions/setup-node@v4
      with: { node-version: 22, cache: yarn }
    - run: yarn install --immutable
    - run: yarn playwright install --with-deps chromium
    - name: Stack'ni ko'tarish
      env:
        SEED_AGENT_TEL: '+998901234567'
        SEED_AGENT_TG: 'test'
      run: docker compose up -d --build
    - name: Servis tayyorligini kutish
      run: |
        for i in $(seq 1 60); do
          if curl -sf http://localhost:3000/api/health > /dev/null; then exit 0; fi
          sleep 2
        done
        docker compose logs
        exit 1
    - run: yarn e2e
    - if: failure()
      uses: actions/upload-artifact@v4
      with: { name: playwright-report, path: playwright-report/ }
```

```bash
git add -A
git commit -m "test: 360px viewport uchun Playwright E2E va CI job"
```

- [ ] **Step 5: Neon Postgres yarat**

1. [neon.tech](https://neon.tech) da bepul loyiha yarat, region — Europe (eng yaqini).
2. Connection string'ni nusxa ol (`postgresql://...?sslmode=require`).

- [ ] **Step 6: Railway'ga deploy**

1. [railway.app](https://railway.app) da GitHub repo'dan yangi servis yarat — Railway `Dockerfile` ni avtomatik topadi.
2. Variables bo'limiga qo'sh:

```
DATABASE_URL=<Neon connection string>
PUBLIC_BASE_URL=https://<railway-domen>
SEED_AGENT_TEL=<sening raqaming>
SEED_AGENT_TG=<sening telegram username'ing>
PORT=3000
```

> `PUBLIC_BASE_URL` birinchi deploy'da hali noma'lum. Ketma-ketlik: deploy qil → Railway domenini ol → `PUBLIC_BASE_URL` ni qo'y → qayta deploy. Bu qadam **majburiy**, aks holda `og:image` nisbiy bo'lib qoladi va Telegram rasmni ko'rsatmaydi.

3. Deploy tugagach tekshir:

```bash
curl -s https://<domen>/api/health
curl -s https://<domen>/obj/bx-001 | grep -E 'og:(title|image)'
```

- [ ] **Step 7: `docs/deploy.md` yoz**

Quyidagilarni hujjatlashtir: Neon connection string qayerdan olinadi, Railway'dagi to'rt env o'zgaruvchi, `PUBLIC_BASE_URL` ni ikki bosqichda qo'yish zarurati, kontaktni o'zgartirish tartibi (`SEED_AGENT_TEL`/`SEED_AGENT_TG` ni yangilab qayta deploy), rasmlarni almashtirish tartibi (`apps/api/prisma/seed-images/<id>/` ga fayl qo'yib commit → qayta deploy).

- [ ] **Step 8: Telegram preview sinovi (DoD)**

`https://<domen>/obj/bx-001` havolasini o'z Telegram'ingga (Saved Messages) yubor.

Kutilgan: rasm + sarlavha + narx ko'rinadi.

Agar eski/noto'g'ri preview chiqsa: Telegram'da `@WebpageBot` ga havolani yuborib keshni yangilat, so'ng qayta sina.

Uchala obyekt uchun takrorla.

- [ ] **Step 9: Lighthouse (DoD)**

Chrome DevTools → Lighthouse → Mode: Navigation, Device: **Mobile** → `https://<domen>/obj/bx-001`.

Kutilgan: Performance ≥ 90, LCP < 2.5s.

Ko'rsatkich past bo'lsa, shu tartibda tekshir:

1. `og:image`/LCP preload teglari HTMLda bormi (`curl | grep preload`)
2. Birinchi rasmda `fetchpriority="high"` va `loading="eager"` bormi
3. Rasm hajmlari — `apps/api/public/images/bx-001/01-1200.webp` 250 KB dan kichikmi
4. Railway sovuq startmi — ikkinchi marta o'lchab ko'r
5. Shrift `font-display: swap` bilan yuklanayaptimi

- [ ] **Step 10: Ikki qurilmadan hisoblagich sinovi (DoD)**

Telefon va noutbukdan (yoki ikki xil brauzer profilidan) `https://<domen>/obj/bx-001` ni och. Har birida hisoblagich birga oshishi kerak. Bir xil qurilmada sahifani yangilaganda **oshmasligi** kerak.

- [ ] **Step 11: DoD ro'yxatini yakunla**

Spec §14 dagi har bir punktni tekshirib, natijani `docs/deploy.md` oxiriga yoz:

- [ ] 3 sahifa jonli URL'da ochiladi
- [ ] Galereya real telefonda svayp ishlaydi
- [ ] `tel:` raqam teradi, `t.me` chat ochadi
- [ ] Telegram preview: rasm + sarlavha + narx
- [ ] Hisoblagich 2 qurilmadan oshadi, refreshda oshmaydi
- [ ] Lighthouse mobile ≥ 90, LCP < 2.5s
- [ ] Noto'g'ri id → 404
- [ ] CI yashil

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "docs: deploy yo'riqnomasi va DoD tekshiruv natijalari"
```

---

## Reja bo'yicha eslatmalar

**Nomlash izchilligi.** Quyidagi nomlar butun kod bo'ylab bir xil bo'lishi shart — bir taskda o'zgartirilsa, boshqasi sinadi:

| Nom                                                | Qayerda aniqlangan    | Kim ishlatadi                                  |
| -------------------------------------------------- | --------------------- | ---------------------------------------------- |
| `formatNarxSom` / `formatNarxUsd`                  | Task 2                | Task 10 (`PriceBlock`), Task 14 (`metaTeglar`) |
| `imageSrcSet` / `imageFallbackSrc` / `IMAGE_SIZES` | Task 2                | Task 5 (quvur nomlashi), Task 9, 11, 14        |
| `Rasm.base` (`"/images/bx-001/01"`)                | Task 2, 4             | Task 5, 7, 11, 14                              |
| `narxSom: string`                                  | Task 2                | Task 7 (mapper), Task 10, 14                   |
| `rasmniQayta`                                      | Task 5                | Task 6 (seed)                                  |
| `detailgaAylantir`                                 | Task 7                | Task 14 (SSR)                                  |
| `ObjectsService.bittasi`                           | Task 7                | Task 14 (SSR)                                  |
| `sozla(app)`                                       | Task 14               | `main.ts` va barcha e2e testlar                |
| `<!--OG-META-->` marker                            | Task 9 (`index.html`) | Task 14 (`HtmlCacheService`)                   |
| `ApiXatosi`                                        | Task 9                | Task 12 (404 aniqlash)                         |
| `ParamsRow` (`ObjectParamsRow` emas)               | Task 10               | Task 12 (`ObjectPage`)                         |

**Test sonlari taxminiy.** Har qadamdagi "Kutilgan: N test PASS" — mo'ljal, qat'iy talab emas. Haqiqiy son shu taskning test faylidagi `it(...)` bloklari soniga teng bo'lishi kerak. Nomuvofiqlik chiqsa, test faylini sanab ko'r: agar hamma holat qamrab olingan bo'lsa, rejadagi son xato — uni tuzat va davom et, test qo'shib "to'ldirma".

**Apostrof qoidasi.** O'zbekcha matnda `'` ko'p. Ichida apostrof bo'lgan har qanday JS/TS satri ikki tirnoq bilan yoziladi. Reja ichida ba'zi snippetlarda bu qoida buzilgan joylar aniq belgilangan — o'sha izohlarga amal qil.

**Reja o'zgarishi.** Agar biror task davomida rejadagi yechim ishlamasa: to'xta, sababini yoz, spec (`docs/superpowers/specs/2026-07-28-rieltor-generator-design.md`) bilan solishtir va faqat shundan keyin muqobil yechimni tanla. Spec §1 dagi "qamrovdan tashqarida" ro'yxatiga hech narsa qo'shilmaydi.
