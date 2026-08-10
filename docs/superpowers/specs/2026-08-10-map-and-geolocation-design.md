# Xarita va geolokatsiya — dizayn spetsifikatsiyasi

**Sana:** 2026-08-10
**Holat:** tasdiqlangan, implementatsiya rejasiga tayyor
**Qamrov:** foydalanuvchi o'z joyini tanlaydi va lenta yaqinlik bo'yicha saralanadi; e'lon kartasi va obyekt sahifasida uyning joyi xaritada ko'rsatiladi

---

## 1. Qat'iy qoidalar

1. **Mavjud narsalar o'zgartirilmaydi va o'chirilmaydi.** Mavjud sahifalar, endpointlar, OG-inject mexanizmi, rasm quvuri, seed skriptlari, rieltor kabineti va mavjud testlar ishlashda davom etadi.
2. **Faqat qo'shimcha (additive) ish.** Prisma migratsiyasida `DROP` va ustun tipini o'zgartirish taqiqlanadi; yangi ustunlar NULLable.
3. Mavjud faylga tegish zarur bo'lsa — **minimal diff**. Ruxsat berilgan tegish nuqtalari §3.3 da to'liq sanab o'tilgan.
4. Mavjud testlar o'chirilmaydi va assertion'lari bo'shashtirilmaydi.
5. **Xulq-atvor kafolatlari:** xarita kaliti berilmasa sayt bugungidek ishlaydi; geolokatsiya rad etilsa lenta avvalgidek ochiladi; koordinatasi yo'q e'lon avvalgidek ko'rinadi; Lighthouse mobile ≥ 90 saqlanadi.
6. Biror qadam mavjud kodni buzmasdan bajarib bo'lmasa — to'xtaladi va sabab yozilib foydalanuvchidan ruxsat so'raladi.
7. Har bosqich oxirida `format → lint → typecheck → build → test` yashil, keyin commit.
8. §10 dagi scope'dan tashqari narsalar qurilmaydi va taklif qilinmaydi.

---

## 2. Nima uchun va nima quriladi

Foydalanuvchi uchun ikki aniq talab:

1. **E'lonlar foydalanuvchi turgan hududdan boshlanishi kerak**, va u o'z joyini xaritadan tanlay olishi kerak.
2. **E'lon kartasidagi ikonka** bosilganda uyning joyi ko'rsatilishi kerak.

Shundan kelib chiqib: foydalanuvchining nuqtasi aniqlanadi (avtomatik yoki qo'lda), lenta shu nuqtaga yaqinlik bo'yicha saralanadi, har bir e'lonning joyi esa kartada va obyekt sahifasida xaritada ko'rsatiladi.

### 2.1 Brainstorm'da qabul qilingan qarorlar

| Savol                         | Qaror                                                                       |
| ----------------------------- | --------------------------------------------------------------------------- |
| E'lon koordinatalari qayerdan | 18 ta seed e'loni uchun qo'lda `seed-data.ts` ga yoziladi                   |
| Lenta qanday o'zgaradi        | Yaqinlik bo'yicha **saralash** (filtrlash emas) — hamma e'lon ko'rinaveradi |
| Geolokatsiya ruxsati qachon   | Sahifa ochilishi bilan avtomatik (birinchi renderdan keyin)                 |
| Kartadagi ikonka              | Xarita kartaning **ichida** ochiladi                                        |
| Obyekt sahifasi               | Manzil matni ostiga xarita qo'shiladi                                       |
| Xarita turi                   | Ko'rsatish uchun statik rasm, joy tanlash uchun interaktiv JS xarita        |

### 2.2 Avvalgi spec'ning taqig'i bekor qilinadi

[2026-08-09-listing-publishing-design.md](2026-08-09-listing-publishing-design.md) §11 "scope'dan tashqarida" ro'yxatida **xarita** yozma taqiqlangan edi. Bu hujjat o'sha bandni aynan xarita qismida bekor qiladi. O'sha spec'ning qolgan barcha taqiqlari kuchida qoladi.

Shu sababli [location.tsx](../../../apps/web/src/entities/listing/ui/location.tsx) dagi `/** NO map — out of scope per spec §9. Text only. */` izohi ham yangilanadi.

---

## 3. Arxitektura

### 3.1 Ikki xil xarita

Yandex'ning to'liq JS API'si ~300 KB dan ortiq, loyihaning sharti esa Lighthouse mobile ≥ 90. Shuning uchun:

| Qayerda                                 | Nima bilan                                                | Nega                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| E'lon kartasi ichida, obyekt sahifasida | **Statik rasm** (Yandex Static API), marker bilan `<img>` | Bir necha KB, skript yuklanmaydi, LCP'ga tegmaydi. Bosilsa Yandex xaritasi yangi oynada ochiladi — zoom va marshrut o'sha yerda |
| Joy tanlash oynasi                      | **Interaktiv JS xarita**                                  | Surish va zoom aynan shu yerda kerak. Skript faqat oyna ochilganda, bir marta yuklanadi                                         |

### 3.2 Yangi modullar

| Fayl                                                             | Mas'uliyat                                                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `packages/shared/src/geo.ts`                                     | `distanceKm`, `formatDistance`, `TASHKENT_DISTRICTS`, `nearestDistrict` — sof funksiyalar |
| `apps/web/src/shared/lib/yandex-maps.ts`                         | JS API skriptini bir marta yuklaydigan idempotent loader                                  |
| `apps/web/src/shared/ui/static-map.tsx`                          | Statik xarita rasmi; kalit yo'q bo'lsa hech nima chizmaydi                                |
| `apps/web/src/features/user-location/model/use-user-location.ts` | Nuqtani aniqlash, saqlash, o'qish                                                         |
| `apps/web/src/features/user-location/ui/location-chip.tsx`       | Header'dagi yorliq/tugma                                                                  |
| `apps/web/src/features/user-location/ui/location-picker.tsx`     | Interaktiv xaritali tanlash oynasi                                                        |
| `apps/web/src/features/user-location/index.ts`                   | Public API                                                                                |

Backend'da yangi modul yo'q — faqat ikkita ustun va ularni javobga qo'shish.

### 3.3 Mavjud fayllarga tegish nuqtalari (to'liq ro'yxat)

| Fayl                                                       | O'zgarish                                        |
| ---------------------------------------------------------- | ------------------------------------------------ |
| `apps/api/prisma/schema.prisma`                            | `Listing` ga `lat Float?`, `lng Float?`          |
| `apps/api/prisma/seed-data.ts`                             | 18 ta e'lon uchun koordinatalar                  |
| `apps/api/src/listings/mapper.ts`                          | Javobga `lat`, `lng`                             |
| `packages/shared/src/schemas.ts`                           | `ListingSummarySchema` ga `lat`, `lng`           |
| `packages/shared/src/index.ts`                             | `geo` eksporti                                   |
| `apps/web/src/entities/listing/ui/listing-card.tsx`        | Joylashuv ikonkasi, masofa belgisi, xarita bloki |
| `apps/web/src/entities/listing/ui/location.tsx`            | Manzil ostiga xarita                             |
| `apps/web/src/features/listing-filters/model/criteria.ts`  | `NEAR` saralash                                  |
| `apps/web/src/features/listing-filters/ui/sort-select.tsx` | "Yaqin" tugmasi                                  |
| `apps/web/src/pages/home/ui/home-page.tsx`                 | Ochiq xarita holati, saralashga nuqta uzatish    |
| `apps/web/src/pages/search/ui/search-page.tsx`             | Xuddi shu                                        |
| `apps/web/src/pages/listing/ui/listing-page.tsx`           | `Location` ga koordinatalarni uzatish            |
| `apps/web/src/widgets/site-header/ui/site-header.tsx`      | "Toshkent" yorlig'i o'rniga `LocationChip`       |
| `apps/web/src/app/root-layout.tsx`                         | Avtomatik aniqlashni bir marta ishga tushirish   |
| `apps/web/.env.example`                                    | `VITE_YANDEX_MAPS_KEY`                           |
| `apps/api/prisma/seed.ts`                                  | `upsert` ga `lat`/`lng` uzatish                  |
| `apps/web/src/entities/listing/index.ts`                   | `distanceLabel` eksporti                         |
| `apps/api/test/listings.e2e-spec.ts`                       | Koordinatalar uchun qo'shimcha holat             |
| `docs/project-overview.md`                                 | Yangi funksiyalar ro'yxati                       |
| Web test fixture'lari                                      | `lat`/`lng` maydonlari (ma'nosi o'zgarmaydi)     |

Boshqa mavjud fayl o'zgartirilmaydi. `root-layout.tsx` ro'yxatda qolgan, lekin amalda
tegilmaydi: avtomatik aniqlash `LocationChip` ichida turadi (reja, Task 7 dagi izoh).

---

## 4. Ma'lumotlar modeli

```prisma
model Listing {
  // ... mavjud maydonlar tegilmaydi ...
  /// WGS84. NULLable: koordinatasiz e'lon ham ko'rinishda davom etadi, va
  /// 2-bosqichda rieltor nuqta qo'ymasdan qoralama saqlay oladi.
  lat Float?
  lng Float?
}
```

`ListingSummarySchema` ikkita maydon oladi (`lat: z.number().nullable()`, `lng: z.number().nullable()`), u yerdan `ListingDetailSchema` ga o'tadi — ya'ni karta ham, obyekt sahifasi ham bir manbadan oladi.

Koordinatalar `seed-data.ts` ga qo'lda kiritiladi: har bir e'lonning `address` va `district` maydoniga qarab xaritadan olinadi. Aniqlik — uy yoki turar-joy majmuasi darajasida.

---

## 5. Geo-mantiq

`packages/shared/src/geo.ts`, hech qanday tashqi API'siz:

- `distanceKm(a: Point, b: Point): number` — haversine formulasi
- `formatDistance(km: number): string` — 1 km dan kam bo'lsa `"850 m"`, aks holda bir kasrli `"2.4 km"`
- `TASHKENT_DISTRICTS` — 9 ta tuman nomi va markaziy nuqtasi
- `nearestDistrict(point: Point): string` — nuqtaga eng yaqin tuman nomi

Oxirgisi header'da tuman nomini ko'rsatish uchun. **Yandex geokoderi ishlatilmaydi:** qo'shimcha kalit, kvota va tarmoq so'rovi o'rniga 9 qatorlik jadval yetarli, u sof funksiya bo'lgani uchun testlanadi va oflaynda ham ishlaydi.

Saralash `filterListings` ichida qoladi — u hozir ham lenta va qidiruv hisoblagichi uchun yagona manba. Unga ixtiyoriy `origin` argumenti qo'shiladi; `sort === 'NEAR'` bo'lganda masofa bo'yicha, `origin` yo'q bo'lsa mavjud `NEW` tartibiga qaytadi.

---

## 6. Foydalanuvchi joylashuvi

```ts
UserLocation = { lat: number; lng: number; label: string; source: 'gps' | 'manual' }
```

`localStorage` da saqlanadi (sevimlilar va qidiruv tarixi kabi) — **serverga yuborilmaydi**.

**Avtomatik aniqlash.** Ilova yuklanib, birinchi render tugagandan keyin: saqlangan qiymat bo'lsa o'sha ishlatiladi va hech nima so'ralmaydi; bo'lmasa `navigator.geolocation.getCurrentPosition` chaqiriladi (yuqori aniqlik talab qilinmaydi, taymaut bilan). Muvaffaqiyatda nuqta va `nearestDistrict` nomi saqlanadi.

Rad etish yoki xato — `denied` holati: qayta so'ralmaydi, header'da "Joyni tanlash" turadi. Brauzer geolokatsiyani faqat xavfsiz kontekstda beradi; prod HTTPS'da, lokal `localhost` da ishlaydi.

**Qo'lda tanlash.** Header yorlig'i bosilganda oyna ochiladi: interaktiv Yandex xaritasi, markazda qo'zg'almas pin, "Meni topish" va "Shu yerni tanlash" tugmalari. Tanlangach nuqta `source: 'manual'` bilan saqlanadi.

---

## 7. UI o'zgarishlari

| Joy           | O'zgarish                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Header        | Statik "Toshkent" o'rniga aniqlangan tuman nomi; bosilsa tanlash oynasi                          |
| Saralash      | "Yangi · Arzon · Qimmat" qatoriga **"Yaqin"**; joy noma'lum bo'lsa bosilganda aniqlash so'raladi |
| E'lon kartasi | Joylashuv ikonkasi; bosilsa karta ichida statik xarita ochiladi                                  |
| E'lon kartasi | Ikkala koordinata ma'lum bo'lsa masofa belgisi (`"2.4 km"`)                                      |
| `/obj/:id`    | Manzil va "Mo'ljal" matni qoladi, ostiga statik xarita                                           |

**Bir vaqtda bitta xarita.** Qaysi karta ochiqligi sahifa holatida turadi (`openMapId`), kartaning o'zida emas: karta `mapOpen` va `onToggleMap` proplarini oladi. Shu tufayli 360px ekranda bir nechta xarita ochilib qolmaydi va karta komponenti holatsiz qolaveradi.

**FSD chegarasi.** `listing-card` va `location` — `entities` qatlamida, ya'ni ular `features/user-location` dan **import qila olmaydi** (ESLint `boundaries` buni majburlaydi). Ularga masofa va koordinatalar faqat prop sifatida yuqoridan tushadi, xaritani esa `shared/ui/static-map` chizadi. Foydalanuvchi nuqtasini biladigan yagona joy — sahifalar va header.

---

## 8. Degradatsiya

| Holat                                     | Xulq                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `VITE_YANDEX_MAPS_KEY` yo'q               | Xaritalar chizilmaydi, matnli manzil qoladi, masofa bo'yicha saralash ishlayveradi |
| Geolokatsiya rad etilgan yoki mavjud emas | Qo'lda tanlash taklif qilinadi; lenta `NEW` tartibida qoladi                       |
| E'londa koordinata yo'q                   | O'sha kartada ikonka ko'rinmaydi, obyekt sahifasida xarita yo'q                    |
| Yandex skripti yuklanmadi                 | Tanlash oynasida tushunarli xabar; sahifa buzilmaydi                               |

Kalit build vaqtida kerak bo'lgani uchun Netlify'ning muhit o'zgaruvchilariga qo'yiladi; `netlify.toml` ga yozilmaydi.

---

## 9. Testlar

**Sof mantiq:** `distanceKm` ma'lum masofalarga qarshi (Toshkent ichidagi ikki nuqta), `formatDistance` chegaralari (999 m / 1 km / 10 km), `nearestDistrict` har bir tuman markazi va chegaraga yaqin nuqta uchun.

**Frontend:** kartadagi ikonka xaritani ochadi va yopadi; bir vaqtda bitta karta ochiq qoladi; `NEAR` saralash tartibi; `localStorage` dan tiklash va rad etilgan holat; kalitsiz `StaticMap` hech nima chizmaydi.

**Backend:** `GET /api/objects` javobida `lat`/`lng` bor va sxemaga mos.

**Playwright:** brauzer kontekstiga geolokatsiya berilib, "Yaqin" saralash lentani haqiqatan qayta tartiblashi va masofa belgisi chiqishi tekshiriladi; kalitsiz holatda sahifa avvalgidek ochilishi tekshiriladi.

**Regressiya to'ri:** mavjud testlar o'zgarmaydi; `GET /api/objects` javob shakli va anonim foydalanuvchi tajribasi qo'riqchi testlar bilan qoplangan holicha qoladi.

---

## 10. Scope'dan tashqarida

Qurilmaydi va taklif ham qilinmaydi: marshrut qurish va yo'nalish ko'rsatish · xaritada klasterlash · xaritada hudud chizib qidirish · server tomonidagi geo-so'rovlar va geo-indekslar · Yandex geokoderi (manzildan koordinata) · radius bo'yicha filtrlash · boshqa shaharlar va tumanlar jadvalini kengaytirish · rieltor formasidagi nuqta tanlash (2-bosqichning ishi, lekin shu yerdagi tanlash oynasini qayta ishlatadi).

---

## 11. DoD

- [ ] Sayt ochilganda joylashuv so'raladi; ruxsat berilsa header'da tuman nomi chiqadi
- [ ] "Yaqin" saralash lentani masofa bo'yicha qayta tartiblaydi va kartalarda masofa ko'rinadi
- [ ] Kartadagi ikonka bosilganda karta ichida xarita ochiladi, bir vaqtda faqat bittasi
- [ ] Obyekt sahifasida manzil ostida xarita bor
- [ ] Header yorlig'i orqali joyni xaritadan qo'lda tanlash ishlaydi va saqlanadi
- [ ] Kalitsiz va geolokatsiyasiz holatda sayt avvalgidek ishlaydi
- [ ] Lighthouse mobile ≥ 90 saqlangan

---

## 12. Risklar

| Risk                                                     | Qanday yopiladi                                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Yandex kaliti olinmaguncha xaritalar ko'rinmaydi         | Kalitsiz degradatsiya boshidan quriladi; kalit keyin qo'yiladi                                |
| Qo'lda kiritilgan koordinata noto'g'ri joyni ko'rsatishi | Har bir nuqta manzil bo'yicha tekshiriladi; xato topilsa seed'da bitta qator tuzatiladi       |
| Statik xarita rasmi mobil trafikda sekin bo'lishi        | Rasm faqat karta ochilganda so'raladi (`loading="lazy"`), o'lchami ekran kengligiga moslanadi |
| Geolokatsiyani ko'pchilik rad etishi                     | Qo'lda tanlash birinchi darajali yo'l sifatida qoladi, avtomatik aniqlash — qulaylik          |
