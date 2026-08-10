import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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
});
