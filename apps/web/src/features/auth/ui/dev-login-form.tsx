import { type FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtorProfileSchema } from '@rieltor/shared';
import { apiPost } from '@/shared/api/client';

/** One fixed Telegram id, so repeated logins land on the same test realtor. */
const DEV_TG_ID = 424242;

/**
 * A way into the cabinet without Telegram. The widget only works on a domain
 * registered with BotFather, which localhost cannot be, so local testing would
 * otherwise be impossible.
 *
 * Two independent gates keep it out of production: the server only registers
 * POST /api/auth/dev outside production and only with DEV_LOGIN_SECRET set, and
 * this form is only built when VITE_DEV_LOGIN_ENABLED is "true".
 */
export function DevLoginForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('Murod');
  // The dev secret comes from the build env now instead of a typed password,
  // so getting into the cabinet for local testing is a single click.
  const secret = import.meta.env.VITE_DEV_LOGIN_SECRET ?? '';
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (import.meta.env.VITE_DEV_LOGIN_ENABLED !== 'true') return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const profile = await apiPost('/api/auth/dev', RealtorProfileSchema, {
        secret,
        tgId: DEV_TG_ID,
        name,
      });
      queryClient.setQueryData(['me'], profile);
    } catch {
      setError("Parol noto'g'ri yoki dev-login o'chirilgan.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-card border border-line/60 bg-card p-4 shadow-card"
    >
      <p className="mb-3 text-[13px] leading-[1.35] font-semibold text-ink-3">
        Faqat ishlab chiqish uchun: Telegram'siz kirish.
      </p>

      <label className="block py-1.5">
        <span className="mb-1 block text-xs font-bold text-ink-3">Ism</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-[12px] border border-line bg-card px-3 py-2.5 text-[15px] font-semibold"
        />
      </label>

      {error && <p className="mt-2 text-[13px] font-bold text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-3 w-full rounded-[14px] bg-accent py-3 text-[14.5px] font-extrabold text-white disabled:opacity-60"
      >
        Kirish
      </button>
    </form>
  );
}
