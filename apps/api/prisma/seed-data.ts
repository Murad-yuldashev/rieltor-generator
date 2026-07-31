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

// Haqiqiy OLX.uz e'lonlaridan olingan uchta Buxoro obyekti (2026-07).
export const SEED_LISTINGS: SeedListing[] = [
  {
    id: 'bx-001',
    title: '3 xonali elita kvartira, 4 xonaga aylanadi, EUROPA majmuasi',
    priceSom: 836_983_000n,
    priceUsd: 70_000,
    rooms: 3,
    areaM2: 101.3,
    floor: '4/7',
    district: 'Buxoro shahri',
    address: 'EUROPA (Family Park) turar-joy majmuasi',
    landmark: 'TBK Chevar va vino zavodi burilishi yaqinida',
    description:
      "Buxoro shahar markazidagi EUROPA (Family Park) turar-joy majmuasida joylashgan elita uch xonali kvartira, xohishga ko'ra to'rt xonaga aylantirish mumkin. Umumiy maydoni 101.3 m², shundan 62.7 m² yashash maydoniga to'g'ri keladi, kvartira 7 qavatli binoning 4-qavatida joylashgan va lift mavjud. Bino fasadi tabiiy tosh bilan qoplangan, kirish eshigi barmoq izi orqali ochiladigan aqlli qulfga ega. Bino 2025-yil o'rtalarida foydalanishga topshirilgan, 1 m² narxi taxminan $690 ni tashkil qiladi.",
    type: 'NEW_BUILD',
    listedAt: '2026-07-24',
    placeholderCount: 6,
  },
  {
    id: 'bx-002',
    title: "3 xonali kvartira, yevro ta'mir, qizil g'ishtli bino",
    priceSom: 644_476_910n,
    priceUsd: 53_900,
    rooms: 3,
    areaM2: 80,
    floor: '4/5',
    district: 'Buxoro shahri',
    address: "Qizil g'ishtli bino",
    landmark: 'Pasport stoli yaqinida',
    description:
      "Besh qavatli g'isht binoning 4-qavatida joylashgan uch xonali kvartira sotiladi. Umumiy maydoni 80 m², xonalar bir-biriga tutash emas (barchasi alohida) va kvartiraning shaxsiy hammomi bor. Kvartira jihozlari bilan birga, yevro ta'mir qilingan holda sotiladi. Ikkilamchi bozor bo'yicha ipoteka rasmiylashtirish mumkin, vositachi komissiyasi olinmaydi.",
    type: 'SECONDARY',
    listedAt: '2026-07-29',
    placeholderCount: 6,
  },
  {
    id: 'bx-003',
    title: '5 xonali hovli uy, 4 sotix yer, Shimoliy mikrorayon',
    priceSom: 1_076_121_000n,
    priceUsd: 90_000,
    rooms: 5,
    areaM2: 200,
    floor: null,
    district: 'Buxoro shahri',
    address: 'Shimoliy mikrorayon',
    landmark: "28-maktab, bozor va bolalar bog'chasi yaqinida",
    description:
      "Buxoro shahrining Shimoliy mikrorayonida joylashgan besh xonali hovli uy sotiladi. Yer maydoni 400 m² (taxminan 4 sotix), shundan 200 m² turar-joy maydoniga to'g'ri keladi. Uyning asosiy qismida sifatli ta'mir qilingan. Yaqin atrofda 28-maktab, bozor va bolalar bog'chasi bor.",
    type: 'HOUSE',
    listedAt: '2026-07-21',
    placeholderCount: 5,
  },
];
