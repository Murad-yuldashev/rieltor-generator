import { Navigate, useNavigate } from 'react-router';
import { useSession } from '@/entities/session';
import { useActivateSubscription, useSubscription } from '@/features/subscription';

/**
 * Paywall. Reached when a REALTOR's subscription has lapsed — either the gate
 * redirects here (isActive false) or a mid-session expiry trips the global 403
 * handler. The activate button is a STUB payment: it calls the test-only
 * activate endpoint (no real charge) and, on success, routes back to the cabinet.
 */
export function SubscribePage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: subscription, isPending } = useSubscription();
  const { mutateAsync, isPending: isActivating, isError } = useActivateSubscription();

  // A plain USER has no subscription to pay for — send them to become-realtor.
  if (user && user.role !== 'REALTOR') return <Navigate to="/" replace />;

  // Already active (e.g. opened the paywall URL directly) — nothing to buy.
  if (subscription?.isActive) return <Navigate to="/" replace />;

  async function handleActivate() {
    await mutateAsync();
    void navigate('/', { replace: true });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col justify-center gap-6 bg-surface px-5 py-12">
      <div className="rounded-card bg-card p-6 shadow-card">
        <span className="inline-flex rounded-full bg-brand-rose/10 px-3 py-1 text-[12px] font-bold text-brand-rose">
          Obuna tugadi
        </span>
        <h1 className="mt-4 text-[22px] font-extrabold tracking-tight text-ink">
          Sinov muddati tugadi
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
          Kabinetdan foydalanishni davom ettirish uchun obuna bo‘ling. Obuna 30 kunga
          faollashtiriladi.
        </p>

        <button
          type="button"
          onClick={handleActivate}
          disabled={isActivating || isPending}
          className="mt-6 w-full rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:opacity-60"
        >
          {isActivating ? 'Faollashtirilmoqda...' : 'Faollashtirish (test to‘lov)'}
        </button>

        {/* Required disclosure: the button does NOT take money — it is a stub. */}
        <p className="mt-3 rounded-[12px] bg-accent-soft px-3 py-2 text-center text-[12px] font-medium text-accent-dark">
          Diqqat: bu test faollashtirish. Haqiqiy to‘lov amalga oshirilmaydi va karta talab
          qilinmaydi.
        </p>

        {isError && (
          <p className="mt-3 text-center text-[13px] font-semibold text-brand-rose">
            Faollashtirishda xatolik. Qayta urinib ko‘ring.
          </p>
        )}
      </div>
    </main>
  );
}
