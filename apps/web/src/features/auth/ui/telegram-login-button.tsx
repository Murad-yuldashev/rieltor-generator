import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('cabinet');
  const container = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState(false);
  // Read per render, not at module scope: a module-level const is captured once and
  // the tests (which stub the env after import) could never change it.
  const botUsername = import.meta.env.VITE_TG_BOT_USERNAME ?? '';

  useEffect(() => {
    if (!botUsername || !container.current) return;

    // The widget calls this global from a plain script snippet and never awaits it,
    // so a rejection here would be unhandled and a failed login would look like a
    // dead button.
    window.onTelegramAuth = async (user) => {
      try {
        setFailed(false);
        const profile = await loginWithTelegram(user);
        queryClient.setQueryData(['me'], profile);
      } catch {
        setFailed(true);
      }
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
        <Trans i18nKey="cabinet:auth.notConfigured">
          Telegram orqali kirish sozlanmagan. Serverda <code>VITE_TG_BOT_USERNAME</code> ni
          to'ldiring.
        </Trans>
      </p>
    );
  }

  return (
    <div>
      <div ref={container} />
      {failed && (
        <p className="mt-2 text-[13px] font-bold text-red-600">{t('auth.loginFailed')}</p>
      )}
    </div>
  );
}
