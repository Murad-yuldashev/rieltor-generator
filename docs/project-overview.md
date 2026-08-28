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
