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

## 4f. Phase 2.3 — Telegram bot (2026-08-26)

Marketplace'ni Telegram ichiga olib chiqadi — foydalanuvchi brauzerni ochmasdan uy baholaydi,
e'lon joylaydi va o'z e'lonlarini kuzatadi. Spec:
`docs/superpowers/specs/2026-08-25-phase-2.3-telegram-bot-design.md`,
reja: `docs/superpowers/plans/2026-08-25-phase-2.3-telegram-bot.md`.
`/start` inline menyu uch stsenariyni ochadi (baholash / e'lon joylash / mening e'lonlarim).
Har uchalasi mavjud servislarni chaqiradi — **yangi biznes-logika yozilmagan**.

### Chatda uy baholash

- **"Uyingiz qancha turadi?"** stsenariysi (tur → tuman → xona → maydon) `ValuationService`ni
  chaqiradi — web'dagi bilan **bir xil** taxmin, past/yuqori oralig'i va izoh (2.1 baholash).

### Chatda e'lon joylash sehrgari

- Ketma-ket savol-javob: bitim → tur → tuman → manzil → mo'ljal → xona/maydon/qavat →
  **rasmlar** → sarlavha → tavsif → narx → **moderatsiyaga yuboriladi** (web'dagi `MODERATION`
  oqimi bilan bir xil). Tijorat obyektida xona so'ralmaydi.
- Rasm Telegram'dan `file_id` orqali yuklab olinadi va `ListingsService.addImageBuffer` ichida
  **`processImage`** (sharp) quvuridan o'tadi — upload endpoint bilan aynan bir pipeline.

### "Mening e'lonlarim"

- Foydalanuvchi e'lonlari holat yorliqlari bilan (Qoralama / Moderatsiyada / Chop etilgan /
  Rad etilgan / Arxivlangan) va har biriga `PUBLIC_BASE_URL/obj/:id` havolasi.

### Xabarnoma DM

- Phase 2.2 **oylik narx xabarnomasi** endi ilova ichidagi inbox'dan tashqari **Telegram DM**
  sifatida ham yetkaziladi — `telegramId` bo'lgan foydalanuvchiga. `NotificationsService`
  `TelegramNotifier` seam'i orqali yuboradi; bot uxlab yotsa DM sokin o'tkazib yuboriladi.

### Graceful degradation

- Haqiqiy token bo'lmasa bot **uxlaydi** (`getMe()` placeholder token'da tez rad etadi),
  API baribir normal ishga tushadi va CI yashil qoladi — CI `check`/`e2e` joblari placeholder
  token (`ci-test-bot-token`) bilan ishlaydi va buzilmaydi. `TELEGRAM_BOT_TOKEN` env o'zgaruvchisi
  Phase 2.2'dayoq mavjud edi — **yangi env qo'shilmagan**. Hech bir servis botga bog'liq emas:
  yagona bir tomonlama seam — `TelegramNotifier`.

### Jonli ishga tushirish

1. @BotFather orqali bot yarating va tokenni oling.
2. `TELEGRAM_BOT_TOKEN`ni haqiqiy qiymatga o'rnating.
3. API'ni qayta ishga tushiring — bot long-polling'ni boshlaydi va DM'lar oqadi.

> Web'dagi "Telegram orqali kirish" tugmasi alohida `VITE_TELEGRAM_BOT_USERNAME` (Vite/web) env'ini
> ishlatadi — uni yangi bot username'iga moslash mumkin, lekin **bot ishlashi uchun shart emas**.

**Stack:** `nestjs-telegraf` + `telegraf`, long-polling, stsenariya sessiyalari **xotirada**
(bitta instans uchun; ko'p instansda Redis sessiya store kerak). Launch `BotService`da qo'lda
(`launchOptions: false`) — yomon token boot'ni yiqitmaydi.

## 4g. Phase 3.1 — Rieltor kabineti (2026-08-26)

Rieltorlar uchun alohida ish kabineti — obuna, shaxsiy eslatmalar va mijozga podborkalar.
Spec: `docs/superpowers/specs/2026-08-26-phase-3.1-realtor-cabinet-design.md`,
reja: `docs/superpowers/plans/2026-08-26-phase-3.1-realtor-cabinet.md`.
Marketplace'ga **tegilmagan** — kabinet uning `/api/objects` e'lonlarini qayta ishlatadi.

### Alohida ilova — `apps/agent`

- Yangi **`apps/agent`** SPA'si (React 19 · Vite 6 · Tailwind v4 · React Router 7 · TanStack
  Query 5, Feature-Sliced Design) — `apps/web` konfigini aks ettiradi, lekin **web'ni
  import qilmaydi**.
- Prod'da **`/agent`** subpath'ida xizmat qilinadi: API `bootstrap.ts` express darajasida
  statik asset'lar (`/agent/assets/*`) va SPA-fallback (`/agent`, `/agent/*` → `index.html`)
  o'rnatadi. Fallback Nest router'idan **oldin** ishlaydi, shuning uchun `/agent` web
  SSR'iga tushmaydi. Bu **`/api/agent`ga tegmaydi** — u NestJS `AgentController` ostidagi
  API (global `api` prefiks).

### Obuna: trial → paywall

- **"Rieltor bo'lish"** USER'ni REALTOR'ga aylantiradi va **14 kunlik bepul trial** ochadi
  (`status=TRIAL`). Idempotent — mavjud rieltor obunasini saqlaydi.
- Muddat tugasa **paywall** ko'rsatiladi; **"test to'lov"** obunani **30 kunga** faollashtiradi
  (`status=ACTIVE`). To'lov **STUB** — haqiqiy pul yechilmaydi, real Click/Payme keyin.
- **`RealtorGuard`** har so'rovda **jonli muddatni** tekshiradi (`status !== EXPIRED` **va**
  `currentPeriodEnd > hozir`) — muddati o'tgan obuna kabinet API'siga kira olmaydi.

### Rieltor profili

- Ichki profil: agentlik nomi, bio, ishlaydigan hududlar, tajriba (`RealtorProfile`) —
  hozircha faqat kabinet ichida ko'rinadi (ommaviy profil 3.3'da).

### Eslatmalar (C9) va Kolleksiyalar (C10)

- **Eslatmalar** — har e'longa rieltorning **shaxsiy** matnli eslatmasi (`Note`,
  `realtorId_listingId` bo'yicha unikal upsert).
- **Kolleksiyalar / podborka** — mijoz uchun tartiblangan e'lon to'plamlari (`Collection` +
  `CollectionItem`): yaratish, e'lon qo'shish/olib tashlash, qayta tartiblash.
- Har ikki so'rov **egalik bo'yicha** cheklangan — rieltor faqat o'zining eslatma va
  kolleksiyalarini ko'radi/o'zgartiradi.

### E'lon-browser

- Kabinet ichidagi e'lon ro'yxati marketplace **`/api/objects`**ni qayta ishlatadi —
  yangi e'lon manbasi yozilmagan; eslatma va kolleksiya elementlari `ListingSummary`ni ushlaydi.

### Ma'lumot modeli va API

- **5 yangi Prisma modeli:** `RealtorProfile`, `Subscription`, `Note`, `Collection`,
  `CollectionItem`.
- Yangi **`agent`** API moduli (`/api/agent/*`) — barcha yozuv/o'qish yo'llari `RealtorGuard`
  bilan himoyalangan (rol + jonli obuna).
- **Yangi env qo'shilmagan**; marketplace, AI va bot oqimlariga tegilmagan.

### Kelasi

- Ommaviy rieltor profili + reyting (3.3), ulashiladigan taqdimot + analitika (3.2),
  shaxsiy sayt generatori (3.3), va **real to'lov** integratsiyasi (Click/Payme).

## 4h. Phase 3.2 — Mijoz taqdimotlari (2026-08-27)

Rieltor kolleksiyasini mijozga yuboriladigan ommaviy taqdimotga aylantiradi — ochiladigan
havola, boy Telegram/WhatsApp karta va ochilish analitikasi bilan.
Spec: `docs/superpowers/specs/2026-08-27-phase-3.2-presentations-design.md`,
reja: `docs/superpowers/plans/2026-08-27-phase-3.2-presentations.md`.
Marketplace e'lon ko'rinishiga **tegilmagan** — taqdimot uning kartalari va SSR'ini qayta ishlatadi.

### Snapshot taqdimot

- **"Taqdimot yaratish"** kolleksiyadan **o'zgarmas nusxa** oladi — `Presentation` +
  har element uchun `PresentationItem` (listing, tartib, izoh) bitta atomik create'da
  ko'chiriladi. Keyin manba kolleksiyani tahrirlash **yuborilgan taqdimotga ta'sir qilmaydi**.
- Har element uchun **mijozga qaratilgan izoh** (`CollectionItem.note` → snapshot'ga) taqdimotda
  **"Rieltor izohi"** bo'lib ko'rinadi. Bu C9 **shaxsiy** eslatmadan (`Note`) **butunlay
  boshqa** maydon — ichki eslatma hech qachon ommaga chiqmaydi.

### Ommaviy `/p/:token` sahifasi

- **SSR + og-preview**: `buildPresentationMetaTags` orqali Telegram/WhatsApp'ga boy karta
  (sarlavha, tavsif, rasm) beriladi — `obj/:id` naqshini aks ettiradi.
- E'lonlar marketplace'ning mavjud **e'lon kartalari** bilan render qilinadi (reuse).
- Sahifa **`NotFoundShellFilter`** orqali xizmat qilinadi: ommaviy API `@Controller('p')`
  (→ `/api/p/:token`) bilan to'qnashuv bo'lgani uchun `/p/:token` `setGlobalPrefix` **exclude**'iga
  qo'shilmaydi (aks holda API GET'i un-prefiks bo'lardi). Live token → to'ldirilgan shell,
  noma'lum token → oddiy 404 shell (`obj/:id` bilan bir xil).

### Analitika (C4)

- Mijoz sahifada — **ochilishlar** (null `listingId` event) va **per-obyekt dwell**
  (`IntersectionObserver` bilan ko'rish vaqti, `navigator.sendBeacon` bilan yuboriladi).
- Rieltor kabinetida — **"Jami ochilishlar"** va har e'lon uchun **"N ochilish · o'rtacha Xs"**
  (bitta `groupBy` bilan agregatsiya; null-guruh — jami ochilish, listing guruhlari — per-item).

### Telegram ulashish (C5)

- Kabinetdagi **"Ulashish"** `t.me/share/url` deep-link'i taqdimot havolasini ochadi;
  Telegram og-preview'ni tortadi — mijoz oldindan boy kartani ko'radi.

### Ommaviy endpointlar

- **`GET /api/p/:token`** (o'qish) va **`POST /api/p/:token/view`** (analitika ingest) —
  **authsiz**, faqat **token bilan** himoyalangan va **obunaga bog'liq EMAS**: yuborilgan
  havola rieltor obunasi tugagan bo'lsa ham ishlaydi (mijoz — platforma foydalanuvchisi emas).
  `realtorId`, analitika va token ichki tafsilotlari hech qachon ochilmaydi.
- Yaratish / ro'yxat / detal-analitika / o'chirish esa **`RealtorGuard` + egalik** bilan
  cheklangan — rieltor faqat o'z taqdimotlarini boshqaradi.

### Ma'lumot modeli va env

- **3 yangi Prisma modeli:** `Presentation`, `PresentationItem`, `PresentationView`.
- **Yangi env qo'shilmagan**; marketplace listing ko'rinishi va API'siga tegilmagan.

### Kelasi

- Shaxsiy sayt generatori + ommaviy rieltor profili (3.3), va **real to'lov** (Click/Payme).

## 4i. Phase 3.3a — Rieltorning ommaviy sahifasi (2026-08-27)

Har rieltorga **brendlangan ommaviy mikrosayt** (`/r/:slug`) beradi — logotip, brend rangi,
**tasdiqlangan nishoni** va avtomatik yangilanadigan **e'lonlar katalogi** bilan — hamda
marketplace'dagi "kim sotyapti" ko'rinishini **real rieltor profiliga** bog'laydi (3.1/3.2 dan
ataylab qoldirilgan qism). Bu Product C ning **C1** (sayt generatori) + **C14** (tasdiqlangan
profil) qismi; **reyting/sharhlar** esa **3.3b** ga qoldirildi.
Spec: `docs/superpowers/specs/2026-08-27-phase-3.3a-realtor-public-profile-design.md`,
reja: `docs/superpowers/plans/2026-08-27-phase-3.3a-realtor-public-profile.md`.

### Ommaviy `/r/:slug` mikrosayti

- **SSR + og-preview**: `buildRealtorMetaTags` orqali Telegram/WhatsApp'ga boy karta (rieltor
  nomi · agentlik, tavsif, logotip yoki birinchi e'lon rasmi) beriladi — `p/:token` naqshini
  aks ettiradi.
- **Brendlangan sarlavha** (logotip, ism, agentlik, **tasdiqlangan** nishoni, bio, hududlar,
  tajriba, `brandColor` urg'u) + **katalog**: rieltorning **PUBLISHED** e'lonlari marketplace
  kartalari bilan render qilinadi (reuse), har biri `/obj/:id` ga havola.
- Sahifa **`NotFoundShellFilter`** orqali xizmat qilinadi: ommaviy API `@Controller('r')`
  (→ `/api/r/:slug`) bilan to'qnashmaslik uchun `/r/:slug` `setGlobalPrefix` **exclude**'iga
  qo'shilmaydi (`/p/:token` bilan bir xil dars). Noma'lum slug → oddiy 404 shell.

### Brending (kabinet, `apps/agent`)

- Rieltor 3.1 profil sahifasida **slug** (`/r/[slug]`), **logotip yuklash**
  (`POST /api/agent/profile/logo` → `processImage`), **brend rangi** va ommaviy-sahifa
  havolasini boshqaradi. Slug'da **band nomlar ro'yxati** (`search`, `new`, `obj`, `p`, `r`, …)
  va **noyoblik** tekshiriladi — band bo'lsa "Bu manzil band" / "allaqachon olingan".

### Tasdiqlash (moderator)

- **`PATCH /api/moderation/realtors/:userId`** (`{ verified }`) + **`GET /api/moderation/realtors`** —
  faqat **`MODERATOR`/`ADMIN`** (`JwtGuard + RolesGuard`). Nishon `/r/:slug` sarlavhasida va
  marketplace sotuvchi panelida ko'rinadi. `apps/web`'da minimal moderator ro'yxati (verify toggle).

### Marketplace ulanishi (additive)

- Listing mapper'da sotuvchi **shartli** aniqlanadi: e'lon egasi **published rieltor**
  (`owner.role === 'REALTOR'` va `realtorProfile.slug` bor) bo'lsa → **real rieltor**
  (ism, agentlik, logotip, `verified`, `profileSlug`); aks holda **avvalgi `Agent`** aynan
  o'zi (`verified: false`, `profileSlug: null`). `AgentSchema` (+`verified`/`profileSlug`) va
  `ListingSummary` (+`agentVerified`/`agentProfileSlug`) **doim to'ldirilgan** — seed e'lonlar
  **o'zgarmaydi** (natijalar qatoridagi legacy nishoni ham saqlanadi).

### Ommaviy endpointlar

- **`GET /api/r/:slug`** va **`/r/:slug`** sahifasi — **authsiz**, **slug bilan** himoyalangan va
  **obunaga bog'liq EMAS**: rieltor obunasi tugagan bo'lsa ham ommaviy sahifa ishlaydi (marketing
  ko'rinishi). `userId` va ichki maydonlar ochilmaydi. Tahrirlash / logotip / tasdiqlash esa
  **`RealtorGuard` / `MODERATOR`** bilan cheklangan.

### Ma'lumot modeli va env

- `RealtorProfile`'ga **4 additiv ustun**: `slug` (`@unique`), `verified`, `logoUrl`, `brandColor`
  (migratsiya additiv). **Yangi env qo'shilmagan** (`PUBLIC_BASE_URL` va rasm quvuri mavjud edi).

### Kelasi

- **3.3b:** rieltor **sharhlari + reyting** (C14 ning ikkinchi yarmi; profil sahifasida joy
  ajratilgan). Subdomen (`ali.domen.uz`) — keyin reverse-proxy bilan, kod o'zgarishisiz.

## 4j. Phase 3.3b — Rieltor sharhlari + reyting (2026-08-28)

C14 ning ikkinchi yarmi: rieltorlar uchun **moderatsiyalanadigan ommaviy reyting + sharhlar**.
`/r/:slug` mikrosaytida (3.3a ajratgan joyda) va marketplace sotuvchi ko'rinishida ko'rsatiladi —
3.3a tasdiqlangan-nishoni ochган ishonch halqasini yopadi. **Shu bilan Phase 3 (Rieltor toolkit)
to'liq tugadi.**
Spec: `docs/superpowers/specs/2026-08-28-phase-3.3b-realtor-reviews-rating-design.md`,
reja: `docs/superpowers/plans/2026-08-28-phase-3.3b-realtor-reviews-rating.md`.

### Sharh yozish

- **Har qanday telefon-tasdiqlangan foydalanuvchi** bitta rieltorga **bitta** sharh (1–5 yulduz +
  ixtiyoriy izoh) qoldiradi — `POST /api/r/:slug/reviews` (**`JwtGuard`**, obunaga bog'liq EMAS).
  `Review` `@@unique([realtorId, authorId])` — qayta yozsa upsert → holat yana **PENDING**. Rieltor
  o'ziga sharh qoldira olmaydi (400). O'z sharhini `GET /api/r/:slug/my-review` (authed) bilan ko'radi.

### Keshlangan agregat (o'zak invariant)

- `RealtorProfile` += **`ratingSum`** + **`ratingCount`** — faqat **APPROVED** sharhlardan. Har
  APPROVED-a'zolik o'zgarishida **tranzaksiyada delta** bilan yangilanadi (marketplace har e'londa
  sotuvchini serializatsiya qiladi — N+1 bo'lmasin). Ikki yozuvchi (sharh tahriri + moderator)
  bitta `RealtorProfile` qatorini **`SELECT … FOR UPDATE`** bilan qulflaydi → agregat hech qachon
  drift qilmaydi.

### Moderatsiya

- **`GET /api/moderation/reviews`** (PENDING navbat) + **`PATCH /api/moderation/reviews/:id`**
  (`{ status }`, tranzaksion delta) — `MODERATOR`/`ADMIN`. Faqat APPROVED ommaga chiqadi va agregatga
  kiradi. `apps/web`'da "Sharhlar" navbati (tasdiqlash/rad etish).

### Ommaviy ko'rsatish + marketplace

- **`GET /api/r/:slug`** += `ratingAvg`/`ratingCount`/`reviews` (APPROVED, yangi-birinchi, muallif
  ismi/rasmi — `authorId` sizmaydi). `/r/:slug` sahifasida reyting bloki + auth foydalanuvchi uchun
  **sharh formasi** (moderatsiyada holati bilan).
- **Marketplace (additiv):** `AgentSchema` += `ratingAvg`/`ratingCount`, `ListingSummary` +=
  `agentRatingAvg`/`agentRatingCount` (3.3a naqshi, **doim to'ldirilgan**); sotuvchi panelida/qatorda
  ixcham yulduz+son (`ratingCount > 0` bo'lganda). Seed e'lonlar **o'zgarmaydi**.
- **Kabinet:** rieltor o'z reytingi + sharhlarini (faqat o'qish) "Baholarim" bo'limida ko'radi.

### Ma'lumot modeli va env

- **1 yangi Prisma model** (`Review`) + `ReviewStatus` enum + `RealtorProfile`'ga 2 keshlangan
  ustun (additiv migratsiya). **Yangi env qo'shilmagan.**

### Kelasi

- Rieltor **javobi** (sharhga), **report/flag**, reyting bo'yicha **saralash** — keyin. Phase 4:
  **Lead market** (yopiq halqani yopadi).

## 4k. Phase 4.1 — Lead poydevori (2026-08-30)

Phase 4 (Lead market — yopiq halqani yopadigan faza) ning birinchi qadami: bepul "Qidiryapman"
xaridor-so'rovi doskasini **skorlangan, narxlangan, eksklyuziv olinadigan lead doskasi**ga
aylantiradi. To'lov (hamyon) → 4.2, conversion tracking → 4.3, cross-CRM fixation (C6) → Phase 5.
Spec: `docs/superpowers/specs/2026-08-28-phase-4.1-lead-foundation-design.md`,
reja: `docs/superpowers/plans/2026-08-28-phase-4.1-lead-foundation.md`.

### PropertyRequest → Lead (additiv)

- `PropertyRequest` joyida o'stirildi (rename yo'q, API/UI'da **"Lead"**): += `score Int`,
  `priceSom BigInt`, `claimedById`/`claimedBy`(SetNull)/`claimedAt`; `RequestStatus` += `CLAIMED`/
  `EXPIRED`. Migratsiya **additiv**.

### Skorlash + narx (sof funksiya)

- `computeLeadScore` (0–100, deterministik): to'liqlik (+10×5 maydon, max 50) + byudjet
  (`priceMaxSom/50mln`, max 30) + yangililik (max 20, kunlik pasayadi). `priceForScore` → 3 tier:
  `<40`→**20 000**, `≤70`→**35 000**, `>70`→**50 000 so'm**. Yaratishda hisoblanadi + saqlanadi.

### Rieltor lead-lentasi + eksklyuziv claim

- **`GET /api/leads`** (RealtorGuard) — OPEN leadlar **score-desc**, xaridor telefoni **niqoblangan**.
  **`POST /api/leads/:id/claim`** (RealtorGuard) — tranzaksiyada `SELECT … FOR UPDATE` bilan
  `OPEN→CLAIMED` (birinchi rieltor yutadi, ikkinchisi **409**), xaridor kontaktini qaytaradi + lead
  lentadan chiqadi. O'ziga claim → 400. 4.1'da claim **BEPUL** (to'lov 4.2). Eski bepul reveal
  (`POST /api/requests/:id/contact`) **olib tashlandi**. `GET /api/leads/mine` — rieltorning olgan
  leadlari (kontakt ochilgan).

### UI

- **`apps/web`:** rieltor doskasi (`/requests`) lead-lentaga aylandi (Sifat + narx + claim); xaridor
  formasi to'liqlik-nudge + `/my/requests`da **claimed nishoni** (score/narx faqat rieltorga
  ko'rinadi — `RequestCard.showLeadMeta`). Score/narx sof serverda; kontakt claim'gача niqoblangan.

### Ma'lumot modeli va env

- Yangi Prisma model YO'Q (`PropertyRequest` additiv). **Yangi env qo'shilmagan.**

### Kelasi

- **4.2:** rieltor hamyoni/balansi + claim narxni yechadi + top-up (test-to'lov). **4.3:** conversion
  tracking + analitika. Keyin Phase 5 (developer CRM) — C6 to'liq fixation.

## 4l. Phase 4.2 — Lead sotib olish + hamyon (2026-08-30)

4.1'dagi eksklyuziv claim'ni **monetizatsiya** qiladi: rieltor endi lead narxini (`priceSom`)
**oldindan to'ldirilgan hamyon balansidan** to'lab oladi. To'lov claim'ning o'zi bilan bitta
tranzaksiyada — shuning uchun lead hech qachon to'lovsiz olinmaydi, balans manfiy bo'lmaydi va
ikki marta sarflanmaydi. Real to'lov (Click/Payme) + refund keyinroq, conversion tracking → 4.3.
Spec: `docs/superpowers/specs/2026-08-30-phase-4.2-lead-purchase-design.md`,
reja: `docs/superpowers/plans/2026-08-30-phase-4.2-lead-purchase.md`.

### Wallet + WalletTransaction (additiv)

- **`Wallet`** (`userId @unique`, `balanceSom BigInt @default(0)` — keshlangan haqiqat) +
  **`WalletTransaction`** (`type` `TOPUP`/`LEAD_CLAIM`, `amountSom` doim musbat, `leadId?`) audit
  daftari. Ikkisi ham har yozuvda bitta tranzaksiyada yangilanadi (3.3b reyting-agregati intizomi).
  Hamyon **lazily** yaratiladi (birinchi `GET /api/wallet`/top-up/claim'da P2002-bardosh upsert) —
  backfill yo'q. Migratsiya **additiv** (2 ta yangi jadval, mavjud jadvallar o'zgarmagan).

### Top-up (test-to'lov stub) + hamyon ko'rinishi

- **`TOPUP_PACKAGES`** presetlari (`p100`/`p300`/`p500` = 100 000 / 300 000 / 500 000), serverda
  bir marta belgilangan. **`POST /api/wallet/topup`** (RealtorGuard) `{ packageId }` — tranzaksiyada
  `balanceSom += amount` + `TOPUP` yozuvi; gateway yo'q, kredit darhol (3.1 obuna "test to'lov"i
  kabi). **`GET /api/wallet`** (RealtorGuard) → `{ balanceSom, transactions[] }` (eng yangisi,
  ≤50). Pul BigInt → **string** (like `priceSom`).

### Pulli claim (4.1 claim tranzaksiyasiga qo'shildi)

- `LeadsService.claim` endi to'lov qadamini o'z ichiga oladi: tranzaksiyadan OLDIN
  `ensureWallet(realtorId)`; tranzaksiya ichida lead qatori **birinchi** `FOR UPDATE`, self(400)/
  non-OPEN(409) tekshiruvlaridan KEYIN va CLAIMED'dan OLDIN `debitForClaim(tx, realtorId,
lead.priceSom, id)` — bu hamyon qatorini `FOR UPDATE` qulflaydi (qulf tartibi **lead→hamyon**,
  deadlock'ni oldini oladi + bir vaqtli claim'larni serializatsiya qilib over-spend'ni to'sadi),
  balansni tekshiradi (`balans < narx` → **402** "Balans yetarli emas…", tranzaksiya rollback →
  lead OPEN qoladi), aks holda balansni kamaytiradi + `LEAD_CLAIM` yozuvini yozadi. Butun claim
  **all-or-nothing**: yo rieltor to'laydi va eksklyuziv kontaktni oladi, yo hech narsa o'zgarmaydi.

### UI

- **Kabinet (`apps/agent`):** hamyon sahifasi (`/wallet`, CabinetGuard) — balans + top-up preset
  tugmalari + tranzaksiya tarixi (TOPUP "+", LEAD_CLAIM "−"); kabinet navigatsiyasidan ("Hisobim").
- **`apps/web` lead doskasi:** rieltor balansi vidjeti + claim **402** qaytarsa "Balans yetarli
  emas" + **"Hisobni to'ldirish"** havolasi (`<a href="/agent/wallet">` — oddiy ilovalararo
  navigatsiya, `apps/web` `apps/agent`'ni import qilmaydi). 4.1 claimed-kontakt paneli o'zgarmagan.

### Ma'lumot modeli va env

- Yangi modellar: `Wallet` + `WalletTransaction` (+ `WalletTxType` enum). **Yangi env qo'shilmagan**
  (test-to'lov stub gateway ishlatmaydi).

### Kelasi

- **4.3:** conversion tracking + analitika. **Keyin:** real to'lov (Click/Payme) + refund; Phase 5
  (developer CRM) — C6 to'liq fixation.

## 4m. Phase 4.3 — Konversiya kuzatuvi + analitika + skoring (2026-09-01)

Lead bozorining fikr-qaytish halqasini yopadi — **shu bilan Phase 4 TO'LIQ TUGADI**. Ilgari lead
hayoti **CLAIMED**da tugardi (rieltor to'ladi, kontaktni oldi, keyin nima bo'lgani kuzatilmasdi).
Endi rieltor olingan lead **natijasini** yozadi (voronka: NEW→CONTACTED→MEETING→WON/LOST, LOST
sababi bilan), bu **analitika**ga aylanadi (rieltorning shaxsiy funneli + moderator platforma
funneli) va **skoring**ka qaytadi (tarixan konversiya qiladigan segmentdagi yangi leadlar yuqoriroq
skor oladi, ishonch-vaznli). Refund/dispute **hali keyinga** (natija ma'lumoti kelajakdagi refund
tizimining poydevori). Spec: `docs/superpowers/specs/2026-09-01-phase-4.3-conversion-tracking-design.md`,
reja: `docs/superpowers/plans/2026-09-01-phase-4.3-conversion-tracking.md`.

### Natija modeli (additiv)

- `PropertyRequest` += `outcomeStage LeadOutcomeStage?` (NEW/CONTACTED/MEETING/WON/LOST),
  `lostReason LeadLostReason?` (NO_RESPONSE/WRONG_NUMBER/NOT_SERIOUS/BOUGHT_ELSEWHERE/OTHER),
  `outcomeUpdatedAt DateTime?` — natija eksklyuziv olingan lead bilan **1:1**, alohida jadval yo'q.
  Claim (4.2 tranzaksiyasi ichida) `outcomeStage`ni **NEW**ga qo'yadi. Additiv migratsiya + indeks
  (`[deal, type, outcomeStage]`). WON/LOST — **resolved** (yakuniy) holatlar.

### Natijani yozish

- **`PATCH /api/leads/:id/outcome`** (RealtorGuard + **egalik**: faqat `claimedById === caller`) —
  `{ stage, lostReason? }`. Qoidalar: lead olingan bo'lishi; `stage=LOST` ⇒ `lostReason` majburiy
  (400), aks holda `lostReason` null'ga tozalanadi; qat'iy holat-mashinasi yo'q (rieltor xatoni
  tuzatishi mumkin). Lead `status` CLAIMED bo'lib qoladi (natija voronkasi OPEN/CLAIMED sikliga
  ortogonal).

### Konversiya-vaznli skoring

- `computeLeadScore` **toza funksiya** bo'lib qoladi (baza). Alohida toza `conversionAdjustment(won,
lost, globalRate)`: Bayesian silliqlangan segment WON-foizi `rHat = (won + α·p0)/(won+lost+α)`
  (α=10), `adjustment = clamp(round(40·(rHat−p0)), ±15)`. Namuna kam ⇒ `rHat→p0` ⇒ **adjustment 0**
  ⇒ toza baza (0 resolved bo'lsa **baza bilan bayt-aynan bir xil** — xavfsizlik invarianti).
  `RequestsService.create` lead **yaratilganda** segmentni (`deal + type + budgetTier`, tuman YO'Q)
  aniqlaydi → 4 ta COUNT (segment/global WON/LOST) → `score = clamp(base + adjustment)`. **Faqat
  yangi leadlar** tuzatiladi; mavjud leadlar qayta skorlanmaydi.

### Analitika

- **Rieltor funneli** — `GET /api/leads/stats` (RealtorGuard): o'z claimed leadlari bo'yicha bosqich
  hisoblari + WON-foizi + LOST sabablari.
- **Platforma funneli** — `GET /api/moderation/conversion` (RolesGuard MODERATOR/ADMIN, read-only):
  umumiy funnel + segment WON-foizlari (skoring ishlatadigan agregatlar).

### UI

- **Kabinet (`apps/agent`):** "Mening leadlarim" (`/agent/leads`, nav) — shaxsiy funnel statistikasi
  - olingan leadlar ro'yxati, har birida natija steppen (NEW→…→WON/LOST + LOST sababi selecti).
- **Web (`apps/web`):** `/moderation/conversion` (moderator) — platforma funneli + segment WON-foizi
  jadvali (read-only), boshqa moderatsiya sahifalaridan havola.

### Ma'lumot modeli va env

- Yangi modellar yo'q (`PropertyRequest` additiv) + 2 enum. **Yangi env qo'shilmagan.**

### Kelasi

- Real to'lov (Click/Payme) + refund/dispute (natija ma'lumoti asosida); Phase 5 (developer CRM) —
  C6 to'liq cross-CRM fixation.

## 4n. Phase 5.1 — Developer CRM: tashkilot + inventar (2026-09-02)

Phase 5 (Product B — Quruvchi/застройщик CRM) ning birinchi qadami: **yangi `apps/crm` SPA** —
quruvchi kompaniya o'z inventarini (ЖК komplekslar, binolar, xonadonlar) boshqaradigan kabinet.
"Developers put real inventory in" — bu keyingi barcha developer funksiyalari (shaxmatka+booking 5.2,
marketplace publishing 5.3, C6 cross-CRM fixation 5.4) uchun poydevor. Rieltordan farqli, quruvchi
**Organization** (kompaniya) sifatida modellashtirildi (bir necha a'zoli); onboarding 5.1'da **bepul**
(to'lov devori yo'q — kirish huquqi = faol membership). Spec:
`docs/superpowers/specs/2026-09-02-phase-5.1-developer-inventory-design.md`,
reja: `docs/superpowers/plans/2026-09-02-phase-5.1-developer-inventory.md`.

### Ma'lumot modeli (additiv)

- **`Organization`** + **`Membership`** (`OrgRole` OWNER/MANAGER; **5.1: 1 user = 1 org** —
  `Membership.userId @unique`) + inventar iyerarxiyasi **`Complex → Building → Unit`** (`onDelete:
Cascade` butun zanjir bo'ylab). `ComplexStatus` (PLANNED/UNDER_CONSTRUCTION/DONE), `UnitStatus`
  (AVAILABLE/BOOKED/SOLD). `Unit.priceSom BigInt?` (string end-to-end). `UserRole` += **`DEVELOPER`**.
  Alohida `Floor` jadvali yo'q (Unit.floor Int — shaxmatka 5.2'da guruhlaydi). Additiv migratsiya
  (`ALTER TYPE ADD VALUE` + 3 CREATE TYPE + 5 CREATE TABLE).

### Kirish + org-scoping

- **`POST /api/crm/become-developer`** (JwtGuard) — bitta `$transaction`da role→DEVELOPER + Organization
  - OWNER Membership (idempotent — takroriy chaqiruv ikkinchi org yaratmaydi). **`DeveloperGuard`**
    (DB-fresh: role DEVELOPER + faol membership, **to'lov yo'q**). Har inventar so'rovi caller'ning
    org'iga scoped — `DeveloperService` `userId`dan `orgId`ni membershipdan aniqlaydi va butun zanjirni
    (unit→building→complex→org) tekshiradi; boshqa org'ning qatoriga → **404** (foreign == missing).

### API (`DeveloperModule`, `/api/crm/*`)

- `GET /api/crm/org` (org + a'zolar); kompleks `GET/POST /complexes`, `GET/PATCH/DELETE /complexes/:id`;
  bino `POST /complexes/:id/buildings`, `PATCH/DELETE /buildings/:id`; xonadon
  `GET/POST /buildings/:id/units`, `PATCH/DELETE /units/:id` — barchasi DeveloperGuard + org-scoped.
  Shared Zod DTOlar (Organization/Complex/Building/Unit + create/update; pul string).

### `apps/crm` SPA (`/crm`da)

- Yangi `@rieltor/crm` workspace (Vite/React/RR7/TanStack, FSD), `apps/agent`'ning auth/session/shell
  qatlamini aynan takrorlaydi (bir xil `rieltor.auth` JWT → **bir marta login, roldan kelib chiqib
  kabinet**). `bootstrap.ts` uni `/crm`da Express-darajasida beradi (`/api/crm/*` bilan to'qnashmaydi).
  **Sahifalar:** become-developer (org yaratish) · tashkilot profili + a'zolar · komplekslar
  ro'yxati+yaratish · kompleks detali (tahrir + binolar) · bino detali (xonadonlar jadvali:
  qo'shish/tahrir/o'chirish, status/narx). Client `DeveloperGuard` (rol asosida).

### Deploy

- `Dockerfile` `@rieltor/crm` ni build qiladi + `apps/crm/dist` ni ko'chiradi (server/Docker runtime).
  **Netlify pariteti** (`/crm` rewrite + `CRM_DIST`) — hujjatlashtirilgan follow-up (agent bilan bir
  xil holat). Yangi env: `CRM_DIST` (validatsiyasiz, `AGENT_DIST` kabi).

### Kelasi

- **5.2:** shaxmatka grid + booking. **5.3:** marketplace publishing (A12 ЖК sahifalari) +
  tasdiqlangan-quruvchi nishoni. **5.4:** C6 cross-CRM fixation + komissiya (C7/C8). **Phase 6:**
  kontraktlar/moliya/KPI. Keyinroq: a'zo taklif qilish, multi-org, monetizatsiya (§4.7).

## 4o. Phase 5.2 — Shaxmatka + booking (2026-09-03)

Phase 5 ning ikkinchi qadami: 5.1 inventarini **shaxmatka**ga aylantiradi — quruvchi bino
xonadonlarini qavat bo'yicha, status-ranglari bilan ko'radigan sotuv-yadro to'ri, va **booking**
(xonadonni mijoz uchun ushlab turish). Booking xonadonni BOOKED qiladi; bekor qilish yoki muddat
o'tishi uni AVAILABLE'ga qaytaradi; "sotildi" SOLD qiladi. Spec:
`docs/superpowers/specs/2026-09-03-phase-5.2-shaxmatka-booking-design.md`,
reja: `docs/superpowers/plans/2026-09-03-phase-5.2-shaxmatka-booking.md`.

### Booking (yangi model, additiv)

- **`Booking`** (unitId Cascade, **erkin-matn mijoz** clientName/clientPhone, `holdUntil`,
  `BookingStatus` ACTIVE/CANCELLED/EXPIRED/CONVERTED, note?/cancelReason?, createdBy) — xonadon bilan
  bog'liq ushlab-turish. Xonadonda **bir vaqtda ko'pi 1 ACTIVE** booking. Mijoz platforma User/lead'iga
  bog'lanmaydi (C6 fixation → 5.4). `Unit` view'iga `activeBooking` xulosasi qo'shildi (grid uni
  o'qiydi).

### Booking oqimi (`/api/crm/*`, DeveloperGuard + org-scoped)

- **`POST /api/crm/units/:id/book`** — xonadon AVAILABLE bo'lsa: bitta tranzaksiyada xonadon qatorini
  `SELECT..FOR UPDATE` qulflaydi, statusni qayta o'qiydi, ACTIVE booking yaratadi + unit → BOOKED;
  band bo'lsa **409** (ikki bir vaqtli booking → bittasi yutadi, ikkinchisi 409). **`PATCH
/api/crm/bookings/:id`** — `cancel` (→ AVAILABLE) / `convert` (→ SOLD) / `extend` (holdUntil),
  faqat ACTIVE'da (aks holda 409), transactional. **`GET /api/crm/bookings`** — org bandlari ro'yxati.
  Foreign unit/booking → **404** (unit→building→complex→org zanjiri).
- **Avto-muddat:** soatlik cron (`@Cron('0 * * * *')`) — overdue ACTIVE bookinglar → EXPIRED, hali
  BOOKED bo'lgan xonadonni AVAILABLE qiladi (hand-SOLD tegilmaydi, idempotent).

### Bulk edit

- **`PATCH /api/crm/units/bulk`** — bir necha xonadon status/narxini birga o'zgartirish. Egalik
  **all-or-nothing** (foreign id → 404, hech narsa yozilmaydi); narx hammaga, **status faqat
  active-booking'siz xonadonlarga** (booked skip → `skippedBooked` qaytadi, hech qanday ushlab-turish
  strand bo'lmaydi).

### UI (`apps/crm`)

- **Shaxmatka** (building-detail): qavat-satrlar (yuqori qavat tepada) × xonadon-kataklari, status
  ranglari (Bo'sh yashil / Band sariq / Sotilgan qizil); band katak mijoz ismini ko'rsatadi; katakka
  bosib book/cancel/convert + tahrir. **Ko'p-belgilash** ("Tanlash") → bulk status/narx paneli.
  **Bandlar** sahifasi (`/bookings`, nav) — org bandlari + active'da bekor/sotildi.

### Ma'lumot modeli va env

- Yangi model: `Booking` (+ `BookingStatus` enum). **Yangi env yo'q**; cron `@nestjs/schedule`
  (ScheduleModule allaqachon global).

### Kelasi

- **5.3:** marketplace publishing (ЖК sahifalari A12) + tasdiqlangan-quruvchi. **5.4:** C6 cross-CRM
  fixation + komissiya (C7/C8). **Phase 6:** kontraktlar/moliya. Keyinroq: line/podъezd o'lchovi,
  per-org default hold, booking-mijozni User/lead'ga bog'lash.

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
