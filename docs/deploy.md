# Deploy yo'riqnomasi (Neon + Railway)

Bu hujjat "Rieltor Generator" ilovasini Neon (Postgres) va Railway (hosting)
ustida ishga tushirish uchun to'liq ketma-ketlikni tavsiflaydi. Loyiha bitta
Docker imiji sifatida ishlaydi (Task 15): konteyner har ishga tushishda
migratsiyalarni bajaradi, bazani seed qiladi (rasmlarni qayta generatsiya
qilib) va API + build qilingan SPA + rasmlarni bitta NestJS jarayonidan
xizmat qiladi.

> Steps 5, 6, 8, 9, 10, 11 (haqiqiy Neon/Railway hisoblarini yaratish, jonli
> URL'da Telegram preview va Lighthouse sinovlari) shaxsiy hisob va
> telefon/Telegram talab qiladi — bu hujjat faqat yo'riqnoma sifatida
> yozilgan, ijro etilmagan.

## 1. Neon Postgres yaratish

1. [neon.tech](https://neon.tech) saytida ro'yxatdan o't (yoki kir) va yangi
   bepul loyiha (project) yarat.
2. Region sifatida eng yaqinini tanla — odatda **Europe** (Frankfurt yoki
   shunga o'xshash).
3. Loyiha yaratilgach, Neon konsolida **Connection Details** (yoki
   **Connection string**) bo'limiga o'tib, to'liq ulanish satrini nusxa ol.
   U quyidagi shaklda bo'ladi:

   ```
   postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
   ```

   Muhim: oxiridagi `?sslmode=require` qismini saqlab qol — Neon SSL'siz
   ulanishni qabul qilmaydi.

## 2. Railway'ga deploy

1. [railway.app](https://railway.app) da GitHub bilan kir, **New Project →
   Deploy from GitHub repo** ni tanla va shu repozitoriyni ko'rsat. Railway
   ildizdagi `Dockerfile`'ni avtomatik topib, undan build qiladi — qo'shimcha
   sozlash shart emas.
2. Servis yaratilgach, **Variables** bo'limiga quyidagi to'rtta o'zgaruvchini
   qo'sh:

   | O'zgaruvchi       | Qiymat                                                 |
   | ----------------- | ------------------------------------------------------ |
   | `DATABASE_URL`    | Neon'dan olingan connection string (yuqoridagi)        |
   | `PUBLIC_BASE_URL` | `https://<railway-domen>` (pastga qara — 2 bosqich)    |
   | `SEED_AGENT_TEL`  | Rieltorning haqiqiy telefon raqami, `+998...` shaklida |
   | `SEED_AGENT_TG`   | Rieltorning Telegram username'i (`@`siz)               |

   `PORT` o'zgaruvchisini qo'shish shart emas — konteyner standart bo'yicha
   `3000` portda tinglaydi va Railway buni avtomatik aniqlaydi. Agar Railway
   boshqa port talab qilsa, `PORT=3000` ni qo'lda qo'sh.

3. **Replica count — 1 da qoldir.** Konteyner har ishga tushishda
   `prisma migrate deploy` dan keyin `seed.ts` ni ishga tushiradi, u esa
   rasm qatorlarini o'chirib qaytadan yaratadi (delete + recreate). Agar bir
   vaqtda ikkita replika ko'tarilsa, ikkalasi ham seed'ni parallel ishga
   tushirib, bir-birining yozuvlarini poyga holatida (race condition)
   buzishi mumkin. Railway'ning **Settings → Replicas** bo'limida bu qiymat
   doim `1` bo'lishi kerak.

### 2.1. `PUBLIC_BASE_URL` — majburiy ikki bosqichli ketma-ketlik

`PUBLIC_BASE_URL` `og:image` uchun **absolyut** URL qurishda ishlatiladi
(masalan, `https://<domen>/images/bx-001/og.jpg`). Muammo shundaki, Railway
domeni birinchi deploy tugagunga qadar noma'lum — shuning uchun bir marta
deploy qilib, keyin domenni bilib, o'zgaruvchini to'g'rilab, qayta deploy
qilish kerak:

1. **Birinchi deploy.** `PUBLIC_BASE_URL` ni vaqtincha bo'sh yoki taxminiy
   qoldirib (yoki umuman qo'ymasdan) birinchi marta deploy qil.
2. Deploy tugagach, Railway **Settings → Networking** bo'limida generatsiya
   qilingan domenni (`https://<nimadir>.up.railway.app` yoki custom domen)
   o'qi.
3. `PUBLIC_BASE_URL` o'zgaruvchisini shu haqiqiy domen bilan to'ldir
   (`https://<railway-domen>`, oxirida `/` siz).
4. **Qayta deploy qil.** Bu qadamni o'tkazib yubormaslik kerak: konteyner
   seed vaqtida `og:image`ni shu env qiymati asosida yozadi. Agar
   `PUBLIC_BASE_URL` noto'g'ri (yoki bo'sh/nisbiy) qolib ketsa, `og:image`
   nisbiy yo'l bo'lib qoladi va Telegram (hamda boshqa ijtimoiy tarmoqlar)
   rasmni sira ko'rsatmaydi — chunki ular absolyut URL kutadi.

### 2.2. Deploy tugagach tekshirish

```bash
curl -s https://<domen>/api/health
curl -s https://<domen>/obj/bx-001 | grep -E 'og:(title|image)'
```

Ikkinchi buyruq `og:image content="https://<domen>/..."` ko'rinishida
absolyut URL qaytarishi kerak.

## 3. Kontakt ma'lumotlarini o'zgartirish

Rieltorning telefon raqami yoki Telegram username'ini keyinchalik
yangilash kerak bo'lsa:

1. Railway'da **Variables** bo'limida `SEED_AGENT_TEL` va/yoki
   `SEED_AGENT_TG` qiymatlarini yangila.
2. Servisni qayta deploy qil (yoki Railway o'zi variable o'zgarganda avtomatik
   qayta ishga tushiradi — loyiha sozlamasiga qarab).
3. Qayta ishga tushishda konteyner seed'ni qayta bajaradi va yangi kontakt
   barcha uchta obyektga (bx-001, bx-002, bx-003) yoziladi — qo'shimcha
   kod o'zgarishi shart emas.

## 4. Rasmlarni almashtirish

Placeholder rasmlarni haqiqiy fotosuratlarga almashtirish uchun:

1. Har bir obyekt uchun rasm fayllarini `apps/api/prisma/seed-images/<id>/`
   papkasiga qo'y (masalan, `apps/api/prisma/seed-images/bx-001/01.jpg`,
   `02.jpg`, ... — fayllar nomi bo'yicha tartiblanadi, shuning uchun
   `01`, `02`, ... kabi prefiks tavsiya etiladi). `.jpg`, `.jpeg`, `.png`,
   `.webp` formatlari qo'llab-quvvatlanadi.
2. Fayllarni git'ga commit qil va push qil.
3. Railway avtomatik (yoki qo'lda) qayta deploy qiladi. Boot vaqtida seed
   shu papkadagi fayllarni topib, ularni kerakli o'lchamlarga (`IMAGE_SIZES`)
   qayta generatsiya qiladi va bazadagi eski rasm qatorlarini yangilari bilan
   almashtiradi.
4. Agar papka bo'sh bo'lib qolsa (yoki fayl topilmasa), seed avtomatik
   placeholder rasm generatsiya qiladi — xatolik bermaydi.

## 5. Telegram preview keshi haqida eslatma

Telegram Open Graph preview'larni juda qattiq keshlaydi — rasm yoki
sarlavhani to'g'rilagandan keyin ham eski (noto'g'ri) preview ko'rinishi
mumkin. Buni yangilash uchun:

1. Telegram'da `@WebpageBot` botiga o'tib, tuzatilgan URL'ni yubor.
2. Bot keshni yangilaydi. Shundan keyin URL'ni qayta (masalan, Saved
   Messages'ga) yuborib, yangi preview to'g'ri ko'rinayotganini tekshir.

## 6. Muhim eslatma: replika soni

Yuqorida aytilganidek, konteyner **har boot'da** `prisma migrate deploy`
dan so'ng seed'ni ishga tushiradi, seed esa rasm qatorlarini o'chirib
qaytadan yaratadi. Shu sababli Railway'da bu servis uchun **replica count
doim 1 bo'lishi shart** — parallel ikkita boot bir-birining seed
operatsiyasi bilan poyga holatiga tushib, ma'lumotlar bazasini nomuvofiq
holatga keltirishi mumkin.

## DoD (Definition of Done) — mahalliy tekshiruv holati

Quyidagi ro'yxat spec §14'dan olingan. Ushbu task (16A) doirasida faqat
lokal `docker compose` stack orqali tekshirilishi mumkin bo'lgan
punktlarni belgilaymiz; qolganlari jonli (public) Railway URL, real
telefon/Telegram va Lighthouse audit talab qiladi va Task 16B (yoki loyiha
egasi) tomonidan bajarilishi kerak.

- [ ] 3 sahifa jonli URL'da ochiladi — **tekshirilmagan**, jonli domen kerak.
- [ ] Galereya real telefonda svayp ishlaydi — **tekshirilmagan**, real
      qurilma kerak (E2E'da svayp o'rniga nuqtaga bosish bilan ekvivalent
      xatti-harakat tasdiqlangan, bu haqiqiy svayp emas).
- [x] `tel:` raqam teradi, `t.me` chat ochadi — CTA havolalarining **shakli**
      (`^tel:\+998\d+$`, `^https://t\.me/[\w_]+$`) E2E orqali lokal stack'da
      tasdiqlangan. Haqiqiy telefon/qurilmada ochilishini tekshirish jonli
      domen va real qurilma talab qiladi.
- [ ] Telegram preview: rasm + sarlavha + narx — **tekshirilmagan**, jonli
      domen va Telegram'ning o'zi kerak (Task 16B qamrovida).
- [ ] Hisoblagich 2 qurilmadan oshadi, refreshda oshmaydi — **tekshirilmagan**,
      ikkita real qurilma/brauzer profili kerak. (E2E faqat hisoblagich
      ko'rinishini tasdiqlaydi, ko'paytirish mantig'ini emas.)
- [ ] Lighthouse mobile ≥ 90, LCP < 2.5s — **tekshirilmagan**, jonli domen
      kerak (lokal Docker konteynerda o'lchash Railway'ning tarmoq/sovuq
      start sharoitlarini aks ettirmaydi).
- [x] Noto'g'ri id → 404 — E2E orqali lokal stack'da tasdiqlangan: `/obj/yoq-000`
      HTTP 404 qaytaradi va "Bunday obyekt topilmadi" matni ko'rinadi.
- [ ] CI yashil — `.github/workflows/ci.yml` ga `e2e` job qo'shildi va
      mantiqi mahalliy `docker compose` stack'da tekshirildi (8/8 test
      o'tdi), lekin GitHub Actions'da haqiqiy ishga tushirilishi (push/PR
      orqali) hali tasdiqlanmagan — bu Task 16B yoki keyingi push'da
      tekshiriladi.
