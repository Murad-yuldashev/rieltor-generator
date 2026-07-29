import { describe, expect, it } from 'vitest';
import { ObjectDetailSchema } from '@rieltor/shared';
import { detailgaAylantir, royxatgaAylantir } from './mapper';

const qator = {
  id: 'bx-002',
  sarlavha: 'Test',
  narxSom: 480000000n,
  narxUsd: 40000,
  xona: 2,
  maydonM2: 58,
  qavat: '4/5',
  tuman: 'Buxoro shahri',
  manzil: 'Manzil',
  moljal: 'Moljal',
  tavsif: 'Tavsif',
  turi: 'IKKILAMCHI' as const,
  views: 3,
  sana: new Date('2026-07-22T00:00:00.000Z'),
  agentId: 'agent-1',
  agent: {
    id: 'agent-1',
    ism: 'Rieltor',
    agentlik: 'Agentlik',
    suratUrl: '/images/agents/agent-1.jpg',
    tel: '+998901234567',
    tg: 'username',
  },
  rasmlar: [
    {
      base: '/images/bx-002/01',
      ogUrl: '/images/bx-002/og.jpg',
      width: 1200,
      height: 900,
      tartib: 1,
    },
    { base: '/images/bx-002/02', ogUrl: null, width: 1200, height: 900, tartib: 2 },
  ],
};

describe('detailgaAylantir', () => {
  it('narxSom ni satrga aylantiradi', () => {
    expect(detailgaAylantir(qator).narxSom).toBe('480000000');
  });

  it("sana ni YYYY-MM-DD ko'rinishida beradi", () => {
    expect(detailgaAylantir(qator).sana).toBe('2026-07-22');
  });

  it("natija ObjectDetailSchema dan o'tadi", () => {
    expect(() => ObjectDetailSchema.parse(detailgaAylantir(qator))).not.toThrow();
  });

  it("agentId ni javobga qo'shmaydi", () => {
    expect(detailgaAylantir(qator)).not.toHaveProperty('agentId');
  });
});

describe('royxatgaAylantir', () => {
  it('faqat birinchi rasmni beradi', () => {
    expect(royxatgaAylantir(qator).rasm?.base).toBe('/images/bx-002/01');
  });

  it("rasm bo'lmasa null qaytaradi", () => {
    expect(royxatgaAylantir({ ...qator, rasmlar: [] }).rasm).toBeNull();
  });

  it("tavsif kabi og'ir maydonlarni tashlab ketadi", () => {
    expect(royxatgaAylantir(qator)).not.toHaveProperty('tavsif');
  });
});
