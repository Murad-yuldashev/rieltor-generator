import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TelegramLoginButton } from './telegram-login-button';

function renderButton() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TelegramLoginButton />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  document.querySelectorAll('script').forEach((node) => node.remove());
});

describe('TelegramLoginButton', () => {
  it('injects the widget script configured for the bot', () => {
    vi.stubEnv('VITE_TG_BOT_USERNAME', 'rieltor_test_bot');
    const { container } = renderButton();

    const script = container.querySelector('script');
    expect(script).not.toBeNull();
    expect(script?.src).toContain('telegram.org/js/telegram-widget.js');
    expect(script?.getAttribute('data-telegram-login')).toBe('rieltor_test_bot');
    expect(script?.getAttribute('data-onauth')).toBe('onTelegramAuth(user)');
  });

  it('explains itself instead of rendering a dead widget when the bot is not configured', () => {
    vi.stubEnv('VITE_TG_BOT_USERNAME', '');
    const { container } = renderButton();

    expect(screen.getByText(/Telegram orqali kirish sozlanmagan/)).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });

  it('reports a failed login instead of swallowing the rejection', async () => {
    vi.stubEnv('VITE_TG_BOT_USERNAME', 'rieltor_test_bot');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('{}', { status: 500, headers: { 'content-type': 'application/json' } }),
      ),
    );
    renderButton();

    // The widget calls the global directly; act() lets the state update flush.
    await act(async () => {
      await window.onTelegramAuth?.({ id: 777000 });
    });

    expect(screen.getByText(/Kirishda xatolik/)).toBeInTheDocument();
  });
});
