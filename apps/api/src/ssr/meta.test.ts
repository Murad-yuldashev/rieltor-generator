import { describe, expect, it } from 'vitest';
import { escapeHtml, metaTeglar } from './meta';

const obj = {
  id: 'bx-001',
  sarlavha: '3 xonali kvartira, yangi bino',
  narxSom: '780000000',
  narxUsd: 65000,
  xona: 3,
  maydonM2: 84,
  qavat: '6/9',
  tuman: 'Buxoro shahri',
  manzil: 'Manzil',
  moljal: 'Moljal',
  tavsif: 'Birinchi jumla. Ikkinchi jumla. Uchinchi jumla.',
  turi: 'NOVOSTROYKA' as const,
  views: 0,
  sana: '2026-07-20',
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
    id: 'agent-1',
    ism: 'Rieltor',
    agentlik: 'Agentlik',
    suratUrl: '/images/agents/agent-1.jpg',
    tel: '+998901234567',
    tg: 'username',
  },
};

const BASE = 'https://misol.uz';

describe('escapeHtml', () => {
  it('HTML uchun xavfli belgilarni almashtiradi', () => {
    expect(escapeHtml(`<a href="x">O'g'ri & Co</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;O&#39;g&#39;ri &amp; Co&lt;/a&gt;',
    );
  });
});

describe('metaTeglar', () => {
  const html = metaTeglar(obj, BASE);

  it("sarlavha va narxni og:title ga qo'shadi", () => {
    expect(html).toContain('property="og:title"');
    expect(html).toContain('3 xonali kvartira, yangi bino');
    expect(html).toContain('780 000 000 so&#39;m');
  });

  it('og:image ni absolyut URL qiladi', () => {
    expect(html).toContain(`content="${BASE}/images/bx-001/og.jpg"`);
  });

  it("og:image o'lchamlarini beradi", () => {
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
  });

  it("twitter kartasini katta rasm rejimiga qo'yadi", () => {
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });

  it("og:url ni obyekt manziliga qo'yadi", () => {
    expect(html).toContain(`content="${BASE}/obj/bx-001"`);
  });

  it("LCP rasmi uchun preload qo'shadi", () => {
    expect(html).toContain('rel="preload"');
    expect(html).toContain('as="image"');
    expect(html).toContain('/images/bx-001/01-720.webp 720w');
  });

  it('tavsifni 200 belgigacha qisqartiradi', () => {
    const uzun = { ...obj, tavsif: 'a'.repeat(400) };
    const chiqish = metaTeglar(uzun, BASE);
    const moslik = /property="og:description" content="([^"]*)"/.exec(chiqish);
    expect(moslik?.[1]?.length).toBeLessThanOrEqual(201);
  });

  it("rasm bo'lmasa og:image chiqarmaydi va qulamaydi", () => {
    const rasmsiz = { ...obj, rasmlar: [] };
    expect(() => metaTeglar(rasmsiz, BASE)).not.toThrow();
    expect(metaTeglar(rasmsiz, BASE)).not.toContain('og:image');
  });

  it('sarlavhadagi apostrof head ni buzmaydi', () => {
    const apostrofli = { ...obj, sarlavha: `Kvartira "lyuks" & ta'mir` };
    expect(metaTeglar(apostrofli, BASE)).not.toMatch(/content="[^"]*"[^">]*"/);
  });
});
