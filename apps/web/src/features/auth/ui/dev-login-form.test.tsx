import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

async function freshForm() {
  vi.resetModules();
  return (await import('./dev-login-form')).DevLoginForm;
}

function renderForm(DevLoginForm: () => React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DevLoginForm />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('DevLoginForm', () => {
  it('renders nothing unless the build flag is on', async () => {
    vi.stubEnv('VITE_DEV_LOGIN_ENABLED', '');
    const { container } = renderForm(await freshForm());

    expect(container).toBeEmptyDOMElement();
  });

  it('offers a password field when the flag is on', async () => {
    vi.stubEnv('VITE_DEV_LOGIN_ENABLED', 'true');
    renderForm(await freshForm());

    expect(screen.getByLabelText('Parol')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kirish' })).toBeInTheDocument();
  });

  it('keeps the submit button disabled until a password is typed', async () => {
    vi.stubEnv('VITE_DEV_LOGIN_ENABLED', 'true');
    renderForm(await freshForm());

    expect(screen.getByRole('button', { name: 'Kirish' })).toBeDisabled();
  });
});
