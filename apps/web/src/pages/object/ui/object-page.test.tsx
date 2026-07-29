import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectPage } from './object-page';

const obyekt = {
  id: 'bx-002',
  sarlavha: '2 xonali kvartira',
  narxSom: '480000000',
  narxUsd: 40000,
  xona: 2,
  maydonM2: 58,
  qavat: '4/5',
  tuman: 'Buxoro shahri',
  manzil: "G'ijduvon ko'chasi 27",
  moljal: '12-maktab yaqinida',
  tavsif: 'Ikki xonali kvartira.',
  turi: 'IKKILAMCHI',
  views: 3,
  sana: '2026-07-22',
  rasmlar: [
    {
      base: '/images/bx-002/01',
      ogUrl: '/images/bx-002/og.jpg',
      width: 1200,
      height: 900,
      tartib: 1,
    },
  ],
  agent: {
    id: 'agent-1',
    ism: 'Murod',
    agentlik: 'Buxoro Uy',
    suratUrl: '/images/agents/agent-1.jpg',
    tel: '+998901234567',
    tg: 'murod',
  },
};

function javob(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function chiqar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/obj/bx-002']}>
        <Routes>
          <Route path="/obj/:id" element={<ObjectPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('ObjectPage', () => {
  it("obyekt maydonlarini ko'rsatadi", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('/api/view/') ? javob(200, { views: 3 }) : javob(200, obyekt),
      ),
    );

    chiqar();

    expect(await screen.findByText("480 000 000 so'm")).toBeInTheDocument();
    expect(screen.getByText('2 xona')).toBeInTheDocument();
    expect(screen.getByText('Ikki xonali kvartira.')).toBeInTheDocument();
    expect(screen.getByText('Murod')).toBeInTheDocument();
  });

  it('CTA tugmalarini seed kontakti bilan chiqaradi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('/api/view/') ? javob(200, { views: 3 }) : javob(200, obyekt),
      ),
    );

    chiqar();

    expect(await screen.findByRole('link', { name: /Qo'ng'iroq/ })).toHaveAttribute(
      'href',
      'tel:+998901234567',
    );
  });

  it("404 da topilmadi sahifasini ko'rsatadi", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => javob(404, { message: 'topilmadi' })),
    );

    chiqar();

    expect(await screen.findByText(/topilmadi/i)).toBeInTheDocument();
  });
});
