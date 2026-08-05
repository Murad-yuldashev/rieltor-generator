# Deploy yo'riqnomasi (Netlify + Neon)

Bu hujjat "Rieltor Generator" ni Netlify'da ishga tushirishni tavsiflaydi.
Railway varianti uchun [deploy.md](deploy.md) ga qara — ikkalasi bir vaqtda
yashab tura oladi, birortasi ikkinchisini o'chirmaydi.

## Netlify'da bu ilova qanday ishlaydi

Lokalda (`docker compose up`) bitta NestJS jarayoni hamma narsani beradi: API,
SSR shell, rasmlar va SPA bundle. Netlify'da doimiy ishlab turadigan jarayon
yo'q, shuning uchun mas'uliyat ikkiga bo'lingan — lekin **tashqaridan ko'rinish
bir xil qoladi**:

| So'rov                                             | Lokalda          | Netlify'da                                    |
| -------------------------------------------------- | ---------------- | --------------------------------------------- |
| `/assets/*`, `/images/*`                           | Express static   | CDN (publish katalogidan)                     |
| `/`, `/search`, `/favorites`, `/contact`, `/offer` | SsrController    | CDN, `index.html` 200 status bilan            |
| `/obj/:id`                                         | SsrController    | Function (OG teglari bazadan inject qilinadi) |
| `/api/*`                                           | Nest controllers | Function                                      |
| boshqa har qanday yo'l                             | 404 + shell      | CDN, `index.html` **404** status bilan        |

Function — bu o'sha NestJS ilovasining o'zi ([netlify/functions/api.js](../netlify/functions/api.js)),
`serverless-http` orqali o'ralgan. Ilova [create-app.ts](../apps/api/src/create-app.ts)
da quriladi, uni `main.ts` ham ishlatadi — ya'ni ikkala runtime bitta manbadan
yig'iladi va bir-biridan uzoqlashib keta olmaydi.

Migratsiya va seed **build vaqtida** bajariladi (Docker'da esa konteyner
ko'tarilganda). Rasmlar shu paytda `sharp` bilan generatsiya qilinib, publish
katalogiga ko'chiriladi.

## 1. Neon Postgres yaratish

Netlify'da baza yo'q, shuning uchun Postgres tashqarida bo'lishi shart.

1. [neon.tech](https://neon.tech) da bepul loyiha yarat, region — Europe.
2. **Connection string** ni nusxa ol. Oxiridagi `?sslmode=require` saqlanib
   qolsin.
3. **Pooled** (pgbouncer) ulanish satrini ol — Neon konsolida "Pooled
   connection" belgisi bor. Har bir function nusxasi o'zining ulanishini
   ochadi, shuning uchun to'g'ridan-to'g'ri (unpooled) satr yuklama ostida
   `too many connections` ga olib keladi.

## 2. Netlify saytini yaratish

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project** → GitHub → shu repozitoriy.
2. Netlify monorepo'ni sezib, qaysi paketni build qilishni so'rashi mumkin.
   **Hech qaysi paketni tanlama** — base directory bo'sh (repo ildizi) qolsin.
   Build buyrug'i, publish katalogi va function sozlamalari ildizdagi
   [netlify.toml](../netlify.toml) dan olinadi, UI'da qo'lda hech narsa
   yozish shart emas.
3. **Environment variables** bo'limiga to'rtta o'zgaruvchini qo'sh:

   | O'zgaruvchi       | Qiymat                                                | Kerak bo'ladigan joy |
   | ----------------- | ----------------------------------------------------- | -------------------- |
   | `DATABASE_URL`    | Neon'ning pooled connection string'i                  | build + function     |
   | `SEED_AGENT_TEL`  | Rieltorning telefon raqami, `+998...` shaklida        | build                |
   | `SEED_AGENT_TG`   | Rieltorning Telegram username'i (`@` siz)             | build                |
   | `PUBLIC_BASE_URL` | Ixtiyoriy — faqat custom domen uchun, oxirida `/` siz | function             |

   `PUBLIC_BASE_URL` ni qo'ymasang, function Netlify o'zi beradigan `URL`
   o'zgaruvchisiga tushadi (`https://<sayt-nomi>.netlify.app`). Ya'ni Railway
   yo'riqnomasidagi "deploy qil → domenni bil → o'zgaruvchini to'g'rila →
   qayta deploy qil" zanjiri bu yerda kerak emas. Custom domen ulaganingdan
   keyin esa uni qo'lda yozib qo'yish shart — `og:image` absolyut URL talab
   qiladi.

4. **Deploy site** ni bos.

## 3. Deploy tugagach tekshirish

```bash
curl -s https://<domen>/api/health                       # {"status":"ok","db":true}
curl -s -o /dev/null -w '%{http_code}\n' https://<domen>/obj/yoq-000   # 404
curl -s https://<domen>/obj/bx-001 | grep -E 'og:(title|image)'
```

Oxirgi buyruq `og:image content="https://<domen>/images/bx-001/og.jpg"`
ko'rinishidagi **absolyut** URL qaytarishi kerak — Telegram nisbiy yo'lni
kuzatmaydi.

To'liq tekshiruv uchun e2e to'plamini jonli domenga qarshi ham yuritish
mumkin:

```bash
E2E_BASE_URL=https://<domen> yarn e2e
```

## 4. Lokalda Netlify muhitini sinash

Deploy qilmasdan turib xuddi shu konfiguratsiyani tekshirish mumkin:

```bash
# 1. Build (Neon o'rniga lokal Postgres bilan)
DATABASE_URL=postgresql://rieltor:rieltor@localhost:5432/rieltor \
SEED_AGENT_TEL=+998901234567 SEED_AGENT_TG=username \
  bash scripts/netlify-build.sh

# 2. Netlify dev serveri
DATABASE_URL=postgresql://rieltor:rieltor@localhost:5432/rieltor \
URL=http://localhost:8888 \
  npx netlify-cli dev --offline --dir netlify/publish \
    --functions netlify/functions --port 8888

# 3. Testlar
E2E_BASE_URL=http://localhost:8888 yarn e2e
```

`netlify dev` monorepo'da qaysi paketni tanlashni so'rasa, buyruqni repo
ildizidan **tashqarida** turib `--cwd <repo-yo'li>` bilan ishga tushir — CLI
faqat shunda so'rovni o'tkazib yuboradi.

## 5. Kontakt ma'lumotlarini yoki rasmlarni almashtirish

Seed build vaqtida ishlaydi, shuning uchun ikkala holatda ham **qayta deploy
kerak**:

- **Kontakt:** Netlify'da `SEED_AGENT_TEL` / `SEED_AGENT_TG` ni yangila va
  **Deploys → Trigger deploy → Deploy site** ni bos.
- **Rasmlar:** fayllarni `apps/api/prisma/seed-images/<id>/` ga qo'y
  (`01.jpg`, `02.jpg`, … — nom bo'yicha tartiblanadi), commit qilib push qil.
  Netlify avtomatik qayta deploy qiladi. Papka bo'sh bo'lsa, seed placeholder
  generatsiya qiladi.

## 6. Netlify'ga xos farqlar

Lokal muhitdan farq qiladigan, lekin ilova xatti-harakatiga ta'sir qiladigan
uchta narsa:

1. **Ko'rishlar hisoblagichining IP-limiti.** `ViewsService` "bir IP bir
   obyektni 10 daqiqada bir marta oshiradi" qoidasini xotiradagi `Map` da
   saqlaydi. Lokalda jarayon bitta, Netlify'da esa bir vaqtda bir nechta
   function nusxasi ishlashi mumkin va ularning xotirasi umumiy emas. Ya'ni
   yuklama ostida bitta tashrifchi shu oyna ichida bir necha marta
   sanalishi mumkin. Bazadagi `increment` o'zi atomar, ya'ni hisob buzilmaydi
   — faqat limit yumshoqroq ishlaydi.

2. **Sovuq start.** Uzoq vaqt so'rov bo'lmasa, birinchi `/obj/:id` yoki
   `/api/*` so'rovi Nest'ni ko'taradi — taxminan 1–2 soniya. Keyingilari
   issiq nusxadan ~50 ms da javob qaytaradi. Statik sahifalar (`/`, `/search`
   va h.k.) va rasmlar CDN'dan kelgani uchun bunga umuman bog'liq emas.

3. **Migratsiya build'da bajariladi.** Ikkita deploy parallel ketsa, ikkalasi
   ham seed'ni ishga tushiradi (seed rasm qatorlarini o'chirib qaytadan
   yaratadi). Bir vaqtning o'zida ikkita deploy'ni boshlama.

## 7. Function paketi qanday yig'iladi (nega netlify.toml shunday)

Bu qism odatda tegishi shart emas, lekin biror narsa buzilsa — sabab shu
yerda:

- **`node_bundler = "nft"`.** NestJS optional peer'larini `try/catch` ichida
  `require()` qiladi; esbuild ularni build vaqtida topa olmay yiqiladi, nft
  esa yo'qlarini shunchaki tashlab ketadi.
- **`require('@nestjs/platform-express')`** function faylida ataylab turibdi.
  `NestFactory` HTTP adapterni o'z runtime `require()` i orqali yuklaydi va
  `create-app.ts` bu paketni faqat tip sifatida import qiladi — ya'ni tracer
  uchun unga hech qanday havola yo'q. Bu qator bo'lmasa paket arxivga
  tushmaydi va ilova "No driver (HTTP) has been selected" bilan qulaydi.
- **`binaryTargets = ["native", "rhel-openssl-3.0.x"]`** (schema.prisma).
  Netlify Functions — AWS Lambda, ya'ni Amazon Linux; build hosti esa Ubuntu.
  Ikkita engine ikki xil, va Lambda'dagisi aynan RHEL'niki.
- **`module-sync` paketlari.** `async-function` va shu oiladagi bir nechta
  mayda paket `require()` uchun alohida fayl e'lon qiladi; tracer boshqasini
  tanlaydi va Node yuklaydigan fayl arxivga tushmay qoladi. Ular
  `included_files` da qo'lda sanab o'tilgan. Yangi bog'liqlik qo'shilganda
  ro'yxatni tekshirish uchun:

  ```bash
  grep -l '"module-sync"' node_modules/*/package.json
  ```

- **`!` bilan boshlanuvchi qatorlar.** Tracer `bootstrap.ts` dagi `__dirname`
  birikmalarini ko'rib butun papkalarni tortib keladi — natijada arxivga
  function hech qachon ochmaydigan ~33 MB tushadi (rasmlar CDN'dan beriladi,
  build hostining Prisma engine'i esa Lambda'da yaroqsiz). Netlify limiti —
  50 MB (zip). Hozirgi arxiv ~12 MB.
