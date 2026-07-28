# Rieltor Generator — Texnik spetsifikatsiya (demo v0.1)

> Faqat qurish uchun. Biznes qismi (gipotezalar, agentlik testi) alohida hujjatda.
> Bu faylni AI kod-agentingga kontekst sifatida berishing mumkin — lekin har diffni o'zing review qilasan.
>
> **⚠️ v0.1 → stack revizyasi:** faqat §1 (Stack) o'zgardi. §2–§8 mazmuni (marshrut, model, komponent, OG, acceptance, DoD, scope) o'zgarmagan; ular endi yangi stack'ka §1 dagi mapping bo'yicha o'qiladi. Agar §6 da `next/image` / `Vercel KV` kabi eski stack eslatmalari uchrasa — ular §1 dagi variant bilan almashtiriladi.

## 1. Stack va cheklovlar

### Frontend

- **Framework:** React 19 + **TypeScript** — **Vite** bilan build (tez HMR, ESM, yengil)
- **Arxitektura:** **Feature-Sliced Design (FSD)** — qatlamlar: `app → pages → widgets → features → entities → shared`. Har komponent (§4) o'z sliceida: masalan `Gallery` → `widgets/gallery`, `AgentCard` → `entities/agent`, `ViewCounter` → `features/view-counter`, obyekt tipi → `entities/object`.
- **Routing:** **React Router v7** (Next.js App Router yo'q) — `/`, `/obj/:id`, 404
- **Styling:** **Tailwind CSS v4** — mobil-first (utility-first, konfig JS'siz CSS-first)
- **Server-state / data-fetching:** **TanStack Query (React Query v5)** — obyekt ma'lumoti va hisoblagichni olish, kesh, retry, degradatsiya
- **Client-state:** **Zustand** (kerak bo'lganda; demo uchun minimal)
- **HTTP:** native `fetch` yoki Axios (TanStack Query ichida)
- **Rasm:** `next/image` yo'q → native `loading="lazy"` + `srcset`/`sizes` responsive rasm; birinchi (LCP) rasmda `fetchpriority="high"` + preload. Rasmlar upload/build vaqtida **`sharp`** bilan siqiladi (kenglik ≤1200px, ~150–250 KB). Muqobil: `@unpic/react`.
- **Forma (bonus / keyinroq):** React Hook Form + **Zod**

### Backend

- **Framework:** **NestJS v11** + TypeScript (**Node.js 22 LTS**)
- **ORM:** **Prisma** (type-safe client, migratsiya, seed, NestJS bilan qulay integratsiya). _Muqobil:_ **Drizzle ORM** (eng yengil/yangi) yoki TypeORM.
- **DB:** **PostgreSQL 16+** — **endi baza BOR** (avvalgi `data/objects.json` lokal fayli o'rniga). §3 dagi obyekt modeli endi **Prisma schema / entity** shakli va seed manbasi bo'ladi (o'sha 3 obyekt seed qilinadi).
- **Validatsiya:** `class-validator` + `class-transformer` (yoki `nestjs-zod` — Zod bilan yagona sxema)
- **API hujjat:** **Swagger / OpenAPI** (`@nestjs/swagger`)
- **Config:** `@nestjs/config` + env validatsiya (Zod/Joi)

### Hisoblagich (views)

- Endi KV/Redis shart emas — **Postgres'da atomik increment:** `UPDATE ... SET views = views + 1 RETURNING views`
- API shakli **o'zgarmaydi** (§2): `POST /api/view/:id` → +1, `GET /api/view/:id` → joriy son
- Degradatsiya (§6 talab): DB ishlamasa `try/catch` — sahifa ochilaveradi, hisoblagich yashirinadi
- _Ixtiyoriy:_ Redis (`ioredis`) — rate-limit / hot-cache / bot spamdan himoya

### OG / Telegram preview — KRITIK o'zgarish (§5 ga taalluqli)

- Next.js SSR (`generateMetadata`) **yo'q**. Toza React SPA'da Telegram/ijtimoiy bot **JS ishlatmaydi** → dinamik `og:*` teglar chiqmaydi. Bu §5 va DoD'ni buzadi.
- **Yechim (asosiy):** NestJS frontend'ni serve qiladi va `/obj/:id` so'rovida `index.html` ning `<head>` iga **server tomonda** `og:title` / `og:description` / `og:image` teglarini Postgres'dan inject qiladi (yengil "head-SSR"). SPA baribir odatdagidek hydrate bo'ladi.
- _Muqobil:_ build-time prerender (atigi 3 obyekt — juda oson) yoki faqat-crawler prerender (Prerender.io / bot User-Agent aniqlash).
- `og:image` (1200×630 crop) — **`sharp`** yoki **`satori`** bilan generatsiya, yoki upload vaqtida oldindan kesib qo'yiladi.

### Infratuzilma / qolgan (eng yangi)

- **Monorepo:** **pnpm workspaces + Turborepo** (yoki Nx) — `apps/web` (React), `apps/api` (NestJS), `packages/shared` (umumiy TS type / DTO / Zod sxema — front↔back **yagona manba**)
- **Package manager:** **pnpm**
- **Konteyner:** **Docker + docker-compose** (postgres + api + web) — bir buyruqli lokal dev
- **Hosting:**
  - Frontend: Vercel / Netlify / Cloudflare Pages _(OG inject kerak bo'lsa web'ni NestJS orqali yoki Node-host'da serve qil — sof statik CDN meta inject qilolmaydi)_
  - Backend (NestJS): **Railway / Render / Fly.io** (Docker)
  - DB: **Neon** (serverless Postgres) / Supabase / Railway
- **CI/CD:** **GitHub Actions** — lint · typecheck · test · build
- **Sifat:** ESLint (flat config) + Prettier + **Husky** + lint-staged (pre-commit)
- **Test:** **Vitest** + React Testing Library (front), Jest/Vitest + `supertest` (NestJS e2e), **Playwright** (mobil viewport, galereya svayp E2E)
- **Rasm-storage (prod):** S3-mos object storage — **Cloudflare R2** / Supabase Storage (demo'da `public/`)

### Cheklovlar

- UI matnlari **o'zbekcha**. Narx formati: `480 000 000 so'm` va `$40 000` (probel ajratgich)
- **Mobil-first;** desktopda kontent `max-width ~480px` markazda
- **Marshrut mapping** (§2 sintaksisi Next.js edi): `/obj/[id]` → `/obj/:id` (React Router), `/api/view/[id]` → `/api/view/:id` (NestJS controller)
- **Ma'lumot manbasi:** `data/objects.json` **emas**, balki PostgreSQL (§3 model = schema + seed)

## 2. Routelar

| Route            | Vazifa                                               |
| ---------------- | ---------------------------------------------------- |
| `/obj/[id]`      | Obyekt sahifasi (asosiy sahifa)                      |
| `/`              | Oddiy index: 3 obyektga havola (demo uchun kifoya)   |
| `/api/view/[id]` | POST — ko'rishlar +1 (KV increment), GET — joriy son |
| 404              | Mavjud bo'lmagan `id` uchun sodda sahifa             |

## 3. Ma'lumot modeli — `data/objects.json`

```json
[
  {
    "id": "bx-001",
    "sarlavha": "2 xonali kvartira, yangi ta'mir, Bukhara City yaqinida",
    "narx_som": 480000000,
    "narx_usd": 40000,
    "xona": 2,
    "maydon_m2": 60,
    "qavat": "4/9",
    "tuman": "Buxoro shahri",
    "manzil": "… ko'chasi",
    "moljal": "… yaqinida (mo'ljal)",
    "tavsif": "3–5 jumla, sifatli tilda.",
    "rasmlar": ["/images/bx-001/01.jpg", "/images/bx-001/02.jpg"],
    "rieltor": {
      "ism": "…",
      "agentlik": "…",
      "surat": "/images/agents/….jpg",
      "tel": "+998901234567",
      "tg": "username"
    },
    "sana": "2026-07-28"
  }
]
```

- 3 ta obyekt: 1 novostroyka, 1 ikkilamchi (2–3 xona), 1 hovli — OLX/Uybor'dagi real e'lonlardan
- Rasmlar: `public/images/[id]/01.jpg …` — **oldindan siqilgan** (kenglik ≤1200px, har biri ~150–250 KB), 5–8 dona

## 4. Sahifa komponentlari (`/obj/[id]`, yuqoridan pastga)

1. **`Gallery`** — touch-svayp, nuqtali indikator; birinchi rasm = LCP → `priority`; qolganlari lazy. Zoom shart emas.
2. **`PriceBlock`** — narx so'mda katta shriftda, ostida kichikroq `$`.
3. **`ParamsRow`** — 4 element ikonka bilan: xona · m² · qavat · tuman.
4. **`Description`** — 3–5 jumla, oddiy matn.
5. **`Location`** — mo'ljal matni. **Xarita YO'Q** (scope'dan tashqarida).
6. **`AgentCard`** — dumaloq surat, ism, agentlik nomi, telefon matn ko'rinishida.
7. **`StickyCTA`** — ekran pastiga yopishgan 2 tugma, doim ko'rinadi (iOS safe-area hisobga olinsin):
   - "📞 Qo'ng'iroq" → `tel:+998…`
   - "✈️ Telegram" → `https://t.me/<username>`
8. **`ViewCounter`** — "👁 N": sahifa ochilganda `/api/view/[id]` ga POST, natijani ko'rsatadi.

## 5. OG / Telegram preview (KRITIK)

- `generateMetadata` har obyekt uchun: `title` = sarlavha + narx; `description` = qisqa tavsif
- `og:image` = birinchi rasm (1200×630 crop varianti tayyorla), `og:title`, `og:description`
- Sinov: havolani o'z Telegram'ingga yubor — rasm + sarlavha + narx chiqishi SHART

## 6. Acceptance (texnik talablar)

- Mobil-first: **360px** kenglikda mukammal; desktopda kontent `max-width ~480px` markazda
- Lighthouse (mobile): **Performance ≥ 90**, LCP < 2.5s
- `next/image` ishlatilsin, `sizes` to'g'ri berilsin
- Hisoblagich degradatsiyasi: KV ishlamasa ham sahifa ochilaveradi (try/catch, hisoblagich yashirinadi)
- Deploy: Vercel; KV tokenlar `.env.local` da va Vercel dashboard'da

## 7. Definition of Done

- [ ] 3 sahifa jonli URL'da ochiladi (`/obj/bx-001` …)
- [ ] Galereya real telefonda svayp ishlaydi
- [ ] `tel:` tugmasi raqam teradi, `t.me` tugmasi chat ochadi
- [ ] Telegram preview: rasm + sarlavha + narx ko'rinadi
- [ ] Hisoblagich 2 xil qurilmadan kirilganda oshadi
- [ ] Lighthouse mobile ≥ 90, LCP < 2.5s
- [ ] Noto'g'ri id → sodda 404

## 8. Scope'dan TASHQARIDA (yozma taqiq)

Login/registratsiya · kiritish formasi (faqat DoD to'liq bo'lib vaqt ortsa — bonus) · admin-panel · CRM · narx-radar · to'lovlar · xarita · ko'p til · har rieltorga alohida domen · chuqur SEO.
Shulardan birortasini qo'shishdan oldin: to'xta, spec'ka qara, "keyinroq" ro'yxatiga yoz.
