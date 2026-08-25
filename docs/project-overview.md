# RieltorApp — loyiha haqida qisqacha

_Holat: 2026-yil 24-avgust_

## 1. Loyiha nimaga xizmat qiladi

Ko'chmas mulk e'lonlarini **telefon ekranida ko'rsatuvchi va rieltor bilan bir bosishda
bog'laydigan** mobil-first veb-ilova.

Asosiy foydalanish stsenariysi: rieltor obyekt havolasini Telegram'da mijozga tashlaydi →
Telegram'da rasm + sarlavha + narx bilan chiroyli preview chiqadi → mijoz havolani ochib,
suratlarni ko'radi va "Qo'ng'iroq" yoki "Telegram" tugmasini bosadi.

**Ilova nima QILMAYDI:** login/registratsiya yo'q, e'lon joylash formasi yo'q, admin-panel
yo'q, to'lov yo'q, xarita yo'q. Ma'lumot bazaga `seed` orqali kiritiladi.

## 2. Boshida nima bo'lishi kerak edi (spec v0.1)

| Reja                  | Hajmi                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| **3 ta obyekt**       | Buxorodan olingan e'lonlar, qo'lda seed                                                              |
| **2 ta sahifa**       | `/` (3 ta havola ro'yxati) va `/obj/:id`                                                             |
| **8 ta komponent**    | Galereya, narx, parametrlar, tavsif, joylashuv, rieltor kartasi, sticky CTA, ko'rishlar hisoblagichi |
| **1 ta kritik talab** | Telegram OG preview (SPA bo'lgani uchun server head-inject)                                          |
| **Hisoblagich**       | `POST/GET /api/view/:id`, Postgres'da atomik increment                                               |
| **Sifat**             | Mobil 360px, Lighthouse ≥ 90, LCP < 2.5s                                                             |

Ya'ni boshida bu **demo** edi — "shu 3 ta sahifa jonli URL'da ochilsa, DoD bajarildi".

## 3. Hozir nima bo'ldi

Demo skeleti to'liq bajarildi, ustiga **haqiqiy ilovaga o'xshash qatlam** qo'shildi:

| Boshida                    | Hozir                                                                           |
| -------------------------- | ------------------------------------------------------------------------------- |
| 3 ta obyekt (Buxoro)       | **18 ta obyekt** (Toshkent, OLX.uz'dan olingan real e'lonlar)                   |
| Oddiy havolalar ro'yxati   | **Kartalar lentasi** — filtr, saralash, "Ko'proq ko'rsatish"                    |
| 2 ta sahifa                | **7 ta sahifa** + pastki tab-menyu (Bosh sahifa · Qidiruv · Sevimlilar · Aloqa) |
| Faqat obyekt ko'rish       | **Sevimlilar**, **qidiruv tarixi**, **kengaytirilgan filtr paneli**             |
| —                          | **Ommaviy oferta** va **Aloqa/FAQ** sahifalari                                  |
| Faqat `/obj/:id` uchun SSR | Barcha SPA marshrutlari server tomondan HTML qobiq bilan beriladi               |

## 4. Funksiyalar ro'yxati

### Foydalanuvchi ko'radigan qism

- **Bosh sahifa (`/`)** — e'lon kartalari; Sotib olish/Ijara segmenti, tur bo'yicha chiplar
  (Yangi qurilish · Ikkilamchi · Hovli · Tijorat), matnli qidiruv, saralash (Yangi · Arzon · Qimmat),
  6 tadan sahifalash. Har ikkala segment ham to'la: sotuvda 12 ta, ijarada 6 ta e'lon,
  shundan 4 tasi tijorat obyekti. Ijara narxi hamma joyda `/oy` bilan ko'rsatiladi.
- **Qidiruv (`/search`)** — so'nggi qidiruvlar chiplari, ommabop tumanlar ro'yxati,
  filtr paneli (xona soni, narx oralig'i, maydon oralig'i) va jonli hisoblagichli
  "Natijalarni ko'rsatish · N ta" tugmasi.
- **Obyekt sahifasi (`/obj/:id`)** — svayp galereya (scroll-snap, kutubxonasiz), narx
  (so'm + $), parametrlar qatori, tavsif, joylashuv, rieltor kartasi, ekran pastiga
  yopishgan "Qo'ng'iroq / Telegram" tugmalari, ko'rishlar hisoblagichi.
- **Sevimlilar (`/favorites`)** — kartadagi ♡ orqali saqlangan e'lonlar. Saqlanish joyi —
  brauzerning `localStorage`i, serverga yuborilmaydi.
- **Aloqa (`/contact`)** — agentlik ma'lumoti, qo'ng'iroq/Telegram tugmalari, FAQ akkordeoni.
- **Ommaviy oferta (`/offer`)** — 10 bo'limli shartlar matni (namuna, yurist ko'rigidan o'tmagan).
- **404** — noto'g'ri `id` yoki mavjud bo'lmagan marshrut uchun uslublangan sahifa
  (server ham HTTP 404 status qaytaradi).

### Server tomonidagi qism

| Endpoint               | Vazifa                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| `GET /api/objects`     | E'lonlar ro'yxati (karta uchun qisqartirilgan ma'lumot)          |
| `GET /api/objects/:id` | Bitta e'lon — to'liq ma'lumot, rasmlar, rieltor                  |
| `POST /api/view/:id`   | Ko'rishlar +1 (atomik `increment`, bir IP — 10 daqiqada 1 marta) |
| `GET /api/view/:id`    | Joriy ko'rishlar soni                                            |
| `GET /api/health`      | Servis va DB tirikligi                                           |
| `GET /api/docs`        | Swagger — sxemalar Zod'dan avtomatik generatsiya qilinadi        |
| `GET /obj/:id`         | HTML qobiq + `<head>` ga `og:*` teglar inject qilinadi           |

Qo'shimcha server funksiyalari:

- **Rasm quvuri** — `sharp` orqali har rasmdan 360/720/1200px `webp` + `jpg` fallback
  va 1200×630 OG-crop generatsiya qilinadi (seed vaqtida, avtomatik).
- **Degradatsiya** — DB ishlamasa sahifa baribir ochiladi, hisoblagich yashiriladi.
- **Bitta jarayon** — NestJS API, build qilingan SPA va rasmlarni birga xizmat qiladi
  (gzip/brotli siqish, hashli assetlarga uzoq kesh).

## 4b. Phase 1 — Marketplace poydevori (2026-08-21+)

Demo ustiga real marketplace qatlami qo'shildi. Spec: `docs/superpowers/specs/2026-08-21-platform-spec.md`,
reja: `docs/superpowers/plans/2026-08-21-phase-1-marketplace-foundation.md`.

### Foydalanuvchi va autentifikatsiya

- **Kirish** — telefon OTP (SMS kodi) yoki **Telegram Login** (HMAC imzo tekshiruvi bilan).
  JWT access (15 daq) + aylanuvchi refresh (30 kun) token; `localStorage`da saqlanadi,
  401 da avtomatik yangilanadi.
- **Login modal** — telefon → 6 xonali kod (120s taymer, qayta yuborish), o'zbekcha.
  Desktop header'da "Kirish" / akkaunt holati / "+ E'lon joylash" tugmasi (faqat ≥1440px).

### E'lon joylash va moderatsiya

- **6 qadamli sehrgar (`/my/listings/new`)** — bitim+tur → manzil → parametrlar →
  **rasm yuklash** (sharp quvuri, ≤10 ta) → narx → kontaktlar. Draft har qadamda saqlanadi.
- **Hayot sikli** — DRAFT → MODERATION → PUBLISHED / REJECTED / ARCHIVED. Public API faqat
  PUBLISHED ko'rsatadi. `priceUsd` submit'da so'mdan hosil qilinadi.
- **Moderatsiya navbati** — MODERATOR/ADMIN roli (RolesGuard) approve/reject qiladi.
- **Kabinet (`/my/listings`)** — foydalanuvchi e'lonlari (rangli status-chip) + saqlangan qidiruvlar.

### Marketplace funksiyalari

- **Yashirin telefon + reveal kuzatuvi (A8)** — public payloadda faqat maskalangan raqam
  (`+998 90 ••• •• 67`); "Qo'ng'iroq" bosilganda `/api/objects/:id/contact` orqali ochiladi
  va `ContactReveal` yozuvi tushadi (lead hodisasi).
- **Saqlangan qidiruvlar** — bosh sahifa filtr panelidagi "Qidiruvni saqlash".

### Desktop dizayn (CIAN uslubi, ≥1440px, `desk:`)

- Gorizontal menyuli header, yopishqoq filtr paneli, to'liq kenglikli grid.
- **3 ustunli natija qatori** (`/search`) — foto + kontent + sotuvchi paneli (maskalangan raqam,
  ✓ TEKSHIRILGAN, Batafsil).
- Obyekt sahifasi: chapda galereya, o'ngda yopishqoq narx+CTA ustuni.
- **Telefon (<1440px) ko'rinishi butunlay o'zgarmagan** — barcha desktop uslub `desk:` ostida.

### Yangi API endpointlari (global `api` prefiks)

`POST /api/auth/otp/{request,verify}` · `POST /api/auth/telegram` · `GET /api/auth/me` ·
`POST /api/auth/{refresh,logout}` · `GET/POST/PATCH/POST :id/submit /api/my/listings` ·
`POST/DELETE /api/my/listings/:id/images` · `GET/POST/DELETE /api/moderation/listings/...` ·
`GET /api/objects/:id/contact` · `GET/POST/DELETE /api/my/saved-searches`.
Yangi Prisma modellari: `User`, `Session`, `OtpCode`, `SavedSearch`, `ContactReveal` +
`Listing.{status,ownerId,rejectionReason,publishedAt}`. Global `ZodError → 400` filtri.

## 4c. Phase 2.1 — AI poydevori (2026-08-24)

Sotuvchini ushlash bosqichining birinchi rejasi. Spec: `docs/superpowers/specs/2026-08-21-platform-spec.md`,
reja: `docs/superpowers/plans/2026-08-24-phase-2.1-ai-foundation.md`.

### AI provayder

- **Google Gemini** (`@google/generative-ai`, model `gemini-1.5-flash`). Yagona `GeminiService.generate()`
  — kalit bo'lmasa yoki xato bo'lsa **hech qachon otmaydi**, `null` qaytaradi; chaqiruvchi shablon
  matnga tushadi. `GEMINI_API_KEY` ixtiyoriy: bo'lmasa ilova to'liq ishlaydi (**degradatsiya**).

### "Uyingiz qancha turadi?" — baholash

- **Public sahifa (`/valuation`)** — 3 qadamli oqim (tur+tuman → xona+maydon → natija), login talab qilmaydi.
  Bosh sahifada "Uyingiz qancha turadi?" banneri.
- **Gibrid hisob** — tuman+xona+maydon bo'yicha **median m² narx** (faqat `SALE`, `PUBLISHED` e'lonlardan;
  yetarli comparables bo'lmasa tuman→tur bo'yicha kaskad), ustiga Gemini o'zbekcha tushuntirish.
  Kalit bo'lmasa median raqamlar + shablon izoh qaytadi. Pul qiymatlari string sifatida.

### AI tavsif va ovozli kiritish (e'lon sehrgarida)

- **AI tavsif tugmasi** — parametrlar qadamida obyekt ma'lumotidan avtomatik tavsif yozadi.
  Gemini mavjud bo'lmasa endpoint toza **503** (`AI hozircha mavjud emas, tavsifni qo'lda yozing`) qaytaradi,
  maydon qo'lda tahrirlanaveradi.
- **Ovozli kiritish** — sarlavha va tavsif yonida mikrofon tugmasi (Web Speech API, `uz-UZ`).
  Brauzer qo'llab-quvvatlamasa tugma **umuman render bo'lmaydi** (feature-detect), hech narsa buzilmaydi.

### Yangi API endpointlari

`POST /api/valuation` (public) · `POST /api/ai/description` (JWT bilan himoyalangan).
Yangi env: `GEMINI_API_KEY` (ixtiyoriy) · `GEMINI_MODEL` (default `gemini-1.5-flash`).
**Telefon (<1440px) ko'rinishi o'zgarmagan** — baholash sahifasi va sehrgar tugmalari mobil-first.

## 4d. Phase 2.2 — Sotuvchini ushlash (2026-08-25)

Bir martalik baholashni doimiy munosabatga aylantiradi. Spec:
`docs/superpowers/specs/2026-08-25-phase-2.2-seller-retention-design.md`,
reja: `docs/superpowers/plans/2026-08-25-phase-2.2-seller-retention.md`.

### "Mening uyim" — uy qiymatini kuzatish

- **Kabinet (`/my/properties`)** — foydalanuvchi uylarini kuzatadi (baholash parametrlaridan),
  har biriga joriy taxminiy narx, oylik o'zgarish (▲/▼) va mini-grafik. Baholash natijasidagi
  **"Uyni kuzatishga qo'shish"** tugmasi 2.1 baholashni retensiyaga ulaydi.
- **Tafsilot (`/my/properties/:id`)** — katta joriy baho + **narx tarixi grafigi** (Recharts,
  alohida lazy chunk). Tarixiy narx ma'lumoti yo'qligi uchun grafik **modellashtirilgan trailing
  egri** bilan to'ldiriladi (uzuq chiziq, aniq belgilangan); real oylik snapshotlar uni asta
  almashtiradi. Bo'sh bozorda "Ma'lumot yetarli emas" holati ("0 so'm" o'rniga).

### Oylik xabarnoma

- **Ilova ichidagi inbox (`/notifications`)** + desktop header'da o'qilmagan-badge'li qo'ng'iroq.
- **Oylik cron** (`@nestjs/schedule`, har oy 1-sana) har mulkni qayta baholaydi, `ACTUAL`
  snapshot qo'shadi va narx o'zgargan bo'lsa `PRICE_UPDATE` xabarnoma yozadi.

### "Qidiryapman" — teskari e'lonlar

- **Doska (`/requests`)** — xaridorlar so'rov joylaydi (bitim, tur, tuman, xona, byudjet);
  rieltor/egalar filtr bilan ko'radi va telefonni ochadi (maskalangan → reveal + lead log,
  e'lon reveal patterni). `/requests/new` va `/my/requests` (yopish/o'chirish).

### Yangi API va env

`GET/POST/GET :id/DELETE /api/my/properties` · `GET/POST read-all/:id/read /api/my/notifications` ·
`GET(filtr, public)/POST/GET :id/POST :id/contact/PATCH/DELETE /api/requests` · `GET /api/my/requests`.
Yangi Prisma modellari: `TrackedProperty`, `PriceSnapshot` (MODELED/ACTUAL), `Notification`,
`PropertyRequest`; `ContactReveal.requestId` qo'shildi. Pul qiymatlari BigInt→string.
**Telefon (<1440px) ko'rinishi o'zgarmagan** — barcha yangi sahifalar mobil-first, desktop `desk:` bilan.

## 4e. Responsive pog'onalar (2026-08-25)

Ilova avval **2 ta qat'iy** ko'rinishga ega edi (`<1440` telefon ustuni, `≥1440` CIAN) —
1024/1280px'da kontent 480px bo'lib, ikki yonida katta bo'sh joy qolar edi. Endi to'liq
responsive, 3 pog'ona bilan (spec/reja: `docs/superpowers/.../2026-08-25-responsive-tiers.*`):

| Kenglik           | Ko'rinish                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| `<768` telefon    | mavjud mobil ustun + pastki tab-menyu (**o'zgarmagan**)                                           |
| `md:768` planshet | **gorizontal top-nav** (pastki menyu yashirin), kontent kenglikni to'ldiradi, karta gridi 2 ustun |
| `lg:1024` noutbuk | top-nav (to'liq yozuvli), 3 ustun, kontent to'la                                                  |
| `desk:1440` CIAN  | yopishqoq sidebar + 4 ustun / 3-ustunli natija qatori (**o'zgarmagan**)                           |

Kontent `md`–`desk` oralig'ida **suzuvchi** (kenglikni to'ldiradi, o'lik chekka yo'q); grid
sahifalar ustun sonini oshiradi, o'qish/forma sahifalar markazda qulay kenglikda qoladi.
Telefon (`<768`) va CIAN (`≥1440`) piksel-bir-xil — barcha yangi qoidalar faqat `md:`/`lg:` ostida.

## 5. Texnik stack

- **Monorepo:** Yarn 4 workspaces + Turborepo — `apps/web`, `apps/api`, `packages/shared`
- **Front:** React 19 · Vite 6 · TypeScript · Tailwind v4 · React Router 7 · TanStack Query 5 ·
  Recharts (narx tarixi grafigi, lazy) · Feature-Sliced Design (ESLint `boundaries` plagini qatlam qoidalarini majburlaydi)
- **Back:** NestJS 11 · Node 22 · Prisma 6 · PostgreSQL 16 · Zod (env + DTO + Swagger) ·
  `@nestjs/schedule` (oylik narx cron)
- **AI:** Google Gemini (`@google/generative-ai`) — baholash izohi va e'lon tavsifi, degradatsiya bilan
- **Umumiy:** `@rieltor/shared` — Zod sxemalar, narx formatteri, rasm nomlash qoidasi
  front va back uchun **yagona manba**
- **Test:** Vitest (unit) · supertest (API e2e) · Playwright (360px viewport)
- **CI:** GitHub Actions — format → lint → typecheck → build → migrate → seed → test,
  so'ng `docker compose` ustida e2e
- **Deploy:** bitta Docker imiji; yo'riqnoma — [deploy.md](deploy.md) (Neon + Railway)

## 6. Hali yopilmagan joylar

- **Filtrlash va qidiruv brauzer tomonida** — butun ro'yxat bir marta yuklanadi.
  18 ta e'lon uchun yetarli, yuzlab e'lon bo'lsa server tomoniga ko'chirish kerak.
- **DoD'ning jonli URL talab qiladigan punktlari tekshirilmagan** — Telegram preview,
  Lighthouse ≥ 90, ikki qurilmadan hisoblagich (batafsil: [deploy.md](deploy.md) oxiri).
- **Oferta matni yuridik ko'rikdan o'tmagan** — prodga chiqishdan oldin yurist tekshirishi
  va kompaniya rekvizitlari qo'shilishi kerak.
