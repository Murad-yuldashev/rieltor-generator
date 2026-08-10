import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CabinetPage } from './cabinet-page';

const profile = {
  id: 'rlt_1',
  name: 'Ali Valiyev',
  username: 'ali-valiyev',
  photoUrl: null,
  phone: null,
  phoneVerified: false,
  agency: null,
  registryNo: null,
  trusted: false,
};

function stubMe(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status,
          headers: { 'content-type': 'application/json' },
        }),
    ),
  );
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CabinetPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('CabinetPage', () => {
  it('asks an anonymous visitor to sign in', async () => {
    vi.stubEnv('VITE_TG_BOT_USERNAME', 'rieltor_test_bot');
    stubMe(401, { message: 'Sessiya topilmadi' });
    renderPage();

    expect(await screen.findByText(/Rieltor kabineti/)).toBeInTheDocument();
    expect(screen.queryByText('Ali Valiyev')).not.toBeInTheDocument();
  });

  it('shows the profile and warns about the missing phone number', async () => {
    stubMe(200, profile);
    renderPage();

    expect(await screen.findByText('Ali Valiyev')).toBeInTheDocument();
    expect(screen.getByText(/Telefon raqami kiritilmagan/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Profilni tahrirlash/ })).toHaveAttribute(
      'href',
      '/cabinet/profile',
    );
  });

  it('drops the warning once a phone number is saved', async () => {
    stubMe(200, { ...profile, phone: '+998901234567' });
    renderPage();

    expect(await screen.findByText('Ali Valiyev')).toBeInTheDocument();
    expect(screen.queryByText(/Telefon raqami kiritilmagan/)).not.toBeInTheDocument();
  });
});
