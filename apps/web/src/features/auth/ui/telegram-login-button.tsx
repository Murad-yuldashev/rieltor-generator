import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthTokensSchema, TelegramAuthSchema, type TelegramAuth } from '@rieltor/shared';
import { apiPost } from '@/shared/api/client';
import { writeTokens } from '@/shared/api/auth-storage';

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuth) => void;
  }
}

/**
 * The Telegram Login Widget is a third-party `<script>`, not a React component —
 * it injects its own button and, once clicked, calls a *global* callback (the
 * `data-onauth` attribute is a literal string, evaluated by Telegram's script).
 * So the widget is loaded imperatively into a ref'd container, and the payload
 * lands wherever `window.onTelegramAuth` happens to point at the time.
 */
export function TelegramLoginButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    window.onTelegramAuth = async (user) => {
      const tokens = await apiPost(
        '/api/auth/telegram',
        AuthTokensSchema,
        TelegramAuthSchema.parse(user),
      );
      writeTokens(tokens);
      void queryClient.invalidateQueries({ queryKey: ['session'] });
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.dataset.telegramLogin = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
    script.dataset.size = 'large';
    script.dataset.radius = '14';
    script.dataset.onauth = 'onTelegramAuth(user)';
    containerRef.current?.appendChild(script);

    return () => {
      script.remove();
      delete window.onTelegramAuth;
    };
  }, [queryClient]);

  return <div ref={containerRef} className="flex justify-center" />;
}
