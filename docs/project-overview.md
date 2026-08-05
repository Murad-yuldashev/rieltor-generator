# RieltorApp — loyiha haqida qisqacha

_Holat: 2026-yil 5-avgust_

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
| 3 ta obyekt (Buxoro)       | **10 ta obyekt** (Toshkent, OLX.uz'dan olingan real e'lonlar)                   |
| Oddiy havolalar ro'yxati   | **Kartalar lentasi** — filtr, saralash, "Ko'proq ko'rsatish"                    |
| 2 ta sahifa                | **7 ta sahifa** + pastki tab-menyu (Bosh sahifa · Qidiruv · Sevimlilar · Aloqa) |
| Faqat obyekt ko'rish       | **Sevimlilar**, **qidiruv tarixi**, **kengaytirilgan filtr paneli**             |
| —                          | **Ommaviy oferta** va **Aloqa/FAQ** sahifalari                                  |
| Faqat `/obj/:id` uchun SSR | Barcha SPA marshrutlari server tomondan HTML qobiq bilan beriladi               |

## 4. Funksiyalar ro'yxati

### Foydalanuvchi ko'radigan qism

- **Bosh sahifa (`/`)** — e'lon kartalari; Sotib olish/Ijara segmenti, tur bo'yicha chiplar
  (Yangi bino · Ikkilamchi · Hovli · Tijorat), matnli qidiruv, saralash (Yangi · Arzon · Qimmat),
  6 tadan sahifalash.
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

## 5. Texnik stack

- **Monorepo:** Yarn 4 workspaces + Turborepo — `apps/web`, `apps/api`, `packages/shared`
- **Front:** React 19 · Vite 6 · TypeScript · Tailwind v4 · React Router 7 · TanStack Query 5 ·
  Feature-Sliced Design (ESLint `boundaries` plagini qatlam qoidalarini majburlaydi)
- **Back:** NestJS 11 · Node 22 · Prisma 6 · PostgreSQL 16 · Zod (env + DTO + Swagger)
- **Umumiy:** `@rieltor/shared` — Zod sxemalar, narx formatteri, rasm nomlash qoidasi
  front va back uchun **yagona manba**
- **Test:** Vitest (unit) · supertest (API e2e) · Playwright (360px viewport)
- **CI:** GitHub Actions — format → lint → typecheck → build → migrate → seed → test,
  so'ng `docker compose` ustida e2e
- **Deploy:** bitta Docker imiji; yo'riqnoma — [deploy.md](deploy.md) (Neon + Railway)

## 6. Hali yopilmagan joylar

- **"Ijara" va "Tijorat" segmentlari** — UI'da bor, lekin bazada ma'lumot yo'q,
  bo'sh holat ko'rsatiladi.
- **Filtrlash va qidiruv brauzer tomonida** — butun ro'yxat bir marta yuklanadi.
  10 ta e'lon uchun yetarli, yuzlab e'lon bo'lsa server tomoniga ko'chirish kerak.
- **DoD'ning jonli URL talab qiladigan punktlari tekshirilmagan** — Telegram preview,
  Lighthouse ≥ 90, ikki qurilmadan hisoblagich (batafsil: [deploy.md](deploy.md) oxiri).
- **Oferta matni yuridik ko'rikdan o'tmagan** — prodga chiqishdan oldin yurist tekshirishi
  va kompaniya rekvizitlari qo'shilishi kerak.
- **Yangi UI qatlami hali commit qilinmagan** — qidiruv, sevimlilar, filtrlar, aloqa va
  oferta sahifalari ish katalogida turibdi (`git status`).
