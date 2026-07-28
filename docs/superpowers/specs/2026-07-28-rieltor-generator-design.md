# Rieltor Generator — Dizayn spetsifikatsiyasi

**Sana:** 2026-07-28
**Holat:** tasdiqlangan, implementatsiyaga tayyor
**Manba:** [rieltor-generator-spec-v0.1.md](../../rieltor-generator-spec-v0.1.md) (§1 stack revizyasi bilan)

---

## 1. Maqsad va qamrov

Rieltor uchun bitta ko'chmas mulk obyektining mobil sahifasini ko'rsatadigan demo. Sahifa havolasi Telegram'ga tashlanganda rasm + sarlavha + narx bilan preview chiqishi kerak — mahsulotning asosiy sotuv argumenti shu.

Demo **poydevor sifatida** quriladi: v0.1 §1 dagi to'liq stack (pnpm monorepo, NestJS, Prisma, Postgres, Docker, CI, testlar) qayta yozishga hojat qolmasligi uchun boshdanoq o'rnatiladi.

Qamrovdan tashqarida (v0.1 §8 dagi yozma taqiq o'zgarmaydi): login, kiritish formasi, admin-panel, CRM, narx-radar, to'lovlar, xarita, ko'p til, rieltor-domenlari, chuqur SEO.

---

## 2. Tasdiqlangan qarorlar

| Savol           | Qaror                                                               |
| --------------- | ------------------------------------------------------------------- |
| Stack og'irligi | To'liq §1 stack — poydevor sifatida                                 |
| Kontent manbasi | OLX.uz e'lonlaridan real parametrlar; tavsif matni o'zimiz yoziladi |
| Hisoblagich     | Sessiyaga 1 marta (sessionStorage) + IP bo'yicha rate-limit         |
| Deploy          | Bitta servis: NestJS API + statik front + OG inject; Railway + Neon |
| Kontakt         | Rieltor sifatida loyiha egasining telefon/Telegram'i (env orqali)   |
| Dizayn          | Toza va zamonaviy: oq fon, Inter, bitta urg'u rang `#1D4ED8`        |
| Testlar         | Kritik yo'llar + CI                                                 |

### 2.1 v0.1 hujjatidagi tuzatilgan qarama-qarshiliklar

§1 stack revizyasi §6/§7 ni yangilamagan edi. Quyidagilar shu hujjatda hal qilingan:

| v0.1 dagi matn                        | Amaldagi qaror                                              |
| ------------------------------------- | ----------------------------------------------------------- |
| §6 "`next/image` ishlatilsin"         | `<img srcset/sizes>` + `sharp` quvuri (§7)                  |
| §6 "Deploy: Vercel; KV tokenlar"      | Railway (bitta konteyner) + Neon Postgres; KV yo'q          |
| §3 sarlavhasi `data/objects.json`     | Manba PostgreSQL; JSON model faqat seed shakli              |
| §4 `Gallery` "`priority`"             | `fetchpriority="high"` + server-inject `<link rel=preload>` |
| §6 "KV ishlamasa sahifa ochilaveradi" | Aniqlashtirildi — §6.3 ga qara                              |

---

## 3. Monorepo tuzilishi

```
rieltor-app/
├─ apps/
│  ├─ web/                 React 19 + Vite + Tailwind v4 + Router v7 + TanStack Query
│  └─ api/                 NestJS 11 + Prisma; prod'da web'ni ham serve qiladi
├─ packages/
│  └─ shared/              Zod sxemalar → TS tiplar; formatNarx
├─ docs/
├─ docker-compose.yml      postgres + api + web (lokal dev)
├─ turbo.json
├─ pnpm-workspace.yaml
└─ .github/workflows/ci.yml
```

**Package manager:** pnpm. **Orkestrator:** Turborepo. **Node:** 22 LTS.

### 3.1 `packages/shared` — tipning yagona manbasi

Zod sxemalar shu paketda yashaydi. API tomonda `nestjs-zod` orqali o'sha sxemadan DTO va Swagger hujjati generatsiya qilinadi; web tomonda server javobi o'sha sxema bilan parse qilinadi. Front va back tipi jismonan bitta faylda — bu v0.1 §1 dagi "front↔back yagona manba" talabining amalga oshishi.

Eksport qilinadi: `ObjectSchema`, `ObjectListItemSchema`, `AgentSchema`, `RasmSchema`, `ViewSchema` va ulardan chiqarilgan tiplar; `formatNarx()`.

### 3.2 `apps/web` — Feature-Sliced Design

| Qatlam      | Slice'lar                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------- |
| `app/`      | providers (QueryClient, RouterProvider), global CSS, entry                                         |
| `pages/`    | `home`, `object`, `not-found`                                                                      |
| `widgets/`  | `gallery`, `sticky-cta`                                                                            |
| `features/` | `view-counter`                                                                                     |
| `entities/` | `object` (tip, query, `PriceBlock`, `ParamsRow`, `Description`, `Location`), `agent` (`AgentCard`) |
| `shared/`   | `ui/` (Button, Skeleton), `lib/` (`cn`, formatterlar), `api/` (fetch klient), `config/`            |

FSD import qoidasi (yuqori qatlam faqat pastdagini import qiladi) ESLint `boundaries` plugin bilan majburlanadi.

---

## 4. Ma'lumot modeli

v0.1 §3 dagi JSON uchta jadvalga normallashtiriladi: bitta rieltorda ko'p obyekt bo'ladi, va har rasmning bir nechta o'lchami bor.

```prisma
enum ObjectTuri { NOVOSTROYKA IKKILAMCHI HOVLI }

model Agent {
  id       String  @id @default(cuid())
  ism      String
  agentlik String
  suratUrl String
  tel      String          // +998901234567
  tg       String          // username (@ siz)
  objects  Object[]
}

model Object {
  id        String      @id          // "bx-001"
  sarlavha  String
  narxSom   BigInt
  narxUsd   Int
  xona      Int
  maydonM2  Float
  qavat     String?                  // "4/9" — hovlida null
  tuman     String
  manzil    String
  moljal    String
  tavsif    String
  turi      ObjectTuri
  views     Int         @default(0)
  sana      DateTime
  agentId   String
  agent     Agent       @relation(fields: [agentId], references: [id])
  rasmlar   Rasm[]
}

model Rasm {
  id       String @id @default(cuid())
  objectId String
  url      String            // asosiy 1200w
  ogUrl    String?           // 1200×630 crop (faqat birinchi rasmda)
  width    Int
  height   Int
  tartib   Int
  object   Object @relation(fields: [objectId], references: [id], onDelete: Cascade)
  @@unique([objectId, tartib])
}
```

**`narxSom` = BigInt.** `Int` 2 147 483 647 da to'lib qoladi (≈2.1 mlrd so'm ≈ $170k) — hovli undan qimmat bo'lishi mumkin. API javobida string sifatida beriladi (`"480000000"`), front raqamli string'ni uch xonadan probel bilan ajratadi. Float aniqligi muammosi umuman paydo bo'lmaydi.

**`turi` enum** — v0.1 §3 JSON'da bu maydon yo'q edi, lekin "1 novostroyka, 1 ikkilamchi, 1 hovli" talabi bor. Qo'shildi.

### 4.1 Seed

`apps/api/prisma/seed.ts`:

1. Bitta `Agent` yaratadi — `SEED_AGENT_TEL` va `SEED_AGENT_TG` env o'zgaruvchilaridan (`.env.example` da placeholder). Kontaktni o'zgartirish uchun env'ni tahrirlab `pnpm seed` qilish kifoya.
2. Uchta `Object`: novostroyka, ikkilamchi (2–3 xona), hovli. Parametrlar (narx, tuman, m², qavat) OLX.uz e'lonlaridan olingan real qiymatlar; **tavsif matni o'zimiz yozamiz**.
3. Har obyekt uchun 5–8 rasm — §7 dagi `sharp` quvuridan o'tkaziladi. Manba rasmlar `apps/api/prisma/seed-images/<id>/` papkasidan olinadi; birinchi bosqichda u yerda placeholder rasmlar turadi. Rasmlarni almashtirish = papkaga yangi fayl qo'yib `pnpm seed` qilish; kod o'zgarmaydi.

Seed idempotent (`upsert`) — qayta ishga tushirsa `views` nolga tushmaydi.

---

## 5. API

| Endpoint               | Javob                                                        |
| ---------------------- | ------------------------------------------------------------ |
| `GET /api/objects`     | Ro'yxat (id, sarlavha, narx, xona, m², tuman, birinchi rasm) |
| `GET /api/objects/:id` | To'liq obyekt + rasmlar + agent. Topilmasa 404               |
| `POST /api/view/:id`   | `{ views: N }` — atomik increment                            |
| `GET /api/view/:id`    | `{ views: N }`                                               |
| `GET /api/health`      | `{ status, db }`                                             |
| `GET /api/docs`        | Swagger UI                                                   |

Validatsiya: `nestjs-zod` (`packages/shared` sxemalaridan). Config: `@nestjs/config` + Zod env validatsiyasi — noto'g'ri env bilan ilova ishga tushmaydi.

### 5.1 Env o'zgaruvchilari

| Nom                               | Vazifa                                                                     |
| --------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`                    | Postgres ulanish satri                                                     |
| `PUBLIC_BASE_URL`                 | Absolyut `og:image` URL'i uchun (masalan `https://rieltor.up.railway.app`) |
| `PORT`                            | Default 3000                                                               |
| `NODE_ENV`                        |                                                                            |
| `SEED_AGENT_TEL`, `SEED_AGENT_TG` | Faqat seed vaqtida                                                         |

---

## 6. Ko'rishlar hisoblagichi

**Increment** — bitta atomik SQL, race condition yo'q:

```sql
UPDATE "Object" SET views = views + 1 WHERE id = $1 RETURNING views;
```

Prisma'da: `prisma.object.update({ where: { id }, data: { views: { increment: 1 } }, select: { views: true } })`.

### 6.1 Takroriy hisoblashdan himoya

Front `sessionStorage['viewed:<id>']` ni tekshiradi:

- bo'sh → `POST /api/view/:id`, so'ng kalitni belgilaydi
- to'lgan → `GET /api/view/:id`

### 6.2 Backend rate-limit

`@nestjs/throttler`, `POST /api/view/:id` uchun: bitta IP + bitta obyekt kombinatsiyasiga 10 daqiqada 1 marta. Limitdan oshsa 200 qaytariladi (joriy son bilan), 429 emas — foydalanuvchi hech nima sezmaydi. Demo bitta instansda ishlagani uchun in-memory store yetarli.

### 6.3 Degradatsiya — aniqlashtirilgan talab

v0.1 §6 "KV ishlamasa sahifa ochilaveradi" deydi. Bu to'liq bajarilmaydi: obyekt matni ham o'sha DB'dan keladi, DB butunlay o'lsa sahifa baribir render bo'lmaydi.

**Amalda kafolatlanadigan xatti-harakat:** `/api/view/*` xato bersa yoki timeout bo'lsa, `ViewCounter` hech narsa render qilmaydi (`null`), qolgan sahifa — galereya, narx, CTA tugmalari — to'liq ishlaydi. Sahifa ma'lumoti va hisoblagich **alohida** TanStack Query so'rovlari; hisoblagich `retry: false`.

---

## 7. Rasm quvuri

Seed vaqtida `sharp` har manba rasmdan hosil qiladi:

- `360w`, `720w`, `1200w` — WebP + JPG fallback, sifat ~78, har biri ~150–250 KB
- Birinchi rasmdan qo'shimcha `og.jpg` — 1200×630 `cover` crop

Natija `apps/api/public/images/<id>/` ga yoziladi va API tomonidan statik serve qilinadi — front bilan bitta origin, CORS muammosi yo'q. Prod'da object storage'ga (R2/Supabase) ko'chirish keyingi bosqich; hozircha konteyner ichida.

Front tomonda:

```html
<img
  srcset="…-360.webp 360w, …-720.webp 720w, …-1200.webp 1200w"
  sizes="(max-width: 480px) 100vw, 480px"
  width="1200"
  height="900"
  loading="lazy"
  decoding="async"
/>
```

Birinchi rasm: `loading="eager" fetchpriority="high"`, va `<link rel="preload">` server tomondan inject qilinadi (§8). `width`/`height` har doim beriladi — CLS'ni nolda ushlaydi.

---

## 8. OG / Telegram preview

Prod'da NestJS marshrut tartibi:

1. `/api/*` → kontrollerlar
2. `/assets/*`, `/images/*`, `/favicon.*` → statik fayllar
3. qolgan hamma narsa → **head-inject qilingan `index.html`**

`/obj/:id` uchun:

1. Obyekt DB'dan olinadi. Topilmasa → 404 status + umumiy OG bilan bir xil HTML (SPA o'zi 404 sahifasini ko'rsatadi).
2. Xotirada keshlangan `index.html` ning `<head>` iga inject qilinadi:
   - `<title>` va `og:title` = sarlavha + narx
   - `og:description` = tavsifning birinchi 1–2 jumlasi (≤200 belgi)
   - `og:image` = `${PUBLIC_BASE_URL}/images/<id>/og.jpg` — **absolyut URL** (Telegram nisbiy yo'lni o'qimaydi), `og:image:width=1200`, `og:image:height=630`
   - `og:type=website`, `og:url`, `twitter:card=summary_large_image`
   - `<link rel="preload" as="image" imagesrcset=… imagesizes=…>` — LCP rasmi uchun
3. SPA odatdagidek hydrate bo'ladi.

**Xavfsizlik:** inject qilinadigan har bir qiymat HTML-escape qilinadi (`& < > " '`). O'zbekcha sarlavhalarda apostrof ko'p — escape qilinmasa `<head>` buziladi.

**Kesh:** `index.html` diskdan bir marta o'qilib xotirada saqlanadi; har so'rovda faqat string almashtirish bajariladi.

**Eslatma:** Telegram OG'ni agressiv keshlaydi. Qayta sinaganda `@WebpageBot` orqali yangilatiladi yoki URL'ga `?v=2` qo'shiladi.

---

## 9. Sahifa komponentlari (`/obj/:id`)

v0.1 §4 tartibi o'zgarmaydi:

1. **`Gallery`** (`widgets/gallery`) — **kutubxonasiz**: CSS `scroll-snap-type: x mandatory` + `IntersectionObserver` nuqta indikatori uchun. Embla/Swiper qo'shilmaydi — iOS'da native momentum svayp allaqachon to'g'ri ishlaydi, JS bundle 0 KB o'sadi, LCP'ga xalaqit bermaydi. Zoom yo'q.
2. **`PriceBlock`** (`entities/object`) — so'm katta shriftda, ostida kichikroq `$`. Format: `480 000 000 so'm` / `$40 000` (probel ajratgich, `formatNarx` `packages/shared` da).
3. **`ParamsRow`** — 4 element ikonka bilan: xona · m² · qavat · tuman. Hovlida qavat bo'sh bo'lsa element tushib qoladi.
4. **`Description`** — oddiy matn, 3–5 jumla.
5. **`Location`** — mo'ljal matni. Xarita yo'q.
6. **`AgentCard`** (`entities/agent`) — dumaloq surat, ism, agentlik, telefon matn ko'rinishida.
7. **`StickyCTA`** (`widgets/sticky-cta`) — ekran pastida ikki tugma, `env(safe-area-inset-bottom)` hisobga olingan, ustida yengil gradient fade:
   - "📞 Qo'ng'iroq" → `tel:+998…`
   - "✈️ Telegram" → `https://t.me/<username>`
8. **`ViewCounter`** (`features/view-counter`) — "👁 N". Xatoda `null`.

---

## 10. Vizual tizim

- **Fon:** oq. **Matn:** `slate-900` / ikkilamchi `slate-500`.
- **Urg'u:** `#1D4ED8`. Tailwind v4 CSS-first token — `@theme { --color-accent: #1D4ED8 }`, bitta joydan o'zgaradi.
- **Shrift:** Inter variable, o'zimizda hosted (`woff2`, latin + latin-ext subset — o'zbekcha `ʻ` U+02BB uchun kerak), `font-display: swap`. Google Fonts ishlatilmaydi — render-blocking va tashqi ulanish.
- **Geometriya:** 16px radius, juda yengil soya, 4/8px oraliq shkalasi.
- **Layout:** mobil-first, 360px da mukammal; desktopda `max-width: 480px` markazda.

---

## 11. Testlar va CI

**API**

- `ViewsService` unit: increment to'g'ri son qaytaradi; mavjud bo'lmagan id → `NotFoundException`
- e2e (supertest): `GET/POST /api/view/:id`; noto'g'ri id → 404; `GET /obj/bx-001` javobida `og:title` narx bilan mavjud; `og:image` absolyut URL

**Web**

- `formatNarx(480000000n) === "480 000 000 so'm"`
- `ViewCounter` — so'rov xato bersa hech narsa render qilmaydi
- `Gallery` — nuqta indikatori faol rasmga mos

**E2E (Playwright, 360px viewport)**

- Galereya svaypi faol nuqtani o'zgartiradi
- `tel:` va `t.me` href'lari seed ma'lumotiga mos

**CI (GitHub Actions):** `lint · typecheck · test · build`. Pre-commit: Husky + lint-staged (ESLint flat config + Prettier).

---

## 12. Deploy

Bitta Docker konteyner (multi-stage): web build → `dist` API imijiga ko'chiriladi → `node dist/main`.

- **Hosting:** Railway (Dockerfile'dan)
- **DB:** Neon serverless Postgres
- **Migratsiya:** deploy'da `prisma migrate deploy`, so'ng bir martalik `pnpm seed`

Lokal dev: `docker compose up` → postgres + api + web (Vite dev server `/api` ni API'ga proxy qiladi).

---

## 13. Acceptance

- 360px kenglikda mukammal; desktopda kontent `max-width 480px` markazda
- Lighthouse mobile: Performance ≥ 90, LCP < 2.5s
- Responsive rasm `srcset`/`sizes` bilan; LCP rasmi preload qilingan
- `/api/view/*` ishlamasa sahifa to'liq ochiladi, hisoblagich yashirinadi (§6.3)
- Deploy: Railway; sirlar Railway dashboard'da, lokalda `.env`

## 14. Definition of Done

- [ ] 3 sahifa jonli URL'da ochiladi (`/obj/bx-001` …)
- [ ] Galereya real telefonda svayp ishlaydi
- [ ] `tel:` tugmasi raqam teradi, `t.me` tugmasi chat ochadi
- [ ] Telegram preview: rasm + sarlavha + narx ko'rinadi
- [ ] Hisoblagich 2 xil qurilmadan kirilganda oshadi (bitta qurilmada refresh — oshmaydi)
- [ ] Lighthouse mobile ≥ 90, LCP < 2.5s
- [ ] Noto'g'ri id → sodda 404
- [ ] CI yashil: lint · typecheck · test · build

---

## 15. Bosqichlar

1. Monorepo skeleti + tooling (pnpm, Turborepo, ESLint flat, Prettier, Husky, CI, docker-compose postgres)
2. `packages/shared` Zod sxemalar → Prisma schema → migratsiya → `sharp` rasm quvuri → seed
3. API: objects + views + throttler + Swagger + testlar
4. Web: FSD skeleti, Router, TanStack Query, `/` va 404
5. Web: obyekt sahifasi komponentlari + vizual tizim
6. OG head-inject + LCP preload + prod Dockerfile (bitta konteyner)
7. Deploy Railway + Neon → Lighthouse tuning → Telegram preview sinovi → Playwright

---

## 16. Ochiq risklar

- **Kontent huquqi.** OLX e'lonlarining rasm va matni birovning mulki. Shu sababli parametrlar (fakt) olinadi, tavsif o'zimizniki, rasmlar boshida placeholder. Ochiq URL'ga real e'lon rasmlarini qo'yish qarori loyiha egasida.
- **Lighthouse ≥ 90.** SPA'da erishish mumkin, lekin bepul hosting'ning sovuq start kechikishi LCP'ga ta'sir qiladi. Zaruratda §1 dagi muqobil — 3 obyekt uchun build-time prerender — qo'shimcha yechim sifatida qoladi.
- **Telegram OG keshi.** Birinchi sinovda xato meta ketsa, tuzatilgandan keyin ham eski preview ko'rinadi. `@WebpageBot` bilan yangilanadi.
