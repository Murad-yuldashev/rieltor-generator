# E'lon joylashtirish moduli — dizayn spetsifikatsiyasi

**Sana:** 2026-08-09
**Holat:** tasdiqlangan, implementatsiya rejasiga tayyor
**Manba:** foydalanuvchi bergan "E'lon joylashtirish moduli. Texnik spetsifikatsiya v1.0" + mavjud kod bilan solishtirish
**Qamrov:** rieltorlar o'z e'lonlarini o'zlari joylaydigan modul — auth, kabinet, e'lon CRUD, hayot sikli, ulashish paketi, analitika, lidlar, ommaviy vitrina

---

## 1. Qat'iy qoidalar

Bu qoidalar hujjatning istalgan boshqa bandidan ustun turadi.

1. **Mavjud narsalar o'zgartirilmaydi va o'chirilmaydi.** Mavjud sahifalar (`/`, `/search`,
   `/obj/:id`, `/favorites`, `/contact`, `/offer`, 404), komponentlar, endpointlar
   (`GET /api/objects`, `GET /api/objects/:id`, `POST|GET /api/view/:id`, `/api/health`,
   `/api/docs`), OG-inject mexanizmi, sharp rasm-quvuri, seed skriptlari, mavjud testlar,
   CI va ESLint/boundaries konfiglari ishlashda davom etadi.
2. **Faqat qo'shimcha (additive) ish.** Prisma migratsiyalarida `DROP TABLE`, `DROP COLUMN`
   va ustun tipini o'zgartirish taqiqlanadi. Yangi ustunlar `NULL`able yoki default qiymatli.
3. Mavjud faylga tegish zarur bo'lsa — **minimal diff**. Bu hujjat ruxsat bergan tegish
   nuqtalari §2.4 da to'liq sanab o'tilgan; ro'yxatdan tashqari fayl o'zgartirilmaydi.
4. Mavjud testlar o'chirilmaydi va assertion'lari bo'shashtirilmaydi. Har yangi funksiyaga
   yangi test qo'shiladi.
5. **Xulq-atvor kafolatlari:** anonim tashrif buyuruvchi uchun sayt loginsiz to'liq ishlaydi;
   `realtorId`siz (seed) e'lonlar avvalgidek ko'rinadi; DB yiqilsa sahifa ochilaveradi;
   Telegram OG-preview buzilmaydi; Lighthouse mobile ≥ 90 saqlanadi.
6. Biror qadam mavjud kodni buzmasdan bajarib bo'lmasa — **to'xtaladi va sabab yozilib
   foydalanuvchidan ruxsat so'raladi.**
7. Har bosqich oxirida `format → lint → typecheck → build → test` yashil, keyin commit.
   Bosqichlar tartibi buzilmaydi (§10).
8. §11 dagi scope'dan tashqari narsalar qurilmaydi va taklif qilinmaydi.

---

## 2. Tasdiqlangan qarorlar

Manba spec bilan mavjud kod orasidagi farqlar shu bo'limda hal qilingan.

### 2.1 Brainstorm'da qabul qilingan qarorlar

| Savol                                  | Qaror                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| Rieltor rasmlarini saqlash             | S3-mos obyekt-storage (Cloudflare R2); sharp xotirada ishlaydi                  |
| `Realtor` va mavjud `Agent` munosabati | `Realtor` — kabinet identifikatori, undan `Agent` ko'zgu yozuvi upsert qilinadi |
| Rieltor e'loni umumiy lentada          | Ha — `GET /api/objects` `ACTIVE + RESERVED` bo'yicha filtrlaydi                 |
| Lokal dev va e2e'da kirish             | `NODE_ENV !== production` da shartli ro'yxatdan o'tadigan dev-login endpoint    |
| pHash dublikat aniqlash                | Keyinga qoldiriladi: hash yoziladi, taqqoslash alohida spec'da                  |
| Hujjat hajmi                           | Bitta dizayn hujjati + har bosqichga alohida implementatsiya rejasi             |

### 2.2 Nomlanish

Manba spec `Object` / `ObjectStatus` / `objectId` deb yozadi. Kodda model allaqachon
`Listing` deb ataladi, shuning uchun:

| Spec matni     | Kodda                                                   |
| -------------- | ------------------------------------------------------- |
| `Object`       | `Listing`                                               |
| `ObjectStatus` | `ListingStatus` (mavjud `ListingType`, `Deal` uslubida) |
| `objectId`     | `listingId`                                             |
| `Realtor`      | `Realtor` (yangi model, mavjud `Agent`dan alohida)      |

URL'lar esa **o'zgarmaydi**: mavjud kontroller `@Controller('objects')` bo'lgani uchun yangi
endpointlar ham `/api/objects/...` prefiksida qoladi.

Kod, marshrut, izoh va test nomlari ingliz tilida; foydalanuvchi ko'radigan matn o'zbekcha —
loyihaning mavjud qoidasi saqlanadi.

### 2.3 Manba spec'dagi tuzatilgan qarama-qarshiliklar

| Spec'dagi matn                                              | Amaldagi qaror                                                                               |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| §8: `GET /api/objects` "faqat `realtorId=NULL` (seed)"      | `status IN (ACTIVE, RESERVED)` bo'yicha filtr; seed default `ACTIVE`, natija bir xil         |
| §2: "mavjud 10 e'lon"                                       | Amalda 18 ta seed e'lon                                                                      |
| §9 2-bosqich: "rasm yuklash mavjud sharp-quvurni chaqiradi" | Quvur diskka yozadi; yadro buferga ajratiladi, yozish R2 ga (§6)                             |
| §4: `@nestjs/schedule` cron                                 | Serverless'da jarayon doim tirik emas → ichki cron endpoint + tashqi planlashtiruvchi (§7.3) |
| §6: Event dedupi view-counter uslubida                      | Xotiradagi `Map` serverless'da ishlamaydi → dedup bazada (§8.2)                              |
| §8: pHash taqqoslash 2-bosqichda                            | 2-bosqichda faqat hash yoziladi; taqqoslash keyingi spec'da                                  |

### 2.4 Mavjud fayllarga tegish nuqtalari (to'liq ro'yxat)

| Fayl                                             | O'zgarish                                                                     |
| ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                  | Yangi modellar va NULLable ustunlar                                           |
| `apps/api/src/app.module.ts`                     | Yangi modullar import qilinadi (dev-auth shartli)                             |
| `apps/api/src/config/env.ts`                     | Yangi **ixtiyoriy** env maydonlari                                            |
| `apps/api/src/bootstrap.ts`                      | Global-prefix exclude ro'yxatiga `r/:username` va kabinet marshrutlari        |
| `apps/api/src/ssr/routes.ts`                     | Yangi statik SPA marshrutlari                                                 |
| `apps/api/src/ssr/meta.ts`                       | `og:image` uchun `absoluteUrl()` yordamchisi (§6.3)                           |
| `apps/api/prisma/images.ts`                      | Yadro `src/media/variants.ts` ga ko'chadi, fayl yupqa qobiqqa aylanadi (§6.2) |
| `apps/api/src/listings/*`                        | `findAll()` ga status filtri, `findOne()` ga ko'rinish qoidasi (§5.3)         |
| `apps/web/src/app/router.tsx`                    | Yangi marshrutlar                                                             |
| `apps/web/src/widgets/site-header`               | "Rieltor uchun" havolasi                                                      |
| `packages/shared/src/*`                          | Yangi sxemalar, `absoluteUrl`, `buildShareCaption`, `allowedTransitions`      |
| `netlify.toml`                                   | `/r/*` rewrite, kabinet SPA marshrutlari, cron funksiyasi jadvali             |
| `apps/web/src/shared/api/client.ts`              | `POST/PATCH` uchun ixtiyoriy `body` (mavjud imzolar buzilmaydi)               |
| `apps/web/src/shared/api/client.test.ts`         | Yangi metodlar uchun qo'shimcha holatlar (mavjudlari o'chirilmaydi)           |
| `docs/project-overview.md`                       | Har bosqich oxirida yangi funksiyalar va endpointlar ro'yxati                 |
| `apps/web/src/pages/contact/ui/contact-page.tsx` | "Rieltor uchun" havolasi                                                      |
| `apps/api/.env.example`                          | Yangi ixtiyoriy env o'zgaruvchilari                                           |
| `apps/api/src/config/env.test.ts`                | Yangi maydonlar uchun qo'shimcha holatlar (mavjudlari o'chirilmaydi)          |
| `apps/api/test/ssr.e2e-spec.ts`                  | Yangi SPA marshrutlari uchun qo'shimcha holatlar                              |
| `.github/workflows/ci.yml`                       | e2e stack'ni `docker-compose.e2e.yml` overlay bilan ko'tarish                 |

Boshqa mavjud fayl o'zgartirilmaydi. Yangi `docker-compose.e2e.yml` overlay fayli asosiy
`docker-compose.yml` ni o'zgarishsiz qoldiradi: e2e stack'ga `NODE_ENV=test` va dev-login
sirini faqat shu overlay qo'shadi (cookie'ning `Secure` bayrog'i `http://localhost` da
saqlanmasligi uchun ham shu kerak).

---

## 3. Rollar

- **Mehmon** — hozirgi barcha foydalanuvchilar; ular uchun hech narsa o'zgarmaydi.
- **Rieltor** — Telegram orqali kirgan, o'z e'lonlarini boshqaradigan foydalanuvchi.
- **Admin** — UI'siz; `ADMIN_TOKEN` bilan himoyalangan endpointlar orqali moderatsiya qiladi.
- **Seed e'lonlari** — `realtorId = NULL` bo'lgan 18 ta mavjud e'lon; ular ommaviy
  sahifalarda avvalgidek qoladi va hech qanday migratsiya yoki cron ularga tegmaydi.

---

## 4. Arxitektura

### 4.1 Backend modullari

Barchasi yangi Nest modullari; mavjud `listings`, `views`, `ssr`, `health` modullariga
tegilmaydi.

| Modul            | Mas'uliyat                                                         |
| ---------------- | ------------------------------------------------------------------ |
| `auth`           | Telegram HMAC tekshiruvi, JWT cookie, `RealtorGuard`, `AdminGuard` |
| `auth-dev`       | Faqat dev/test'da ro'yxatdan o'tadigan dev-login                   |
| `realtors`       | `/api/me` profil, vitrina uchun ommaviy rieltor ma'lumoti          |
| `listings-write` | Rieltor CRUD, status o'tishlari, publish-validatsiya               |
| `media`          | Rasm variantlari (sharp, xotirada) va R2 ga yuklash                |
| `share`          | ShareLink va caption                                               |
| `analytics`      | `POST /api/event`, kabinet statistikasi                            |
| `leads`          | Lid qabul qilish va statuslari                                     |
| `maintenance`    | Cron vazifalari: avto-arxivlash, kurs, Event tozalash              |
| `admin`          | `pending` ro'yxati, approve/reject/trust                           |

### 4.2 Frontend (FSD qatlamlari saqlanadi)

Yangi: `pages/cabinet`, `pages/realtor-showcase`, `features/auth`, `features/listing-form`,
`features/listing-share`, `features/lead-form`, `entities/realtor`.

Mavjud `entities/listing` komponentlari (karta, narx bloki, params-row, galereya) vitrinada
va kabinetda **qayta ishlatiladi**, o'zgartirilmaydi. Bottom-nav'ga yangi tab qo'shilmaydi —
kabinetga kirish header'dagi va `/contact` sahifasidagi "Rieltor uchun" havolasi orqali.

### 4.3 Marshrutlar

| Marshrut                 | Turi        | SSR meta        |
| ------------------------ | ----------- | --------------- |
| `/cabinet`               | SPA qobiq   | yo'q, `noindex` |
| `/cabinet/new`           | SPA qobiq   | yo'q, `noindex` |
| `/cabinet/obj/:id/edit`  | SPA qobiq   | yo'q, `noindex` |
| `/cabinet/obj/:id/stats` | SPA qobiq   | yo'q, `noindex` |
| `/cabinet/leads`         | SPA qobiq   | yo'q, `noindex` |
| `/cabinet/profile`       | SPA qobiq   | yo'q, `noindex` |
| `/r/:username`           | dinamik SSR | ha (§9)         |

---

## 5. Ma'lumotlar modeli

### 5.1 Realtor ↔ Agent ko'zgusi

`Realtor` — autentifikatsiya va kabinet identifikatori. `Agent` — obyekt sahifasidagi
ommaviy karta. E'lon publish qilinganda (va `PATCH /api/me` da) Realtor profilidan `Agent`
yozuvi upsert qilinadi, `Listing.agentId` avvalgidek to'ldiriladi.

Natijada `Listing.agentId` `NOT NULL` bo'lib qoladi va `mapper.ts`, `ListingDetailSchema.agent`,
obyekt sahifasi, sticky-CTA hamda OG-inject **bir qator ham o'zgarmaydi**. Sinxronlash yagona
joyda — `RealtorsService.syncAgent(realtorId)` ichida.

### 5.2 Prisma qo'shimchalari

```prisma
model Realtor {
  id            String   @id @default(cuid())
  tgId          BigInt   @unique
  tgUsername    String?
  name          String
  photoUrl      String?
  /// Publish uchun majburiy — API darajasida tekshiriladi.
  phone         String?
  /// Bot orqali kontakt ulashilganda true (5-bosqich).
  phoneVerified Boolean  @default(false)
  agency        String?
  /// /r/:username uchun slug: [a-z0-9-]{3,30}. MVP'da o'zgartirilmaydi.
  username      String   @unique
  /// Rieltorlik reestri raqami — ixtiyoriy, tekshirilmaydi.
  registryNo    String?
  /// true bo'lgach e'lonlari moderatsiyasiz chiqadi.
  trusted       Boolean  @default(false)
  /// Ommaviy kartani ko'rsatuvchi ko'zgu Agent yozuvi; publish'da paydo bo'ladi.
  agentId       String?  @unique
  agent         Agent?   @relation(fields: [agentId], references: [id])
  createdAt     DateTime @default(now())
  listings      Listing[]
}

model Agent {
  // ... mavjud maydonlar tegilmaydi ...
  /// Faqat teskari relation maydoni — Agent jadvalida yangi ustun hosil qilmaydi
  /// (FK Realtor tomonida). Prisma relation'ning ikkala uchini talab qiladi.
  realtor Realtor?
}

enum ListingStatus { DRAFT PENDING ACTIVE RESERVED SOLD RENTED ARCHIVED }

model Listing {
  // ... mavjud maydonlar tegilmaydi ...
  status         ListingStatus @default(ACTIVE)
  realtorId      String?
  realtor        Realtor?      @relation(fields: [realtorId], references: [id])
  publishedAt    DateTime?
  expiresAt      DateTime?
  soldAt         DateTime?
  /// Admin rad etganda yozilgan sabab.
  moderationNote String?
  /// expiresAt − 3 kun eslatmasi yuborilganini belgilaydi (takror yubormaslik uchun).
  expiryNotifiedAt DateTime?
  priceHistory   PriceHistory[]
  shareLinks     ShareLink[]
  events         Event[]
  leads          Lead[]

  @@index([status])
  @@index([realtorId])
}

model Image {
  // ... mavjud maydonlar tegilmaydi ...
  /// Perceptual hash. 2-bosqichda yoziladi, taqqoslash keyingi spec'da.
  phash String?
}

model PriceHistory {
  id        String   @id @default(cuid())
  listingId String
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  priceSom  BigInt
  priceUsd  Int
  changedAt DateTime @default(now())

  @@index([listingId, changedAt])
}

model ShareLink {
  id        String   @id @default(cuid())
  /// 6 belgili base62 (nanoid).
  code      String   @unique
  listingId String
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  /// Rieltor bergan nom: "kanalim", "guruh A"...
  label     String?
  createdAt DateTime @default(now())

  @@index([listingId])
}

enum EventType { VIEW CALL_CLICK TG_CLICK }

model Event {
  id        String    @id @default(cuid())
  listingId String
  listing   Listing   @relation(fields: [listingId], references: [id], onDelete: Cascade)
  type      EventType
  /// Atributsiya uchun ShareLink.code nusxasi (FK emas — havola o'chsa ham statistika qoladi).
  shareCode String?
  /// Xom IP saqlanmaydi — faqat kunlik tuz bilan hash (§8.2).
  ipHash    String
  createdAt DateTime  @default(now())

  @@index([listingId, createdAt])
  @@index([ipHash, listingId, type, createdAt])
}

enum LeadStatus { NEW CONTACTED MEETING CLOSED }

model Lead {
  id        String     @id @default(cuid())
  listingId String
  listing   Listing    @relation(fields: [listingId], references: [id], onDelete: Cascade)
  name      String
  phone     String
  status    LeadStatus @default(NEW)
  /// Anti-spam va 24 soatlik eslatma uchun.
  ipHash    String
  notifiedAt DateTime?
  createdAt DateTime   @default(now())

  @@index([listingId, createdAt])
}

model FxRate {
  /// Kun boshiga bitta yozuv.
  date     DateTime @id @db.Date
  usdRate  Float
  fetchedAt DateTime @default(now())
}
```

Barcha yangi Zod sxemalar `packages/shared` ga qo'shiladi — front va back uchun yagona manba
qoidasi saqlanadi, Swagger avvalgidek Zod'dan generatsiya bo'ladi.

### 5.3 Ommaviy ko'rinish qoidalari

| Kontekst                            | Ko'rinadigan statuslar                                   |
| ----------------------------------- | -------------------------------------------------------- |
| `GET /api/objects` (`/`, `/search`) | `ACTIVE`, `RESERVED`                                     |
| `/r/:username`                      | `ACTIVE`, `RESERVED` + alohida bo'limda `SOLD`, `RENTED` |
| `GET /api/objects/:id`              | `ACTIVE`, `RESERVED`, `SOLD`, `RENTED`                   |
| `DRAFT`, `PENDING`, `ARCHIVED`      | Faqat egasiga (`/api/me/objects/:id`); boshqalarga 404   |

`SOLD/RENTED` sahifasi ataylab ochiq qoldiriladi: eski havolalar o'lik 404 emas, "SOTILDI ·
N kunda" belgisi bilan ishonch signaliga aylanadi (`N = soldAt − publishedAt`).

Seed e'lonlari `status = ACTIVE`, `realtorId = NULL` bo'lgani uchun bugungidek ko'rinadi.
`seed.ts` `upsert` ishlatadi, shuning uchun qayta seed rieltor e'lonlariga tegmaydi.

---

## 6. Rasm quvuri va obyekt-storage

### 6.1 Nima uchun R2

Hozirgi deploy — Netlify serverless. Rasmlar **build vaqtida** `seed` orqali
`apps/api/public/images` ga yoziladi va CDN publish papkasiga ko'chiriladi; funksiya
bundle'idan `apps/api/public/**` ataylab chiqarib tashlangan. Lambda'da fayl tizimi
read-only, shuning uchun ish vaqtida diskka yozadigan quvur ishlamaydi. S3-mos storage
(Cloudflare R2) ikkala deploy maqsadida ham bir xil ishlaydi.

### 6.2 Kod bo'linishi

`apps/api/prisma/images.ts` hozir sharp natijasini to'g'ridan-to'g'ri diskka yozadi. Yadro
`apps/api/src/media/variants.ts` ga ko'chiriladi va **buferlar qaytaradi**:

```ts
renderImageVariants(source: Buffer): Promise<{
  variants: { name: string; body: Buffer }[];  // 01-360.webp, 01-720.webp, 01-1200.webp, 01-1200.jpg
  og: Buffer | null;
  width: number;
  height: number;
}>
```

`prisma/images.ts` shu yadroni chaqirib buferlarni diskka yozadigan yupqa qobiqqa aylanadi —
seed xulqi va mavjud `prisma/images.test.ts` o'zgarmaydi. Aynan shu test refaktoringning
xavfsizlik kafolati.

### 6.3 Saqlash va URL'lar

Kalitlar `@rieltor/shared` dagi mavjud nomlash konvensiyasiga to'liq mos:
`listings/<listingId>/<NN>-{360,720,1200}.webp`, `<NN>-1200.jpg`, `og.jpg`.

`Image.base` rieltor rasmlari uchun **to'liq URL** bo'ladi
(`https://<MEDIA_PUBLIC_URL>/listings/<id>/01`), shuning uchun `imageSrcSet()`,
`<img srcset>` va `<link rel=preload>` hech qanday o'zgarishsiz ishlayveradi. Seed rasmlari
eski nisbiy yo'llarida qoladi — ikkala shakl yonma-yon yashaydi.

`meta.ts` `og:image`ni `${baseUrl}${ogUrl}` deb ko'r-ko'rona ulaydi. Shuning uchun
`@rieltor/shared` ga kichik yordamchi qo'shiladi:

```ts
absoluteUrl(baseUrl: string, url: string): string  // url `http` bilan boshlansa — o'zi qaytadi
```

`meta.ts` da ikki qator shu funksiyaga o'tadi; mavjud `meta.test.ts` yashil qoladi.

### 6.4 Yuklash yo'li

Netlify funksiyasiga keladigan so'rov tanasi ~6 MB bilan cheklangan (base64 hisobiga amalda
~4.5 MB). Shu sabab brauzer rasmni yuborishdan oldin `canvas` orqali maksimal 1600px'ga
kichraytiradi (odatda 0.5–1.5 MB), server esa `sharp` bilan yakuniy variantlarga aylantiradi.

`POST /api/objects/:id/images` (multipart, egalik tekshiruvi bilan):

- bitta e'longa ≤ 12 rasm;
- tur `sharp` metadata orqali aniqlanadi (fayl kengaytmasiga ishonilmaydi), faqat
  jpeg/png/webp;
- kelgan tana > 4 MB bo'lsa 413 va tushunarli xabar;
- birinchi rasm uchun `og.jpg` avtomatik yaratiladi;
- rasm o'chirilganda R2 kalitlari ham o'chadi va `position` qayta raqamlanadi.

### 6.5 Degradatsiya

`R2_*` env'lari berilmasa `media` moduli ro'yxatdan o'tmaydi: sayt, seed rasmlari va butun
ommaviy qism avvalgidek ishlaydi, kabinetda rasm yuklash tugmasi "vaqtincha ishlamaydi"
holatida ko'rinadi. Bu loyihaning mavjud "DB yiqilsa ham sahifa ochiladi" odatining davomi.

---

## 7. Auth, kabinet va hayot sikli

### 7.1 Telegram Login

`POST /api/auth/telegram` widget qaytargan maydonlarni oladi
(`id, first_name, last_name?, username?, photo_url?, auth_date, hash`):

1. `data_check_string` — `hash`dan boshqa kalitlar alifbo tartibida `key=value` ko'rinishida
   `\n` bilan birlashtiriladi;
2. kalit = `SHA256(TELEGRAM_BOT_TOKEN)`;
3. `HMAC-SHA256` timing-safe solishtiriladi;
4. `auth_date` 24 soatdan eski bo'lsa 401.

Muvaffaqiyatda `Realtor` `tgId` bo'yicha upsert qilinadi va `rlt_session` cookie beriladi:
`httpOnly`, `Secure`, `SameSite=Lax`, 30 kun, HS256 JWT, payload'da faqat `realtorId`.
`POST /api/auth/logout` cookie'ni tozalaydi.

`username` birinchi kirishda `tgUsername`dan slug qilinadi; band bo'lsa `-2`, `-3` qo'shiladi;
`tgUsername` bo'lmasa `rieltor-<qisqa-id>`.

CSRF himoyasi — `SameSite=Lax` va barcha o'zgartiruvchi endpointlarning `POST/PATCH` bo'lishi
hamda faqat `application/json` (yoki multipart rasm) qabul qilishi.

### 7.2 Dev-login

`auth-dev` moduli `app.module.ts` da shartli ro'yxatdan o'tadi: faqat
`NODE_ENV !== 'production'` **va** `DEV_LOGIN_SECRET` berilgan bo'lsa. Prod bundle'da
endpoint umuman mavjud emas.

`POST /api/auth/dev { secret, tgId, name? }` → xuddi shu JWT cookie. Playwright e2e va CI
kabinetga shu orqali kiradi; HMAC tekshiruvining o'zi unit testlar bilan qoplanadi.

### 7.3 Guard'lar va env

- `RealtorGuard` — cookie'dagi JWT'ni tekshiradi, `request.realtorId` ni to'ldiradi.
- `AdminGuard` — `x-admin-token` header `ADMIN_TOKEN` bilan timing-safe solishtiriladi.
- Mavjud ochiq endpointlarga guard qo'yilmaydi.

Yangi env maydonlari **barchasi ixtiyoriy** (`z.string().optional()`): `TELEGRAM_BOT_TOKEN`,
`JWT_SECRET`, `ADMIN_TOKEN`, `DEV_LOGIN_SECRET`, `CRON_SECRET`, `IP_HASH_SECRET`,
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `MEDIA_PUBLIC_URL`.
Berilmagani modulni o'chiradi, ilovani yiqitmaydi — §1.5 kafolati shunda saqlanadi.

### 7.4 Status mashinasi

Ruxsat etilgan o'tishlar (serverda majburlanadi, boshqasi → 409):

| Dan → Ga                          | Kim                       | Shart / yon ta'sir                                          |
| --------------------------------- | ------------------------- | ----------------------------------------------------------- |
| `DRAFT → ACTIVE`                  | rieltor (`trusted=true`)  | publish-validatsiya; `publishedAt=now`, `expiresAt=now+30d` |
| `DRAFT → PENDING`                 | rieltor (`trusted=false`) | publish-validatsiya                                         |
| `PENDING → ACTIVE`                | admin                     | `publishedAt`, `expiresAt` o'rnatiladi                      |
| `PENDING → DRAFT`                 | admin (rad) yoki rieltor  | rad sababi `moderationNote` ga yoziladi                     |
| `ACTIVE ↔ RESERVED`               | rieltor                   | sahifada "Band qilingan" lentasi, CTA ishlayveradi          |
| `ACTIVE\|RESERVED → SOLD\|RENTED` | rieltor                   | `soldAt=now`; `SOLD` sotuv uchun, `RENTED` ijara uchun      |
| `SOLD\|RENTED → ACTIVE`           | rieltor                   | faqat `soldAt` dan 48 soat ichida; keyin yakuniy            |
| `ACTIVE\|RESERVED → ARCHIVED`     | rieltor yoki cron         | qo'lda yoki muddat tugashi                                  |
| `ARCHIVED → ACTIVE`               | rieltor                   | `expiresAt` qayta hisoblanadi                               |

Jadvalning yagona manbasi — `@rieltor/shared` dagi sof funksiya
`allowedTransitions(status, role)`. Server 409 qaytarish uchun, front esa qaysi tugmani
ko'rsatishni bilish uchun shuni ishlatadi.

**Publish-validatsiya** ham shared'dagi Zod sxema (`PublishableListingSchema`): amal turi,
obyekt turi, narx, xona soni (kvartira/hovli uchun), tuman, ≥ 1 rasm, sarlavha ≥ 10 belgi va
rieltor profilida `phone`. Front "nima yetishmayapti"ni ko'rsatadi, server o'shani majburlaydi.
Qolgan hamma maydon ixtiyoriy — `DRAFT` da chala saqlash mumkin.

### 7.5 Cron

Serverless'da doimiy jarayon yo'q, shuning uchun `@nestjs/schedule` o'rniga bitta ichki
endpoint: `POST /api/internal/cron/daily`, `x-cron-secret` bilan himoyalangan. Uni Netlify
Scheduled Function kuniga bir marta chaqiradi; Docker/Railway'da xuddi shu endpointni
istalgan planlashtiruvchi chaqiradi — kod yo'li bitta.

Vazifalari:

1. `expiresAt < now` va `status IN (ACTIVE, RESERVED)` va **`realtorId != NULL`** →
   `ARCHIVED`;
2. `expiresAt − 3d` yetgan va `expiryNotifiedAt IS NULL` → belgilanadi (kabinetda banner;
   5-bosqichdan boshlab bot xabari);
3. CBU rasmiy JSON API'dan kurs olinadi va `FxRate` ga yoziladi; API ishlamasa oxirgi
   saqlangan kurs ishlatiladi;
4. 90 kundan eski `Event` yozuvlari o'chiriladi.

Seed e'lonlariga hech qachon tegmasligi alohida test bilan isbotlanadi.

### 7.6 Narx

Narx o'zgartirilganda eski qiymat `PriceHistory` ga yoziladi. Yangi narx oldingisidan past
bo'lsa, kartada va obyekt sahifasida **"↓ Narx tushdi"** belgisi 7 kun ko'rinadi. Narx so'm
yoki dollarda kiritiladi, ikkinchisi `FxRate` bo'yicha hisoblanadi va rieltor uni qo'lda
o'zgartira oladi. Formatlash mavjud `@rieltor/shared` formatteri bilan.

---

## 8. Ulashish, analitika, lidlar

### 8.1 ShareLink

`POST /api/objects/:id/share { label? }` (faqat egasiga) → `{ code, url }`, bunda
`url = ${PUBLIC_BASE_URL}/obj/:id?s=code`. Publish'dan keyin darhol "Ulashish" ekrani
ko'rsatiladi: havola, tayyor caption va "Nusxalash" tugmasi.

Caption `@rieltor/shared` dagi `buildShareCaption(listing)` orqali quriladi (sarlavha · narx ·
xona/m² · tuman · havola) va mavjud `formatPriceSom` ni ishlatadi — ijara narxi `/oy` bilan
chiqadi.

`?s=` OG-preview'ga ta'sir qilmaydi: `SsrController` query'ni o'qimaydi va `netlify.toml`
dagi `/obj/*` rewrite query'ni saqlaydi. Buni yangi e2e test qotiradi — `/obj/bx-001?s=abc123`
javobidagi meta teglar `?s=`siz variant bilan bayt-ma-bayt bir xil.

### 8.2 Event

`POST /api/event { listingId, type, shareCode? }` — CTA bosilganda (`CALL_CLICK`, `TG_CLICK`)
va sahifa ochilganda (`VIEW`). Mavjud `POST /api/view/:id` hisoblagichi **tegilmaydi** va
yonma-yon ishlaydi.

Dedup **bazada**: `ipHash + listingId + type` bo'yicha oxirgi 10 daqiqada yozuv bor-yo'qligi
tekshiriladi. Xotiradagi `Map` ishlatilmaydi — u serverless'da har sovuq startda nolga
tushadi.

`ipHash = sha256(ip + ':' + <UTC sana> + ':' + IP_HASH_SECRET)` — xom IP hech qayerda
saqlanmaydi va kunlik tuz tufayli kun oshib ketgach eski hashlar bir-biriga bog'lanmaydi.

### 8.3 Statistika

`GET /api/me/stats` va `GET /api/me/objects/:id/stats` — 7 va 30 kun kesimida ko'rishlar,
`CALL_CLICK`, `TG_CLICK` hamda share-label bo'yicha taqsimot (`groupBy`). Faqat egasiga.

### 8.4 Lidlar

Obyekt sahifasida uchinchi CTA — "Raqamimni qoldiraman" → modal forma (ism, telefon;
O'zbekiston formati shared Zod sxemasida) → `POST /api/leads`. Anti-spam: bitta `ipHash`
bitta e'longa 1 soatda 1 lid, plus honeypot maydon.

Kabinetda lidlar ro'yxati; status faqat `NEW → CONTACTED → MEETING → CLOSED` yo'nalishida
yoki to'g'ridan-to'g'ri `CLOSED` ga o'tadi. Boshqa CRM funksiyasi qurilmaydi.

---

## 9. Vitrina va moderatsiya

### 9.1 `/r/:username`

Yangi `RealtorSsrController` (alohida fayl) mavjud `HtmlCacheService` ni qayta ishlatadi va
yangi `buildRealtorMetaTags()` bilan meta inject qiladi — mavjud `SsrController` fayli
tegilmaydi. Marshrut dinamik bo'lgani uchun `netlify.toml` ga `/r/*` → funksiya rewrite'i va
`bootstrap.ts` dagi global-prefix exclude ro'yxatiga bitta qator qo'shiladi.

Sahifa tarkibi:

- rieltor kartasi: foto, ism, agentlik, "✓ Tasdiqlangan Telegram", `registryNo` bo'lsa reestr
  qatori, qo'ng'iroq/Telegram tugmalari;
- `ACTIVE + RESERVED` e'lonlar — mavjud `listing-card` komponenti bilan;
- pastda alohida "Sotilgan obyektlar" bo'limi: `SOLD/RENTED`, har birida "N kunda sotilgan".

OG rasmi: rieltor fotosi, bo'lmasa birinchi e'lonning `og.jpg` i. Sarlavha — rieltor ismi +
agentlik.

### 9.2 Moderatsiya

`trusted=false` rieltorning publish'i `PENDING` ga tushadi. Admin endpointlari
(`AdminGuard` bilan, Swagger orqali ishlatiladi):

- `GET /api/admin/pending`
- `POST /api/admin/objects/:id/approve`
- `POST /api/admin/objects/:id/reject { note? }`
- `POST /api/admin/realtors/:id/trust`

Admin-panel UI qurilmaydi.

`Image.phash` 2-bosqichda hisoblanib yoziladi (ma'lumot yig'ila boshlaydi), lekin taqqoslash,
`dupFlag` va admin ro'yxatidagi bayroq — keyingi spec'ning ishi.

---

## 10. Bosqichlar va qabul mezonlari

Har bosqich alohida implementatsiya rejasi bilan boshlanadi va alohida commit(lar) bilan
tugaydi. Bosqich tugamay turib keyingisi boshlanmaydi.

### 1-bosqich — Auth va profil

`Realtor` modeli, `POST /api/auth/telegram`, `POST /api/auth/logout`, dev-login,
`GET|PATCH /api/me`, `RealtorGuard`, `AdminGuard`, kabinet skeleti (`/cabinet`, `/cabinet/profile`).

_Qabul:_ login → cookie → `/api/me` ishlaydi; anonim foydalanuvchi uchun sayt o'zgarmagan;
barcha eski testlar yashil; yangi testlar — HMAC verify (to'g'ri hash · buzilgan hash · eski
`auth_date`), JWT guard, username slug generatsiyasi.

### 2-bosqich — E'lon CRUD, statuslar, rasm yuklash

Prisma qo'shimchalari (§5.2), `POST|PATCH /api/objects` egalik tekshiruvi bilan,
`allowedTransitions` va publish-validatsiya, `media` moduli va R2, `variants.ts` refaktoringi,
kabinetda forma (`features/listing-form`) va DRAFT saqlash, `syncAgent`.

_Qabul:_ rieltor telefondan e'lon joylaydi (DRAFT → PENDING/ACTIVE), rasm variantlari va
`og.jpg` R2 da paydo bo'ladi, `/obj/:id` yangi e'lon uchun OG preview bilan ishlaydi, seed
e'lonlari va `prisma/images.test.ts` o'zgarmagan.

### 3-bosqich — Ulashish va analitika

`ShareLink`, ulashish ekrani va caption, `POST /api/event`, CTA-klik tracking,
`/api/me/stats`, kabinetda obyekt statistikasi.

_Qabul:_ `?s=` bilan ochilgan sahifadagi kliklar manba kesimida ko'rinadi; OG preview `?s=`
bilan ham bir xil (e2e test); dedup oynasi ishlaydi.

### 4-bosqich — Vitrina, cron, narx

`/r/:username` OG bilan, SOLD-portfolio, cron endpoint va Netlify Scheduled Function,
`FxRate`, `PriceHistory`, "narx tushdi" belgisi.

_Qabul:_ vitrina havolasi Telegram'da chiroyli preview bilan ochiladi; muddati o'tgan test
e'loni cron'da `ARCHIVED` bo'ladi va seed e'lonlari tegilmagani test bilan isbotlanadi; narx
tushirilganda belgi chiqadi.

### 5-bosqich — Lidlar va bot xabarlari

Lid formasi, API va ro'yxati; minimal bot (faqat `sendMessage`: yangi lid, 24 soatlik
eslatma, muddat eslatmasi; kontakt ulashilganda `phoneVerified=true`).

_Qabul:_ lid qoldirilganda rieltor Telegram'da xabar oladi; anti-spam ishlaydi.

### Regressiya to'ri (har bosqichda)

Mavjud testlar o'zgarmaydi, ustiga "qo'riqchi" testlar qo'shiladi:

- `GET /api/objects` javob shakli va seed e'lonlari soni;
- `/obj/:id` OG teglari `?s=` bilan ham bir xil;
- cron seed e'lonlariga tegmaydi;
- anonim foydalanuvchi uchun barcha ommaviy sahifalar loginsiz ochiladi.

---

## 11. Scope'dan tashqarida

Qurilmaydi va taklif ham qilinmaydi: to'lov va tariflar · OLX-import parseri · AI-tavsif yoki
narx-mo'ljal · kanalga avto-post va haftalik digest · agentlik (ko'p rieltorli) rejimi ·
multilisting · to'liq CRM · admin-panel UI · xarita · ko'p til · push-bildirishnomalar ·
e'lonlarni ko'tarish (boost) · izoh va reyting tizimi · pHash taqqoslash va `dupFlag` ·
server tomonidagi filtr/qidiruv migratsiyasi.

---

## 12. Modul DoD

- [ ] Yangi rieltor Telegram orqali kirib, telefonini kiritib, 3 daqiqada e'lon joylaydi
      (real telefonda tekshiriladi)
- [ ] E'lon havolasi Telegram'da rasm + sarlavha + narx preview bilan ochiladi (`?s=` bilan ham)
- [ ] CTA kliklar va manba kesimi kabinetda ko'rinadi
- [ ] SOLD belgisi va vitrina-portfolio ishlaydi; muddati o'tgan e'lon avto-arxivlanadi
- [ ] Lid formasi → botdan xabar zanjiri ishlaydi
- [ ] Anonim foydalanuvchi tajribasi va barcha eski funksiyalar regressiyasiz
- [ ] Lighthouse mobile ≥ 90 saqlangan

---

## 13. Ochiq risklar

| Risk                                                           | Qanday yopiladi                                                            |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| BotFather'da domen bog'lash faqat prod domeni bilan ishlaydi   | Lokal va CI'da dev-login; domen prodga chiqqach sozlanadi                  |
| R2 bucket va `MEDIA_PUBLIC_URL` sozlanmasa 2-bosqich tugamaydi | Bosqich boshida infratuzilma qadami sifatida bajariladi                    |
| Netlify funksiyasining ~6 MB tana chegarasi                    | Brauzerda 1600px'ga kichraytirish + 413 xabari                             |
| Lentaga rieltor e'lonlari qo'shilib ro'yxat kattalashishi      | Client-side filtr hozircha qoladi; server tomoniga ko'chirish alohida spec |
