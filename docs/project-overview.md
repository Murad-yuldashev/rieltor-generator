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

## 4p. Phase 5.3 — Marketplace publishing (2026-09-03)

Phase 5 ning uchinchi qadami (**A12**): tasdiqlangan quruvchi o'z inventarini (Complex) `/crm`dan
**ommaviy marketplace**ga chiqaradi — kompleks ЖК sahifasi bo'lib ko'rinadi, xonadonlar jonli
band-holati bilan, va qiziqqan foydalanuvchi so'rovi lead'ga aylanadi. Bu **yopiq halqa**ni yopadi:
quruvchi inventar joylaydi → ommaviy ЖК → foydalanuvchi so'rovi → skoring qilingan `PropertyRequest`
(NEW_BUILD) → rieltor claim/sotib olish (§4k–4m). Spec:
`docs/superpowers/specs/2026-09-03-phase-5.3-marketplace-publishing-design.md`,
reja: `docs/superpowers/plans/2026-09-03-phase-5.3-marketplace-publishing.md`.

### Ma'lumot modeli (additiv migratsiya `phase_5_3_marketplace_publishing`)

- **`Organization`** += `verified`, `verificationRequestedAt`, `verifiedAt`, `verificationNote`
  (moderator-boshqariladigan, org-darajali tasdiqlash).
- **`Complex`** += `slug @unique`, `publishStatus` (yangi enum **`ComplexPublishStatus`** DRAFT/PUBLISHED),
  `publishedAt`, `latitude`, `longitude`.
- Yangi **`ComplexImage`** modeli (cover + gallereya, `onDelete: Cascade`).
- **`PropertyRequest`** += `complexId`, `unitId` (nullable, `onDelete: SetNull`) — inquiry lead'ni
  komplekska bog'laydi. Barchasi `CREATE`/`ADD` — mavjud ustunga tegilmagan.

### Publish oqimi (developer self-service, verified-gated)

- **`PATCH /api/crm/complexes/:id/publish`** `{publish}` (DeveloperGuard + org-scoped) — chiqarish
  **`org.verified`** VA to'liqlikka bog'liq: ≥1 cover rasm, ≥1 narxlangan AVAILABLE xonadon, tuman
  (district) bo'lishi shart; aks holda **409** o'zbekcha xabar bilan rad etadi. Birinchi publish'da
  **slug avtomatik** generatsiya qilinadi (Cyrillic→Latin transliteratsiya).

### Tasdiqlangan quruvchi (moderator-boshqariladigan, org-darajali)

- So'rov: **`POST /api/crm/organization/verification-request`**. Moderator navbati:
  **`GET /api/moderation/developers`** + **`PATCH /api/moderation/developers/:orgId`** (RolesGuard
  MOD/ADMIN). `apps/web`da **"Quruvchilar"** moderatsiya sahifasi.

### Ommaviy ЖК sahifasi (`@Controller('jk')`, guard'siz)

- **`GET /api/jk`** (browse), **`GET /api/jk/:slug`** (detal — **PII'siz** per-unit band-holati to'ri
  AVAILABLE/BOOKED/SOLD, hech qanday booking mijoz ma'lumoti yo'q), **`POST /api/jk/:slug/inquiry`**
  (JwtGuard) → komplekska bog'langan skoring qilingan `PropertyRequest` (type **NEW_BUILD**) yaratadi
  va rieltor claim/sotib olish quvuriga ulaydi (yopiq halqa). `/jk` + `/jk/:slug` uchun **SSR OG meta**
  (`NotFoundShellFilter` orqali).

### UI (`apps/crm` + `apps/web`)

- **`apps/crm`:** publish toggle + badge + lat/lng + cover/gallereya yuklash (`processImage` webp
  quvurini qayta ishlatadi) + verification-request UI. `ComplexImage` o'chirish `(complexId, position)`
  bo'yicha kalitlaydi (`Image` DTO cuid id'ni ochmaydi).
- **`apps/web`:** `/jk` browse (`ComplexCard`, tuman faseti) + `/jk/:slug` detal (gallereya,
  **"Tasdiqlangan quruvchi"** nishoni, band-holati to'ri, bog'liqliksiz OSM xarita havolasi,
  login'ga bog'langan inquiry CTA).

### Non-goals (keyinroq)

- Boy A12 (hujjatlar / qurilish jadvali / bo'lib to'lash), xonadonlar umumiy `/api/objects`
  qidiruvida, viloyat taksonomiyasi, alohida quruvchi-profil sahifasi.

### Kelasi

- **5.4:** C6 cross-CRM fixation (booking-mijozni platforma User/lead'ga bog'lash) + komissiya
  (C7/C8). **Phase 6:** kontraktlar/moliya/KPI. Keyinroq: yuqoridagi non-goal'lar.

## 4q. Phase 5.4 — Cross-CRM fixation + komissiya (2026-09-04)

Phase 5 ning to'rtinchi (yakuniy) qadami — **yopiq halqaning to'lov qismi**: rieltor claim qilgan
NEW_BUILD lead'ini quruvchi xonadoniga **fiksatsiya** qiladi (C6), va o'sha xonadon booking
convert → SOLD bo'lganida rieltorga **komissiya darhol** to'lanadi (C7/C8). Bu 5.1–5.3 ni
(inventar → shaxmatka/booking → marketplace + skoring qilingan NEW_BUILD lead) rieltor daromadiga
ulaydi. Spec: `docs/superpowers/specs/2026-09-04-phase-5.4-fixation-commission-design.md`,
reja: `docs/superpowers/plans/2026-09-04-phase-5.4-fixation-commission.md`.

### Ma'lumot modeli (additiv migratsiya `phase_5_4_fixation_commission`)

- Yangi **`Fixation`** modeli — `{realtorId, unitId, propertyRequestId @unique, buyerPhone,
status FixationStatus (ACTIVE/CONVERTED/CANCELLED), commissionBps, commissionSom BigInt?,
createdAt/convertedAt?/cancelledAt?}`. `@unique propertyRequestId` = bir lead'ga ko'pi 1 fixation.
- **`Complex.commissionBps`** + **`Unit.commissionBps`** (bazis punktlarda, nullable) — komissiya
  stavkasi. **`Booking.fixationId`** + **`WalletTransaction.fixationId`** (sotuvni fixation'ga
  bog'laydi). **`WalletTxType`** += **`COMMISSION`**. Barchasi additiv (CREATE/ADD; mavjud ustunga
  tegilmagan).

### Fiksatsiya (C6) — `@Controller('leads')`, JwtGuard + RealtorGuard

- **`POST /api/leads/:id/fixate`** — claim qilgan rieltor o'z NEW_BUILD lead'ini nishon xonadonga
  fiksatsiya qiladi. Bitta tranzaksiyada xonadon qatorini **`SELECT..FOR UPDATE`** qulflaydi (4.1
  idiomasi), so'ng noyoblikni tekshiradi: **bir (xonadon, kanonik telefon) uchun ko'pi 1 ACTIVE
  fixation** — raqobatchi ACTIVE bo'lsa **409**. Telefon `998XXXXXXXXX`ga kanonizatsiya qilinadi
  (shared **`canonicalizePhone`**, ikkala tomonda bir xil). CANCELLED qatorni qayta jonlantiradi
  (unique propertyRequestId ikkinchi create'ni taqiqlaydi). **`DELETE /api/leads/:id/fixate`** —
  faqat egasi o'z ACTIVE fixation'ini bekor qiladi.

### Komissiya stavkasi (C7)

- Stavka **per-Complex default + per-Unit override** (bazis punkt; unit override → complex default
  → 0). Fiksatsiya paytida stavka **Fixation qatoriga snapshot** qilinadi — kelishilgan foizni
  qulflaydi, quruvchi keyin stavkani o'zgartirsa ham rieltor komissiyasi kesilmaydi.

### Darhol to'lov (C8) — atomic convert

- `booking` convert → SOLD **atomik** qilindi: `updateMany` ACTIVE→CONVERTED, va **faqat
  count===1 bo'lganda** unit SOLD bo'ladi va to'lov bajariladi (bir vaqtli/qayta-otilgan convert →
  ikki marta kredit yo'q). Booking'ning kanonik telefoni ACTIVE Fixation bilan moslashtiriladi;
  komissiya = **`priceSom(SOLD) × fixation.commissionBps / 10000`** (BigInt, truncate) rieltor
  hamyoniga **darhol** kreditlanadi (`WalletTxType.COMMISSION`), Fixation → CONVERTED,
  `Booking.fixationId` o'rnatiladi. Narx `priceSom` (jonli SOLD narxi) tranzaksiya ichida o'qiladi;
  **stavka esa snapshot**. Null narx yoki 0 stavka → to'lovsiz, lekin sotuv baribir convert bo'ladi.
  Idempotent (`credit` hamyonni tranzaksiya ichida upsert qiladi). Platforma **hisobni o'z zimmasiga
  oladi** (float); quruvchi-tomon billing/escrow → Phase 6.

### Rieltor kabineti (`apps/agent`) + quruvchi CRM (`apps/crm`)

- **`apps/agent`:** claim qilingan NEW_BUILD lead nishon xonadonini + **taxminiy komissiya**ni
  ko'rsatadi va **Fiksatsiya qilish / Bekor qilish / Komissiya olindi** holatini beradi (lead DTO
  target unit + estimated commission + fixation holatini olib yuradi).
- **`apps/crm`:** kompleks/xonadon detalida **komissiya-% konfiguratsiyasi** (per-complex default +
  per-unit override) va shaxmatkada **faqat-o'qish "fixation" indikatori**.

### Non-goals (keyinroq)

- To'liq C7 browsable/komissiya-filtrlangan showcase; quruvchi hamyoni/escrow/billing/reconciliation
  (Phase 6); komissiya clawback (convert'dan keyin bekor / dispute / refund); fixation muddati croni;
  qattiq Booking→User identity bog'lanishi; ikki tomonlama fixation tasdiqi; komissiyani "tozalab
  inherit/null qilish" affordance'i.

### Kelasi

- **Phase 5 yakunlandi** (5.1 inventar → 5.2 shaxmatka/booking → 5.3 marketplace → 5.4 fixation +
  komissiya). **Keyingi: Phase 6 — kontraktlar/moliya:** quruvchi hamyoni + escrow, kontraktlar,
  komissiya clawback/reconciliation, KPI. Keyinroq: yuqoridagi non-goal'lar.

## 4r. Phase 6.1 — Quruvchi hamyoni + moliyalashtirilgan komissiya (2026-09-04)

Phase 6 (kontraktlar/moliya) ning birinchi qadami va uning **moliyaviy poydevori**: 5.4 da rieltor
komissiyasini **platforma o'z zimmasiga olib** (float) to'lardi — endi o'sha to'lovni **quruvchi
tashkilotining hamyoni moliyalashtiradi**. Bu Phase 6 ni oldinga (6.2 kontraktlar → 6.3
clawback/reconciliation → 6.4 to'lov jadvallari/qarzdorlar/moliya-KPI) surishning kirish nuqtasi.

### Ma'lumot modeli (additiv migratsiya `phase_6_1_org_wallet`)

- Yangi **`OrgWallet`** — `{orgId @unique, balanceSom BigInt (DEFAULT 0), transactions}`.
  `balanceSom` **manfiy bo'lishi MUMKIN** = qarz; klamplanmaydi. `Organization`ga cascade FK.
- Yangi **`OrgWalletTransaction`** — `{type OrgWalletTxType, amountSom BigInt (doim musbat),
fixationId?}` — yo'nalishni tur ko'taradi. Yangi **`enum OrgWalletTxType { TOPUP
COMMISSION_DEBIT }`**. Barchasi additiv (CREATE); rieltor **`Wallet`/`WalletTransaction`ga
  umuman tegilmagan**. DTO: `balanceSom` string `^-?\d+$` (minus ruxsat), `amountSom` string
  `^\d+$` (manfiymas).

### `OrgWalletService` (rieltor `WalletService` idiomalarining ko'zgusi)

- **`ensureOrgWallet`** — birinchi teginishda lazy upsert (noyob `orgId` ostida idempotent, P2002
  yutiladi). **`view`** — balans + oxirgi 50 qatorli leger (CRM kabineti uchun; balans **klamplanmaydi**).
  **`topup`** — test-to'lov stubi, `TOPUP_PACKAGES` ni qayta ishlatadi (atomik `increment`, lock kerak emas).
- **`debitForCommission(tx, orgId, amountSom, {fixationId?})`** — chaqiruvchining tranzaksiyasida
  ishlaydi, o'zi tranzaksiya ochmaydi. **SHARTSIZ**: rieltor `debitForClaim` dan farqli — `FOR
UPDATE` lock YO'Q, balans qorovuli YO'Q, hech qachon **402** tashlamaydi. Hamyonni in-tx upsert
  bilan o'zi ta'minlaydi (yangi org tug'ilishidayoq `-amountSom` qarzda), mavjudi dekrement qilinadi,
  balans manfiy ketishi mumkin. `amountSom` **musbat** saqlanadi; `COMMISSION_DEBIT` turi yo'nalishni beradi.

### Moliyalashtirilgan komissiya — convert paytida

- Mavjud `booking.act()` convert `$transaction`ida, **`count===1` atomik darvozasi ichida**,
  `commissionSom > 0n` bo'lganda: fiksatsiyalangan rieltor kreditlangandan **darhol keyin** egalik
  qiluvchi org hamyoni **aynan o'sha `commissionSom`ga** debitlanadi (`orgId` =
  `booking.unit.building.complex.orgId`). SOLD flip + rieltor kredit bilan **atomik** va **idempotent**
  (qayta otilgan convert hech nima debitlamaydi). Agar org balansi yetmasa → **sotuv baribir bajariladi
  va rieltor baribir to'lanadi**, org hamyoni **manfiy** ketadi (yozib qo'yilgan qarz). Modul sikli
  bir tomonlama yechildi: `OrgWalletController` `DeveloperModule`ga ko'chirildi, `OrgWalletModule` faqat
  servisni export qiladi (forwardRef yo'q).

### API + quruvchi CRM (`apps/crm`)

- **`GET /api/crm/wallet`** + **`POST /api/crm/wallet/topup`** (`JwtGuard` + `DeveloperGuard`, org-scoped,
  stub). Yo'l `crm/wallet` — `/api/wallet` (rieltor hamyoni) bilan to'qnashmaydi.
- **Quruvchi hamyoni sahifasi**: balans + balans manfiy bo'lganda qizil **"Qarz"** indikatori + stub
  to'ldirish paketlari + leger. **"Hisob"** navigatsiya bandi.

### Non-goals (Phase 6 ichida keyinroq)

- Escrow/held-balance/pre-funding; **`Contract`** (6.2); komissiya clawback/reconciliation (6.3); to'lov
  jadvallari/qarzdorlar/hisob-fakturalar/moliya-KPI (6.4); haqiqiy to'lov-provayder integratsiyalari +
  JSHSHIR (keyinroq).

### Kelasi

- **6.1 yakunlandi** (org hamyoni + moliyalashtirilgan komissiya). Phase 6 dekompozitsiyasi: **6.1** org
  hamyoni → **6.2** kontraktlar → **6.3** komissiya clawback/reconciliation → **6.4** to'lov
  jadvallari/qarzdorlar/moliya-KPI. **Keyingi: 6.2 — Contracts.**

## 4s. Phase 6.2 — Kontraktlar (Contracts) (2026-09-04)

Phase 6 ning ikkinchi qadami: yopilgan sotuvning **davomiy, avto-raqamlangan yozuvi** — `Contract`. 6.2
gacha yopilgan bitimning yagona izi `CONVERTED` Booking + `SOLD` Unit + (lead yo'lida) `CONVERTED`
Fixation edi; kontrakt entiteti yo'q edi. 6.2 kontraktni **bitim yopilgan payt** (Booking
`convert`→SOLD) — o'sha bir atomik `count===1` darvozasi ichida — yaratadi, shunda har bir keyingi
sub-faza (6.3 clawback, 6.4 to'lov jadvallari) osiladigan barqaror yozuvga ega bo'ladi.

### Ma'lumot modeli (additiv migratsiya `phase_6_2_contracts`)

- Yangi **`Contract`** — `{id, number, orgId, unitId, bookingId @unique, fixationId?, buyerId?,
buyerName, buyerPhone, agreedAmount BigInt?, currency, status, signedAt?, createdAt}`;
  `@@unique([orgId, number])` + `@@index([orgId, createdAt])`. Convert paytida, `count===1` darvozasi
  ichida yaratiladi — **har konvertlangan booking uchun bitta** (`bookingId @unique` = idempotentlik
  zaxira qorovuli).
- Yangi **`OrgContractCounter`** — `{orgId, year, lastSeq}`, kompozit PK `@@id([orgId, year])`;
  `number` ni backing qiluvchi org-bo'yicha-yil-bo'yicha monoton hisoblagich. FK/back-relation yo'q —
  yalang'och hisoblagich.
- Yangi enumlar: **`enum Currency { SOM }`** (bugun faqat SOM; FX yo'q, `ALTER TYPE ADD VALUE` bilan
  kengaytiriladi) va **`enum ContractStatus { ACTIVE | CANCELLED }`** (`CANCELLED` 6.3 clawback/unwind
  uchun zaxirada, 6.2 da yozilmaydi). Barchasi additiv (CREATE TYPE/TABLE) — mavjud jadvalga **hech
  qanday ALTER yo'q**, har FK yangi `Contract` qatorida yashaydi. Virtual back-relation'lar:
  `Organization.contracts`, `Unit.contracts`, `Booking.contract?` (1:1), `Fixation.contracts`,
  `User.buyerContracts`. DTO: `agreedAmount` string `^\d+$` nullable, pul string uchidan-uchgacha.

### Avto-raqamlash — org-bo'yicha, yil-bo'yicha (`2026-0001`)

- `cuid()` id'lar orasida sequence primitivi yo'q; `OrgContractCounter` convert tx ichida atomik
  inkrement qilinadi, `number = ${year}-${padStart(lastSeq, 4)}`.
- Inkrement **xom `INSERT … ON CONFLICT ("orgId","year") DO UPDATE SET "lastSeq" = … + 1 RETURNING
"lastSeq"`** (`$queryRaw`) — poyga-xavfsiz, birinchi insertni ham atomik qamrab oladi (`book()` ning
  `$queryRaw` idiomasi ko'zgusi). Prisma kompozit-kalit `upsert`i native ON CONFLICT'ga kompilyatsiya
  BO'LMAYDI — u find-then-insert emulyatsiya qiladi, shu bois (org, year) ning birinchi bir vaqtli ikki
  convertida P2002 tashlab **butun convertni rollback** qilardi. `@@unique([orgId, number])` — qoldiq
  to'qnashuv uchun baland qorovul.

### Xaridor identifikatsiyasi + narx snapshot'i

- **`buyerId User?`** — qattiq buyer `User` FAQAT fixation yo'lida mavjud (`Fixation → PropertyRequest
→ author`); walk-in booking'da faqat erkin-matnli `clientName/clientPhone` bor. Shu bois `buyerId`
  faqat lead muallifi orqali to'ldiriladi (shadow-User upsert yo'q).
- **`buyerName`/`buyerPhone` doim snapshot** qilinadi (lead muallifidan, bo'lmasa booking
  erkin-matnidan) — keyingi profil tahriri yoki o'chirilgan lead'dan omon qoladi.
- **`agreedAmount`** = convert paytidagi `unit.priceSom` snapshot'i, **null-bardoshli** (narxsiz unit
  ham konvertlanadi → `agreedAmount = null`, hech qachon convertni bloklamaydi) — FK emas, snapshot;
  narx BOOKED unit'da convert'gacha tahrirlanadi.
- **`currency`** SOM default (FX kechiktirilgan); **`signedAt`** stub — quruvchi harakati bilan bosiladi
  (haqiqiy JSHSHIR kechiktirilgan); `status` ACTIVE default.

### `ContractService` + convert wiring

- `create(tx, input)` chaqiruvchining tranzaksiyasida ishlaydi, o'zi tx ochmaydi
  (`OrgWalletService.debitForCommission` idiomasi); `DeveloperModule`da provider (alohida modul/
  forwardRef yo'q). Convert `$transaction`ida, **`count===1` darvozasi ichida**, komissiya blokidan
  keyin **har convertda** (fixation ham, walk-in ham) chaqiriladi. Buyer = fixation lead muallifi yoki
  null; ism/telefon booking'ga fall-back qiladi; SOLD flip + rieltor kredit + org debit bilan atomik.
- Read/sign metodlari o'z tx'i, org-scoped (`orgIdOf(caller)`, begona/yo'q id → 404): `list` →
  `ContractRow[]` (unit + building konteksti bilan), `getOne`, `sign` (`signedAt` null bo'lsa bosadi,
  ikkinchi imzo idempotent; `CANCELLED` kontrakt → Conflict; status ACTIVE qoladi).

### API + quruvchi CRM (`apps/crm`)

- **`GET /api/crm/contracts`** + **`GET /api/crm/contracts/:id`** + **`POST /api/crm/contracts/:id/sign`**
  (`JwtGuard` + `DeveloperGuard`, org-scoped).
- **Shartnomalar** ro'yxat sahifasi (raqam / xaridor ism+telefon / unit `buildingName`+`unitNumber` /
  summa yoki "—" / status nishoni / sana) + kontrakt detali (`Imzolash` tugmasi `signedAt` null va status
  ACTIVE bo'lganda, imzolangach sanani ko'rsatadi). **"Shartnomalar"** navigatsiya bandi.

### Non-goals (Phase 6 ichida keyinroq)

- `PaymentSchedule`/`Payment`/`Invoice` + qarzdorlar reestri + moliya-KPI (**6.4**); komissiya
  clawback/reconciliation (**6.3**); **haqiqiy** JSHSHIR/onlayn imzo; multi-valyuta **FX
  konvertatsiyasi**; kontrakt **shablon/variatsiya** dvigateli; 6.2 gacha konvertlangan booking'lar
  uchun **backfill**; rieltor-tomon (apps/agent) kontrakt ko'rinishi.

### Kelasi

- **6.2 yakunlandi** (Contract + avto-raqamlash + convert'da yaratish + CRM Shartnomalar ro'yxat/detal +
  imzo stubi). Phase 6 dekompozitsiyasi: **6.1** org hamyoni → **6.2** kontraktlar → **6.3** komissiya
  clawback/reconciliation → **6.4** to'lov jadvallari/qarzdorlar/moliya-KPI. **Keyingi: 6.3 —
  clawback/reconciliation.**

## 4t. Phase 6.3 — Komissiya clawback / sotuvni bekor qilish (unwind) (2026-09-05)

Phase 6 ning uchinchi qadami: yopilgan sotuvga **bekor qilish (unwind) yo'li** beradi. 6.3 gacha
`Booking.convert`→SOLD **terminal** edi — unit SOLD ga o'tar, fixation convert bo'lib rieltorga
komissiya to'lanar va quruvchi org hamyoni debitlanar, `Contract` yaratilar edi, lekin bitim keyin
buzilsa **hech narsani orqaga qaytarib bo'lmasdi**. 6.3 convert'ning aynan **teskarisi**ni kiritadi:
quruvchi Contract'ni bekor qiladi (`POST /api/crm/contracts/:id/cancel {reason}`) — bu atomik
ravishda rieltor komissiyasini **qaytarib oladi (clawback)**, org hamyonini **qaytaradi (refund)** va
inventarni (unit / booking / fixation) qayta-sotiladigan holatga tiklaydi. Reversal platforma uchun
**net-zero**: rieltorning `COMMISSION` krediti teng `COMMISSION_CLAWBACK` debiti bilan, org'ning
`COMMISSION_DEBIT`i teng `COMMISSION_REFUND` krediti bilan — **convert paytida to'langan snapshot
summada** — bekor qilinadi.

### Ma'lumot modeli (additiv migratsiya `phase_6_3_clawback`)

- Ikki enum qiymati + ikki nullable ustun, yangi jadval yo'q. **`WalletTxType += COMMISSION_CLAWBACK`**
  (rieltor komissiyasi teskari — debit) va **`OrgWalletTxType += COMMISSION_REFUND`** (org
  komissiya-debiti teskari — kredit). **`Contract += cancelReason String?`** + **`cancelledAt
DateTime?`** (status=`CANCELLED` bilan yoziladi). Ikki `ALTER TYPE … ADD VALUE` (repoda additiv
  isbotlangan) + ikki nullable `ADD COLUMN`; `DROP` yo'q, mavjud qatorlar qayta yozilmaydi.
  `Booking.cancelReason` (5.2) va `Fixation.cancelledAt` (5.4) allaqachon mavjud — qayta ishlatiladi.
  `ContractStatus.CANCELLED` (6.2 da zaxirada edi) endi yoziladi. DTO: `ContractSchema` ikki nullable
  maydon oladi (`toContract` ikkalasini ham map qiladi — ACTIVE kontraktda `null`), `ContractCancelSchema
= {reason: min(1).max(500)}`.

### Bekor qilish (unwind) — `ContractService.cancel(orgId, id, reason)`

- `ContractService` ikki dep in'ektsiya qiladi — `WalletService` + `OrgWalletService` (ikkalasi ham
  `DeveloperModule`da allaqachon provayder; `BookingService` ham xuddi shunday oladi — **modul
  o'zgarishi yo'q, forwardRef yo'q**). `cancel` o'z `$transaction`ini ochadi (convert branch'ining
  teskarisi).
- **`Contract` `ACTIVE→CANCELLED` `updateMany` `count===1` darvozasi** — yagona serializatsiya nuqtasi
  (convert'ning booking darvozasining ko'zgusi). Qayta otilgan/bir vaqtli cancel `count===0` oladi →
  **409**, shu bois clawback / refund / state reversal **ko'pi bilan bir marta** ishlaydi (idempotent).
  Org-scoping: begona/yo'q id → **404**; faqat `ACTIVE` kontrakt bekor qilinadi (allaqachon `CANCELLED`
  → 409).

### Pul reversali (net-zero, snapshot summada)

- Faqat fixation yo'lida: fixation `CANCELLED` ga o'tadi va `commissionSom > 0n` bo'lganda **rieltor
  `WalletService.debitForClawback` bilan `−commissionSom`** debitlanadi, so'ng **org
  `OrgWalletService.creditRefund` bilan `+commissionSom`** kreditlanadi — **convert paytida aynan
  to'langan snapshot summa** (`Fixation.commissionSom`; **jonli unit narxi qayta o'qilmaydi** — u
  o'zgargan bo'lishi mumkin). Rieltor `−commissionSom` + org `+commissionSom` = platforma neytralga
  qaytadi.
- **`debitForClawback`** (`credit` teskarisi) — **shartsiz**, manfiy-bardoshli, `upsert`-xavfsiz:
  `FOR UPDATE` lock yo'q, 402 yo'q; komissiyani allaqachon sarflab bo'lgan rieltor **qarzga** (manfiy
  balans) ketishi mumkin — bu 6.1 "org hamyoni manfiy ketishi mumkin" falsafasining aynan ko'zgusi.
  **`creditRefund`** (`debitForCommission` teskarisi) — shartsiz `increment`. `amountSom` ikkala legerda
  ham **musbat** saqlanadi; yo'nalishni tur ko'taradi.

### To'liq inventar reversali

- **`Unit → AVAILABLE`** (qayta-sotiladi), **`Booking → CANCELLED`** (+`cancelReason`),
  **`Fixation → CANCELLED`** (+`cancelledAt`) — bekor qilingan fixation 5.4 yo'li bilan qayta-fixatsiya
  qilinadi. **Walk-in kontrakt** (fixation yo'q) → qaytariladigan pul yo'q; faqat
  `Contract/Booking → CANCELLED` + `Unit → AVAILABLE` (state-only reversal, hamyon qatorlari yozilmaydi).
  `FixationStatus.CANCELLED` qayta ishlatiladi (yangi `REVERSED` qiymat emas), shu bois 5.4
  qayta-fixatsiya yo'li o'zgarmaydi; reversal audit izi — `COMMISSION_CLAWBACK` leger qatori +
  `contract.cancelReason`.

### API + leger ko'rinishi

- **`POST /api/crm/contracts/:id/cancel`** (`JwtGuard` + `DeveloperGuard`, org-scoped; body `{reason}`,
  `min(1).max(500)`).
- **CRM org hamyoni legeri** (`apps/crm` `pages/wallet`): `COMMISSION_REFUND` **yashil kredit**
  ("Komissiya qaytarildi") sifatida — `isCredit` yangi turni qamraydi va CRM yorlig'i `tx.type` bo'yicha
  (uch tomonlama) kalitlanadi, shunda top-up yorlig'i "To'ldirish" refund'ga sizib chiqmaydi.
- **Rieltor hamyoni legeri** (`apps/agent`): `COMMISSION_CLAWBACK` **debit** ("Komissiya qaytarib
  olindi") sifatida, ilovaning mavjud to'q-siyoh debit stili bilan (qizil emas); `LEAD_CLAIM` "(lead)"
  summa suffiksi `tx.type === 'LEAD_CLAIM'` bilan gate qilinadi, clawback'ga sizib chiqmaydi. Rieltorning
  fixation ko'rinishi `Fixation → CANCELLED` ni aks ettiradi.
- **Kontrakt detali** (`apps/crm`): status `ACTIVE` bo'lsa **"Bekor qilish"** boshqaruvi (majburiy
  `reason` inline maydoni) → `useCancelContract` mutatsiya `['crm-contracts']` + detal kalitini
  invalidatsiya qiladi; `CANCELLED` bo'lsa kul-rang (ink-3) status nishoni + `cancelReason`/`cancelledAt`
  ko'rsatiladi, imzo va bekor boshqaruvlari yashiriladi.

### Non-goals (Phase 6 ichida keyinroq)

- Agregat **reconciliation dashboard** (org/platforma net komissiya, teskari-bitim reestri) → **6.4**
  (moliya-KPI); ikki tomonlama / rieltor tasdiqi (6.3 faqat quruvchi tashabbusli); **qisman clawback**,
  clawback dispute/appeal, refund oynalari/jarimalari; bo'shatilgan unitni marketplace'da **avto
  qayta-listing**; teskari `Fixation.commissionSom` reset (5.4 qayta-fixatsiya masalasi).

### Kelasi

- **6.3 yakunlandi** (cancel-Contract unwind + clawback/refund primitivlar + to'liq inventar reversali +
  CRM/agent leger ko'rinishi). Phase 6 dekompozitsiyasi: **6.1** org hamyoni → **6.2** kontraktlar →
  **6.3** komissiya clawback/unwind → **6.4** to'lov jadvallari/qarzdorlar/moliya-KPI + reconciliation
  dashboard. **Keyingi: 6.4 — to'lov jadvallari/qarzdorlar/moliya-KPI.**

## 4u. Phase 6.4a — To'lov jadvali + to'lov qayd etish (2026-09-08)

Phase 6 ning to'rtinchi qadami (6.4), ikkiga bo'lingan holda — **6.4a** kontraktga **ulushli to'lov
jadvali** va unga qarshi **to'lovni qayd etish** beradi. 6.4a gacha sotuv (`Contract`, 6.2) faqat
kelishilgan narxni yozar, xaridor uni vaqt bo'yicha qanday to'laganini kuzatib bo'lmasdi. 6.4a
`Contract`ga ixtiyoriy **`PaymentSchedule`** (boshlang'ich to'lov + N ta teng oylik ulush) qo'shadi —
quruvchi uni **`ACTIVE`** kontraktga o'zi biriktiradi — va bir ulushni **to'landi** deb belgilaganda
**`Payment`** yozadigan stub yig'im mexanizmini kiritadi. Bu 6.4b qarzdorlar reestri + moliya-KPI
dashboard quriladigan yig'im poydevori. To'lovlar 6.4a da **qo'lda** qayd etiladi — hamyon
to'ldirishlari bilan bir xil test-stub yondashuvi; haqiqiy provayderlar (Click/Payme/Uzum) keyinroq.

### Ma'lumot modeli (additiv migratsiya `phase_6_4a_payment_schedule`)

- To'liq **additiv**: uch enum, uch yangi jadval, ikki virtual back-relation — mavjud jadval ustuni
  o'zgarmaydi (`ALTER`/`DROP` yo'q, ma'lumot yozilmaydi). Enumlar: **`PaymentFrequency { MONTHLY }`**,
  **`InstallmentStatus { PENDING | PAID }`** (`OVERDUE` 6.4b da qo'shiladi), **`PaymentMethod { STUB }`**
  (haqiqiy provayderlar keyinroq). Jadvallar: **`PaymentSchedule`** (`contractId @unique` — kontraktga
  **1:1**; `downPaymentSom`, `installmentCount`, `installmentSom`, `startDate`, `frequency`,
  `currency`), **`PaymentInstallment`** (`{scheduleId, seq, dueDate, amountSom, status, paidAt}`,
  `@@unique([scheduleId, seq])`), **`Payment`** (`installmentId @unique`, `amountSom`, `method`, `note?`,
  `createdById`). Back-relationlar: `Contract.paymentSchedule PaymentSchedule?` +
  `User.recordedPayments Payment[]`. DTO'lar `packages/shared`da (`PaymentScheduleViewSchema` +
  `PaymentInstallmentSchema` + `PaymentScheduleCreateSchema` + `PaymentRecordSchema`); barcha summa
  **satr** (`z.string().regex(/^\d+$/)`), `GET .../schedule` → view **yoki `null`**.

### Ulush generatsiyasi (pul matematikasi) — `Σ ulushlar == agreedAmount`

- Berilgan `agreedAmount = A` (null bo'lmasligi shart), `downPaymentSom = D`
  (**`0 ≤ D < A`** — to'liq boshlang'ich to'lov jadval uchun hech narsa qoldirmaydi, shu bois `D == A`
  **rad etiladi**; jadval faqat `D < A` bo'lganda yaratiladi), `installmentCount = N` (`1 ≤ N ≤ 600`),
  `startDate = S`. `remaining = A − D` (doim `> 0`); `base = remaining / N` (**BigInt** butun bo'lish) —
  `installmentSom` sifatida saqlanadi.
- Oylik ulushlar seq `1..N`: `amountSom = base`, **oxirgisidan** (`seq N`) tashqari, u
  `= remaining − base·(N−1)` — ya'ni **bo'lish qoldig'ini o'ziga singdiradi**. `D > 0` bo'lsa `seq 0`
  ulushi (`amountSom = D`, `dueDate = S`). Har ulush muddati `S` ga `seq` to'liq oy qo'shib olinadi.
  **Invariant:** `D + base·(N−1) + (remaining − base·(N−1)) = A` — ulushlar **aynan `A` ga** yig'iladi;
  yaxlitlash pul yaratmaydi/yo'qotmaydi. Barcha arifmetika `BigInt`, pul uchdan-uchgacha satr.

### Stub to'lov qayd etish (idempotent + gate qilingan)

- Quruvchi bir ulushni **to'landi** deb belgilaganda `Payment` yoziladi (`method = STUB`,
  `amountSom = installment.amountSom` — **to'liq summa**, 6.4a da qisman to'lov yo'q). `pay` ulush
  **`PENDING`** va uning kontrakti **`ACTIVE`** bo'lishini talab qiladi, so'ng bitta `$transaction`
  ichida **`PaymentInstallment PENDING→PAID updateMany count===1` darvozasi** (uy idempotentlik idiomi)
  orqali flip qiladi; faqat `count === 1` bo'lganda `Payment` yaratiladi. Bir vaqtli/qayta otilgan
  `pay` → `count===0` → toza **409** (`Payment.installmentId @unique` 500 emas), bitta `Payment`.
  Ulush allaqachon to'langan bo'lsa → **409** (`Ulush allaqachon to'langan`). View `paidSom` (PAID
  ulushlar yig'indisi) + `remainingSom` (`totalSom − paidSom`) bilan qaytadi.

### API + CRM ko'rinishi

- **`POST /api/crm/contracts/:id/schedule`** (yarat), **`GET .../schedule`** (o'qi, yo'q bo'lsa `null`),
  **`DELETE .../schedule`** (o'chir), **`POST /api/crm/installments/:id/pay`** (to'landi) — barchasi
  `JwtGuard` + `DeveloperGuard`, `PaymentScheduleService` (provayder `DeveloperModule`da, `Prisma` +
  `DeveloperService` in'ektsiya qiladi). **Org-scoping**: kontrakt `{id, orgId}`, ulush
  `{id, schedule:{contract:{orgId}}}` — begona/yo'q id → **404**. `remove` faqat **hech bir ulush PAID
  emas** bo'lganda ishlaydi (aks holda 409 `To'lov qayd etilgan jadvalni o'chirib bo'lmaydi`). Jadval
  yaratish `ACTIVE` + `agreedAmount != null` + mavjud jadval yo'qligini talab qiladi
  (`contractId @unique` bir vaqtli ikki-yaratishni `P2002 → 409` bilan tutadi).
- **Kontrakt detali** (`apps/crm`, `pages/contract-detail`): faqat kontrakt `ACTIVE` bo'lganda
  ko'rinadigan **"To'lov jadvali"** bo'limi. Jadval **yo'q** bo'lsa — yaratish formasi (boshlang'ich
  to'lov / ulushlar soni / boshlanish sanasi). Jadval **bor** bo'lsa — ulushlar jadvali (№ / muddat /
  summa / holat nishoni + har `PENDING` qatorda **"To'landi"** tugmasi) + `paidSom`/`totalSom` progress
  qatori + hali hech to'lov bo'lmasa **"Jadvalni o'chirish"** tugmasi. UI matni o'zbekcha, pul
  `formatPriceSom(x, 'SALE')` bilan.

### Non-goals (Phase 6 ichida keyinroq)

- **OVERDUE** aniqlash (cron) + **qarzdorlar reestri** → **6.4b**; **moliya/KPI dashboard** +
  komissiya reconciliation (clawbacklardan keyingi net; legerda `contractId`) → **6.4b**. Haqiqiy
  to'lov-provayderlari (Click/Payme/Uzum/Apelsin/Paylov) / **QR** to'lov / ommaviy **SMS** / IP-telefoniya
  (partnyorga bog'liq). Kechikkan to'lov **jarimalari** + jarima kechirimi; **qisman to'lovlar** (6.4a
  har ulushga bitta to'liq summali `Payment` yozadi); yaratishdan keyin jadvalni tahrirlash (faqat
  o'chirish, hali to'lanmaganda); ko'p-to'lov / to'lov-turi / filial atributsiyasi; xaridorga
  qaragan to'lov ko'rinishi; sotuv bekor qilinganda (6.3 unwind) yig'ilgan ulushlarni avto-qaytarish —
  bekor qilingan kontraktning jadvali oddiygina **inert** bo'ladi (R7: jadval/pay ops `ACTIVE` talab
  qiladi, 6.4a hech qanday 6.3-cancel o'zgarishi kiritmaydi).

### Kelasi

- **6.4a yakunlandi** (ixtiyoriy `PaymentSchedule` + generatsiya `Σ == agreedAmount` + stub `Payment`
  qayd etish + CRM jadval bo'limi + 4 org-scoped route). Phase 6 dekompozitsiyasi: **6.1** org hamyoni →
  **6.2** kontraktlar → **6.3** komissiya clawback/unwind → **6.4** to'lov jadvallari/qarzdorlar/
  moliya-KPI, o'zi ikkiga bo'lingan: **6.4a** to'lov jadvali + to'lov qayd etish → **6.4b** qarzdorlar +
  moliya dashboard. **Keyingi: 6.4b — qarzdorlar reestri + moliya dashboard** (plan-vs-fact/KPI +
  contractId-on-ledger reconciliation keyinga qoldirildi — §4v Non-goal).

## 4v. Phase 6.4b — Qarzdorlar reestri + moliya dashboard (2026-09-08)

Phase 6 ning to'rtinchi qadamining (6.4) ikkinchi yarmi va **butun Phase 6 ni yakunlaydi** — 6.4a
qurgan to'lov jadvallari ustidan quruvchiga **org darajasidagi moliya suratini** va **qarzdorlar
reestrini** beradi. 6.4a gacha ulush ma'lumoti faqat har-kontrakt bo'yicha mavjud edi; qancha
kontraktlangan, yig'ilgan, qoldiq, muddati o'tgan; kim to'lovdan ortda qolgan; clawbacklardan keyingi
net komissiya qancha — bularning umumlashgan ko'rinishi yo'q edi. 6.4b buni **sof o'qish-uchun
(read-only) hisobot qatlami** sifatida qo'shadi: **hech qanday sxema o'zgarishi yo'q, migratsiya yo'q,
pul-yo'li (convert/cancel) tegilmaydi, cron yo'q**. Muddati o'tganlik **o'qish vaqtida** hisoblanadi;
net komissiya mavjud org hamyoni legeridan hosil qilinadi. Spec:
`docs/superpowers/specs/2026-09-08-phase-6.4b-finance-dashboard-design.md`.

### Moliya xulosasi (`GET /api/crm/finance`) — mavjud qatorlar ustidan agregatsiya

- Org darajasidagi **moliya surati**: **kontraktlangan** (`contractedSom` — org ning `ACTIVE`
  kontraktlaridagi barcha ulushlar yig'indisi, 6.4a `Σ == agreedAmount` invarianti bo'yicha),
  **yig'ilgan** (`collectedSom` — `PAID` ulushlar yig'indisi), **qoldiq**
  (`outstandingSom = kontraktlangan − yig'ilgan`), **muddati o'tgan** (`overdueSom` — `dueDate < now`
  bo'lgan `PENDING` ulushlar), `scheduleCount` + `debtorCount`, **net komissiya**
  (`commissionPaidSom = Σ COMMISSION_DEBIT − Σ COMMISSION_REFUND` org hamyoni legeridan, **≥ 0 ga
  qisiladi** — har refund oldingi debitni teskari qaytargani uchun net konstruksiya bo'yicha
  manfiy emas) va **org balansi** (`orgBalanceSom` — keshlangan hamyon balansi, **manfiy bo'lishi
  mumkin** = qarz). `now = new Date()` chaqiruv boshida bir marta olinadi — shu bois xulosa + qarzdorlar
  bitta bir xil onni ishlatadi (R2). Har `_sum.amountSom` `bigint | null` → `?? 0n` → `String(bigint)`;
  `orgBalanceSom` boshida `-` ga ruxsat beradi (R6).

### Qarzdorlar reestri (`GET /api/crm/debtors`) — muddati o'tgan ulushli kontraktlar

- Org ning **≥ 1 muddati o'tgan ulushga ega `ACTIVE` kontraktlari**: har qatorda kontrakt raqami,
  xaridor (ism + telefon), `overdueSom` (bu kontraktning muddati o'tgan ulushlari yig'indisi),
  `oldestDueDate` (eng eski muddati o'tgan sana, ISO) va `remainingSom` (barcha `PAID`-emas ulushlar
  yig'indisi — kelajakdagi `PENDING` ulushni ham hisoblaydi, shu bois `remainingSom ≥ overdueSom`).
  **Eng eski muddat oldinda** (`oldestDueDate` bo'yicha o'sish tartibida) saralanadi.

### Org-scoping + `ACTIVE`-filtri (load-bearing)

- **Har agregat/count/findMany org-scoped** (R3): ulushlar `schedule.contract.orgId` orqali, leger +
  balans `orgWallet.orgId` orqali — begona org ning qatorlari **hech qachon sanalmaydi/ko'rsatilmaydi**.
- **Yig'im + qarzdor so'rovlari `contract.status === 'ACTIVE'` ni filtrlaydi** (R4): 6.3 da **bekor
  qilingan** sotuv (unwind qilingan, xonadon qayta-sotiladigan, komissiyasi allaqachon
  `COMMISSION_REFUND` orqali teskari qaytarilgan) kontraktlangan/muddati-o'tganni **shishirmaydi** va
  **soxta qarzdor** sifatida chiqmaydi — yig'im tomonini komissiya tomonining REFUND netlashuvi bilan
  **izchil** saqlaydi. To'lov-jadvalsiz (to'liq to'lov) sotuvlar yig'im metrikasidan tashqarida.

### CRM "Moliya" dashboard sahifasi

- **`FinanceService`** (provayder `DeveloperModule`da, `Prisma` in'ektsiya qiladi) +
  **`FinanceController`** (`@Controller('crm')`, `JwtGuard` + `DeveloperGuard`, `orgIdOf(u.id)` ni
  yechadi) — `finance`/`debtors` yo'llari mavjud crm route'lari bilan to'qnashmaydi (o'rnatilgan
  ko'p-`@Controller('crm')` andozasi). DTO'lar `packages/shared`da (`FinanceSummarySchema` +
  `DebtorRowSchema`); barcha summa **satr**.
- **`apps/crm` "Moliya" sahifasi** (`pages/finance`, `features/finance/use-finance.ts` +
  `cabinet-nav` tab): **xulosa kartalari** (Kontraktlangan · Yig'ilgan · Qoldiq · Muddati o'tgan —
  `> 0` bo'lsa qizil · Net komissiya · Balans — manfiyda qizil "Qarz", 6.1 satr-belgisi idiomi bilan)
  - **qarzdorlar jadvali** (kontrakt raqami `/contracts/:id` ga link / xaridor / qarz / eng eski
    muddat / qoldiq, bo'sh holat "Qarzdor yo'q"). Pul `formatPriceSom(x, 'SALE')` bilan, UI matni
    o'zbekcha, identifikatorlar/route/izohlar inglizcha.

### Non-goals (nomlangan, qurilmagan)

- Saqlangan **`OVERDUE`** ulush statusi + belgilash **croni** (6.4b muddati o'tganlikni o'qishda
  hisoblaydi); qarzdorlarga **ommaviy SMS + vazifa biriktirish** (partnyorga bog'liq / og'ir);
  **plan-vs-fakt hisoboti, sotuv maqsadlari, xodim KPI** (maqsadlar modelini talab qiladi; og'irroq);
  legerdagi **`contractId`** (per-kontrakt komissiya atributsiyasi — org darajasidagi net komissiya
  usiz ham hosil qilinadi); platforma-keng (moderatsiya) moliya ko'rinishi; jadvalsiz to'liq-to'lov
  sotuvlari yig'im metrikasida; haqiqiy to'lov provayderlari.

### Kelasi

- **6.4b yakunlandi** (org moliya xulosasi + qarzdorlar reestri — mavjud jadvallar ustidan sof
  read-only agregatsiya, `ACTIVE`-scoped + net komissiya + CRM "Moliya" dashboard, 2 org-scoped route,
  sxema/migratsiya/cron/pul-yo'li o'zgarishisiz). **Bu bilan Phase 6 to'liq yakunlandi:** **6.1** org
  hamyoni + moliyalashtirilgan komissiya → **6.2** kontraktlar → **6.3** komissiya clawback/unwind →
  **6.4a** to'lov jadvali + to'lov qayd etish → **6.4b** qarzdorlar reestri + moliya dashboard.
  **Keyingi: Phase 7 — o'sish qatlami** (platform-spec §Phase 7: showroom 3D · ipoteka kalkulyatori ·
  xarita · reels · jurnal · mobil ilova · AI yordamchi · omnikanal inbox · telefoniya).

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
