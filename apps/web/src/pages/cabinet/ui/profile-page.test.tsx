import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfilePage } from './profile-page';

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

function renderPage(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function errorResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('ProfilePage', () => {
  it('redirects a signed-out visitor instead of rendering an editable form', async () => {
    renderPage(vi.fn(async () => errorResponse(401, { message: 'Sessiya topilmadi' })));

    await vi.waitFor(() => {
      expect(screen.queryByLabelText('Ism')).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Saqlash' })).not.toBeInTheDocument();
  });

  it('fills the form from the current profile', async () => {
    renderPage(vi.fn(async () => jsonResponse(profile)));

    expect(await screen.findByLabelText('Ism')).toHaveValue('Ali Valiyev');
  });

  it('refuses to submit a malformed phone number', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(profile));
    renderPage(fetchMock);

    const phone = await screen.findByLabelText('Telefon');
    await userEvent.type(phone, '901234567');
    await userEvent.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(await screen.findByText(/\+998XXXXXXXXX/)).toBeInTheDocument();
    // Only the initial GET — nothing was sent.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends a PATCH with the edited fields', async () => {
    const fetchMock = vi.fn(async (_path: string, init?: RequestInit) =>
      jsonResponse(init?.method === 'PATCH' ? { ...profile, phone: '+998901234567' } : profile),
    );
    renderPage(fetchMock);

    await userEvent.type(await screen.findByLabelText('Telefon'), '+998901234567');
    await userEvent.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(await screen.findByText(/Saqlandi/)).toBeInTheDocument();
    const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(patchCall).toBeDefined();
    expect(JSON.parse(patchCall![1]!.body as string).phone).toBe('+998901234567');
  });

  it('shows a separate message per field instead of one message for all', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(profile));
    renderPage(fetchMock);

    const name = await screen.findByLabelText('Ism');
    await userEvent.clear(name);
    await userEvent.type(await screen.findByLabelText('Telefon'), '901234567');
    await userEvent.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(await screen.findByText(/\+998XXXXXXXXX/)).toBeInTheDocument();
    expect(await screen.findByText(/have >=2 characters/i)).toBeInTheDocument();
    // Only the initial GET — nothing was sent.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows a failure message when the PATCH request fails', async () => {
    const fetchMock = vi.fn(async (_path: string, init?: RequestInit) =>
      init?.method === 'PATCH'
        ? new Response('{}', { status: 500, headers: { 'content-type': 'application/json' } })
        : jsonResponse(profile),
    );
    renderPage(fetchMock);

    await userEvent.type(await screen.findByLabelText('Telefon'), '+998901234567');
    await userEvent.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(await screen.findByText(/Saqlashda xatolik/)).toBeInTheDocument();
    expect(screen.queryByText(/Saqlandi/)).not.toBeInTheDocument();
  });
});
