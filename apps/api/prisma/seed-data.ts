import type { ListingType } from '@prisma/client';

export interface SeedListing {
  id: string;
  title: string;
  priceSom: bigint;
  priceUsd: number;
  rooms: number;
  areaM2: number;
  floor: string | null;
  district: string;
  address: string;
  landmark: string;
  description: string;
  type: ListingType;
  listedAt: string;
  placeholderCount: number;
}

/**
 * Ten listings taken from Tashkent adverts on OLX.uz (2026-08).
 * Price, area, floor and photos come from the source advert; the copy was
 * translated into Uzbek.
 *
 * Prices use the OLX rate of 11,936.6 so'm/$, which is why `priceUsd` has to be
 * a multiple of ten — otherwise the so'm amount would not come out whole.
 */
export const SEED_LISTINGS: SeedListing[] = [
  {
    id: 'bx-001',
    title: '3 xonali kvartira, Kashtan majmuasi, Yunusobod-10',
    priceSom: 859_435_200n,
    priceUsd: 72_000,
    rooms: 3,
    areaM2: 72,
    floor: '7/7',
    district: 'Yunusobod tumani',
    address: 'Kashtan turar-joy majmuasi, Yunusobod 10-kvartal',
    landmark: "265-maktab va so'nggi bekat yaqinida",
    description:
      "Yunusobod 10-kvartalidagi Kashtan turar-joy majmuasida uch xonali kvartira sotiladi. Umumiy maydoni 72 m², g'isht binoning 7-qavatida joylashgan (mansarda emas). Kvartira quti holatida topshiriladi — ta'mirni o'z didingizga qarab qilasiz. Balkon bor, undan Teleminora manzarasi ochiladi. Yaqin atrofda maktab, bolalar bog'chasi, Korzinka va masjid joylashgan.",
    type: 'NEW_BUILD',
    listedAt: '2026-07-26',
    placeholderCount: 6,
  },
  {
    id: 'bx-002',
    title: "3 xonali kvartira, 95 m², Nukus ko'chasi",
    priceSom: 1_420_455_400n,
    priceUsd: 119_000,
    rooms: 3,
    areaM2: 95,
    floor: '5/9',
    district: 'Mirobod tumani',
    address: "Nukus ko'chasi, 9 qavatli bino",
    landmark: 'Makro savdo markazi yaqinida',
    description:
      "Mirobod tumanidagi Nukus ko'chasida uch xonali kvartira sotiladi. Umumiy maydoni 95 m², to'qqiz qavatli binoning 5-qavatida joylashgan. Ta'mir o'rta holatda — yashash uchun tayyor. Balkon va alohida oshxona bor, mebelning bir qismi kvartira bilan qoladi. Orientir sifatida Makro savdo markazi xizmat qiladi, atrofda maktab va bekat yaqin.",
    type: 'SECONDARY',
    listedAt: '2026-08-04',
    placeholderCount: 6,
  },
  {
    id: 'bx-003',
    title: '5 xonali burchak hovli uy, 3 sotix, Olmos mahallasi',
    priceSom: 1_790_490_000n,
    priceUsd: 150_000,
    rooms: 5,
    areaM2: 300,
    floor: null,
    district: 'Yashnobod tumani',
    address: 'Olmos mahallasi, burchak uchastka',
    landmark: 'Mahalla markazi va maktab yaqinida',
    description:
      "Yashnobod tumani Olmos mahallasida yangi qurilgan burchak hovli uy sotiladi. Yer maydoni 3 sotix, uyning umumiy maydoni 300 m². Beshta xona, alohida oshxona, yerto'la va to'rtta sanuzel mavjud. Uy jihozlari bilan birga sotiladi — ko'chib kirib yashash mumkin. Burchak uchastka bo'lgani uchun ikki tomondan kirish imkoni bor.",
    type: 'HOUSE',
    listedAt: '2026-02-07',
    placeholderCount: 6,
  },
  {
    id: 'bx-004',
    title: "3 xonali kvartira, yevro ta'mir, Chilonzor-1",
    priceSom: 1_668_736_680n,
    priceUsd: 139_800,
    rooms: 3,
    areaM2: 87,
    floor: '3/4',
    district: 'Chilonzor tumani',
    address: "Chilonzor-1 kvartali, Muqimiy ko'chasi",
    landmark: 'Pionerskiy va Oq Saroy restorani yaqinida',
    description:
      "Chilonzor-1 kvartalida uch xonali kvartira sotiladi. Umumiy maydoni 87 m², to'rt qavatli binoning 3-qavatida joylashgan, shiftlari baland. Kvartirada yevro ta'mir qilingan, mebel va maishiy texnika bilan birga topshiriladi. Orientir: Pionerskiy, Oq Saroy restorani, Muqimiy ko'chasi. Chilonzor metro bekati va bozor yaqin.",
    type: 'SECONDARY',
    listedAt: '2026-07-14',
    placeholderCount: 6,
  },
  {
    id: 'bx-005',
    title: "2 xonali kvartira yangi binoda, Nurafshon ko'chasi",
    priceSom: 907_181_600n,
    priceUsd: 76_000,
    rooms: 2,
    areaM2: 45.23,
    floor: '11/11',
    district: 'Shayxontohur tumani',
    address: "Nurafshon ko'chasi, 50-uy",
    landmark: "Riviera savdo markazi ro'parasida",
    description:
      "Shayxontohur tumanidagi Nurafshon ko'chasida yangi binoda ikki xonali kvartira sotiladi. Umumiy maydoni 45.23 m², 11 qavatli binoning 11-qavatida, shift balandligi 3.3 m. Kadastr va gaz ulangan. Yangi yevro ta'mir: mebel, idish-tovoq va texnika (2 ta konditsioner, muzlatgich, televizor, pishirish paneli, so'rg'ich, kir yuvish mashinasi, duxovka, kotyol va boyler) qoladi. Issiq pol o'rnatilgan.",
    type: 'NEW_BUILD',
    listedAt: '2026-07-21',
    placeholderCount: 6,
  },
  {
    id: 'bx-006',
    title: '2 xonali kvartira, Darhan Residence, yevro lyuks',
    priceSom: 1_372_709_000n,
    priceUsd: 115_000,
    rooms: 2,
    areaM2: 50,
    floor: '2/12',
    district: "Mirzo Ulug'bek tumani",
    address: 'Darhan Residence turar-joy majmuasi',
    landmark: "Darhan, Novomoskovskaya ko'chasi yaqinida",
    description:
      "Mirzo Ulug'bek tumanidagi Darhan Residence majmuasida ikki xonali kvartira sotiladi. Umumiy maydoni 50 m², 12 qavatli binoning 2-qavatida joylashgan. Yevro lyuks ta'mir qilingan, mebel va maishiy texnika bilan topshiriladi, kadastri tayyor. Majmuada yopiq hovli va yer osti avtoturargohi bor, kvartiraning ochiq terrassasi mavjud.",
    type: 'NEW_BUILD',
    listedAt: '2026-08-02',
    placeholderCount: 6,
  },
  {
    id: 'bx-007',
    title: '3 xonali kvartira, Salamatina majmuasi, Yakkasaroy',
    priceSom: 1_098_167_200n,
    priceUsd: 92_000,
    rooms: 3,
    areaM2: 61.43,
    floor: '10/11',
    district: 'Yakkasaroy tumani',
    address: "Bog'ibo'ston ko'chasi, Salamatina turar-joy majmuasi",
    landmark: 'Yakkasaroy masjidi va Birodarlar qabri yodgorligi yaqinida',
    description:
      "Yakkasaroy masjidi yonidagi Salamatina turar-joy majmuasida kvartira sotiladi. Bog'ibo'ston ko'chasi bilan Yakkasaroy ko'chasi kesishmasida, Kichik Halqa Yo'liga yaqin. Umumiy maydoni 61.43 m², 11 qavatli g'isht binoning 10-qavatida. Ikki xonali kvartira sifatli yevro ta'mirdan so'ng uch xonaga aylantirilgan, yangi mebel, idish-tovoq va maishiy texnika bilan jihozlangan.",
    type: 'SECONDARY',
    listedAt: '2026-06-22',
    placeholderCount: 6,
  },
  {
    id: 'bx-008',
    title: '3 xonali kvartira, Olmazor City, biznes klass',
    priceSom: 1_253_343_000n,
    priceUsd: 105_000,
    rooms: 3,
    areaM2: 80,
    floor: '9/9',
    district: 'Olmazor tumani',
    address: 'Olmazor City turar-joy majmuasi',
    landmark: "Olmazor tumani markazi, qo'riqlanadigan yopiq hudud",
    description:
      "Olmazor City biznes klass turar-joy majmuasida uch xonali kvartira sotiladi. Umumiy maydoni 80 m², to'qqiz qavatli yangi binoning 9-qavatida. Zamonaviy «kalit topshirish» ta'miri qilingan, butun mebel va texnika qoladi. Ikkita sanuzel, yorug' va qulay planirovka, balkondan chiroyli manzara ochiladi. Majmua hududi qo'riqlanadi, infratuzilma rivojlangan — ko'chib kirib yashash mumkin.",
    type: 'NEW_BUILD',
    listedAt: '2026-07-14',
    placeholderCount: 6,
  },
  {
    id: 'bx-009',
    title: "6 xonali g'isht kottej, 290 m², quruvchidan",
    priceSom: 2_506_686_000n,
    priceUsd: 210_000,
    rooms: 6,
    areaM2: 290,
    floor: null,
    district: 'Sergeli tumani',
    address: 'Ikki qavatli kottej, quruvchi kompaniyadan',
    landmark: 'Metro bekatiga 350–400 metr',
    description:
      "Quruvchi kompaniyadan to'g'ridan-to'g'ri, vositachisiz premium darajadagi g'isht kottej sotiladi. Umumiy maydoni 290 m², oltita xona, ikki qavat. Barcha qurilish texnologiyalariga rioya qilib, sifatli materiallardan qurilgan, mualliflik ta'miri qilingan. Uy yashashga to'liq tayyor va katta oila uchun mos. Metro bekatiga atigi 350–400 metr.",
    type: 'HOUSE',
    listedAt: '2026-08-04',
    placeholderCount: 6,
  },
  {
    id: 'bx-010',
    title: '2 xonali yevrokvartira, Urikzor Residence, ipoteka bor',
    priceSom: 787_815_600n,
    priceUsd: 66_000,
    rooms: 2,
    areaM2: 58,
    floor: '14/16',
    district: 'Uchtepa tumani',
    address: 'Urikzor Residence turar-joy majmuasi',
    landmark: "Majmuaning o'z maktabi va bog'chasi yonida",
    description:
      "Urikzor Residence yangi turar-joy majmuasida ikki xonali yevrokvartira sotiladi. Umumiy maydoni 58 m², 16 qavatli monolit binoning 14-qavatida, kadastri tayyor. Yonginasida majmuaning o'z maktabi va bolalar bog'chasi bor. Hudud 24/7 qo'riqlanadi, kirish faqat uy aholisining avtomobillari uchun. Har bir podyezdda ikkitadan lift, ular elektr o'chganda generatorga ulanadi. Ipoteka rasmiylashtirish mumkin.",
    type: 'NEW_BUILD',
    listedAt: '2025-11-05',
    placeholderCount: 6,
  },
];
