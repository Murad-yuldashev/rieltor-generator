import { describe, expect, it } from 'vitest';
import { ObjectDetailSchema, ViewsSchema } from './schemas';

const toliqObyekt = {
  id: 'bx-001',
  sarlavha: "2 xonali kvartira, yangi ta'mir",
  narxSom: '480000000',
  narxUsd: 40000,
  xona: 2,
  maydonM2: 60,
  qavat: '4/9',
  tuman: 'Buxoro shahri',
  manzil: "Navoiy ko'chasi 12",
  moljal: 'Bukhara City yaqinida',
  tavsif: 'Uch jumlalik tavsif.',
  turi: 'IKKILAMCHI',
  views: 7,
  sana: '2026-07-28',
  rasmlar: [
    {
      base: '/images/bx-001/01',
      ogUrl: '/images/bx-001/og.jpg',
      width: 1200,
      height: 900,
      tartib: 1,
    },
  ],
  agent: {
    id: 'ag-1',
    ism: 'Murod',
    agentlik: 'Buxoro Uy',
    suratUrl: '/images/agents/ag-1.jpg',
    tel: '+998901234567',
    tg: 'murod',
  },
};

describe('ObjectDetailSchema', () => {
  it("to'liq obyektni qabul qiladi", () => {
    expect(ObjectDetailSchema.parse(toliqObyekt).id).toBe('bx-001');
  });

  it("hovli uchun qavat null bo'lishiga ruxsat beradi", () => {
    const hovli = { ...toliqObyekt, turi: 'HOVLI', qavat: null };
    expect(ObjectDetailSchema.parse(hovli).qavat).toBeNull();
  });

  it("narxSom number bo'lsa rad etadi", () => {
    expect(() => ObjectDetailSchema.parse({ ...toliqObyekt, narxSom: 480000000 })).toThrow();
  });

  it('notanish turi qiymatini rad etadi', () => {
    expect(() => ObjectDetailSchema.parse({ ...toliqObyekt, turi: 'DACHA' })).toThrow();
  });
});

describe('ViewsSchema', () => {
  it('butun son talab qiladi', () => {
    expect(ViewsSchema.parse({ views: 12 }).views).toBe(12);
    expect(() => ViewsSchema.parse({ views: 1.5 })).toThrow();
  });
});
