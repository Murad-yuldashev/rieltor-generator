import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loginWithTelegram } from '../api';

const WIDGET_SRC = 'https://telegram.org/js/telegram-widget.js?22';

declare global {
  interface Window {
    onTelegramAuth?: (user: unknown) => void;
  }
}

/**
 * The widget is a third-party <script> that calls a global function with the signed
 * payload — there is no React-friendly API for it. The script is appended once per
 * mount and removed on unmount together with the global it needs.
 */
export function TelegramLoginButton() {
  const container = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  // Read per render, not at module scope: a module-level const is captured once and
  // the tests (which stub the env after import) could never change it.
  const botUsername = import.meta.env.VITE_TG_BOT_USERNAME ?? '';

  useEffect(() => {
    if (!botUsername || !container.current) return;

    window.onTelegramAuth = async (user) => {
      const profile = await loginWithTelegram(user);
      queryClient.setQueryData(['me'], profile);
    };

    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '14');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    container.current.appendChild(script);

    return () => {
      script.remove();
      delete window.onTelegramAuth;
    };
  }, [queryClient, botUsername]);

  if (!botUsername) {
    return (
      <p className="rounded-[14px] border border-line bg-surface px-4 py-3 text-[13px] font-semibold text-ink-3">
        Telegram orqali kirish sozlanmagan. Serverda <code>VITE_TG_BOT_USERNAME</code> ni
        to'ldiring.
      </p>
    );
  }

  return <div ref={container} />;
}
