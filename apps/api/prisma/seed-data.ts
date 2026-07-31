import type { ObjectTuri } from '@prisma/client';

export interface SeedObject {
  id: string;
  sarlavha: string;
  narxSom: bigint;
  narxUsd: number;
  xona: number;
  maydonM2: number;
  qavat: string | null;
  tuman: string;
  manzil: string;
  moljal: string;
  tavsif: string;
  turi: ObjectTuri;
  sana: string;
  placeholderSoni: number;
}

// Haqiqiy OLX.uz e'lonlaridan olingan uchta Buxoro obyekti (2026-07).
export const SEED_OBJECTS: SeedObject[] = [
  {
    id: 'bx-001',
    sarlavha: '3 xonali elita kvartira, 4 xonaga aylanadi, EUROPA majmuasi',
    narxSom: 836_983_000n,
    narxUsd: 70_000,
    xona: 3,
    maydonM2: 101.3,
    qavat: '4/7',
    tuman: 'Buxoro shahri',
    manzil: 'EUROPA (Family Park) turar-joy majmuasi',
    moljal: 'TBK Chevar va vino zavodi burilishi yaqinida',
    tavsif:
      "Buxoro shahar markazidagi EUROPA (Family Park) turar-joy majmuasida joylashgan elita uch xonali kvartira, xohishga ko'ra to'rt xonaga aylantirish mumkin. Umumiy maydoni 101.3 m², shundan 62.7 m² yashash maydoniga to'g'ri keladi, kvartira 7 qavatli binoning 4-qavatida joylashgan va lift mavjud. Bino fasadi tabiiy tosh bilan qoplangan, kirish eshigi barmoq izi orqali ochiladigan aqlli qulfga ega. Bino 2025-yil o'rtalarida foydalanishga topshirilgan, 1 m² narxi taxminan $690 ni tashkil qiladi.",
    turi: 'NOVOSTROYKA',
    sana: '2026-07-24',
    placeholderSoni: 6,
  },
  {
    id: 'bx-002',
    sarlavha: "3 xonali kvartira, yevro ta'mir, qizil g'ishtli bino",
    narxSom: 644_476_910n,
    narxUsd: 53_900,
    xona: 3,
    maydonM2: 80,
    qavat: '4/5',
    tuman: 'Buxoro shahri',
    manzil: "Qizil g'ishtli bino",
    moljal: 'Pasport stoli yaqinida',
    tavsif:
      "Besh qavatli g'isht binoning 4-qavatida joylashgan uch xonali kvartira sotiladi. Umumiy maydoni 80 m², xonalar bir-biriga tutash emas (barchasi alohida) va kvartiraning shaxsiy hammomi bor. Kvartira jihozlari bilan birga, yevro ta'mir qilingan holda sotiladi. Ikkilamchi bozor bo'yicha ipoteka rasmiylashtirish mumkin, vositachi komissiyasi olinmaydi.",
    turi: 'IKKILAMCHI',
    sana: '2026-07-29',
    placeholderSoni: 6,
  },
  {
    id: 'bx-003',
    sarlavha: '5 xonali hovli uy, 4 sotix yer, Shimoliy mikrorayon',
    narxSom: 1_076_121_000n,
    narxUsd: 90_000,
    xona: 5,
    maydonM2: 200,
    qavat: null,
    tuman: 'Buxoro shahri',
    manzil: 'Shimoliy mikrorayon',
    moljal: "28-maktab, bozor va bolalar bog'chasi yaqinida",
    tavsif:
      "Buxoro shahrining Shimoliy mikrorayonida joylashgan besh xonali hovli uy sotiladi. Yer maydoni 400 m² (taxminan 4 sotix), shundan 200 m² turar-joy maydoniga to'g'ri keladi. Uyning asosiy qismida sifatli ta'mir qilingan. Yaqin atrofda 28-maktab, bozor va bolalar bog'chasi bor.",
    turi: 'HOVLI',
    sana: '2026-07-21',
    placeholderSoni: 5,
  },
];
