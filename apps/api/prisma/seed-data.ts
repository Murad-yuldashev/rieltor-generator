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

export const SEED_OBJECTS: SeedObject[] = [
  {
    id: 'bx-001',
    sarlavha: '3 xonali kvartira, yangi bino, Buxoro City turar-joy majmuasi',
    narxSom: 780_000_000n,
    narxUsd: 65_000,
    xona: 3,
    maydonM2: 84,
    qavat: '6/9',
    tuman: 'Buxoro shahri',
    manzil: "Alpomish ko'chasi 4",
    moljal: 'Buxoro City majmuasi ichida, savdo markazi yonida',
    tavsif:
      "Yangi topshirilgan binoda uch xonali keng kvartira. Uy egasi tomonidan to'liq ta'mirlangan, oshxona jihozlari qoldiriladi. Deraza old tomonga qaraydi, quyosh kun bo'yi tushadi. Hovlida yopiq avtoturargoh va bolalar maydonchasi bor.",
    turi: 'NOVOSTROYKA',
    sana: '2026-07-20',
    placeholderSoni: 5,
  },
  {
    id: 'bx-002',
    sarlavha: "2 xonali kvartira, o'rta ta'mir, G'ijduvon ko'chasi",
    narxSom: 480_000_000n,
    narxUsd: 40_000,
    xona: 2,
    maydonM2: 58,
    qavat: '4/5',
    tuman: 'Buxoro shahri',
    manzil: "G'ijduvon ko'chasi 27",
    moljal: '12-maktab va Oltin Vodiy bozori yaqinida',
    tavsif:
      "Panel uyning to'rtinchi qavatida ikki xonali kvartira. Xonalar alohida, oshxona kengaytirilgan. Suv va issiqlik uzilishsiz keladi. Metro bekati va bozorga piyoda besh daqiqa. Hujjatlar tayyor, kadastr mavjud.",
    turi: 'IKKILAMCHI',
    sana: '2026-07-22',
    placeholderSoni: 5,
  },
  {
    id: 'bx-003',
    sarlavha: "5 xonali hovli uy, 6 sotix yer, Kogon yo'li",
    narxSom: 1_450_000_000n,
    narxUsd: 121_000,
    xona: 5,
    maydonM2: 180,
    qavat: null,
    tuman: 'Kogon tumani',
    manzil: "Mustaqillik ko'chasi 9",
    moljal: "Kogon temir yo'l bekatidan uch kilometr",
    tavsif:
      "Olti sotix yerda joylashgan besh xonali hovli uy. Uy g'ishtdan qurilgan, tomi yangilangan. Hovlida mevali daraxtlar, alohida oshxona va garaj bor. Tabiiy gaz, markaziy suv va kanalizatsiya ulangan. Yer uchun tuman hujjati bor.",
    turi: 'HOVLI',
    sana: '2026-07-25',
    placeholderSoni: 5,
  },
];
