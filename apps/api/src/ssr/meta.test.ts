import { describe, expect, it } from 'vitest';
import { escapeHtml, buildMetaTags } from './meta';

const listing = {
  id: 'bx-001',
  title: '3 xonali kvartira, yangi bino',
  priceSom: '780000000',
  priceUsd: 65000,
  rooms: 3,
  areaM2: 84,
  floor: '6/9',
  district: 'Buxoro shahri',
  address: 'Manzil',
  landmark: 'Moljal',
  description: 'Birinchi jumla. Ikkinchi jumla. Uchinchi jumla.',
  type: 'NEW_BUILD' as const,
  views: 0,
  listedAt: '2026-07-20',
  images: [
    {
      base: '/images/bx-001/01',
      ogUrl: '/images/bx-001/og.jpg',
      width: 1200,
      height: 900,
      position: 1,
    },
  ],
  agent: {
    id: 'agent-1',
    name: 'Rieltor',
    agency: 'Agentlik',
    photoUrl: '/images/agents/agent-1.jpg',
    phone: '+998901234567',
    telegram: 'username',
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
  const html = buildMetaTags(listing, BASE);

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
    const longDescription = { ...listing, description: 'a'.repeat(400) };
    const output = buildMetaTags(longDescription, BASE);
    const match = /property="og:description" content="([^"]*)"/.exec(output);
    expect(match?.[1]?.length).toBeLessThanOrEqual(201);
  });

  it("rasm bo'lmasa og:image chiqarmaydi va qulamaydi", () => {
    const noImages = { ...listing, images: [] };
    expect(() => buildMetaTags(noImages, BASE)).not.toThrow();
    expect(buildMetaTags(noImages, BASE)).not.toContain('og:image');
  });

  it('sarlavhadagi apostrof head ni buzmaydi', () => {
    const withApostrophe = { ...listing, title: `Kvartira "lyuks" & ta'mir` };
    expect(buildMetaTags(withApostrophe, BASE)).not.toMatch(/content="[^"]*"[^">]*"/);
  });
});
