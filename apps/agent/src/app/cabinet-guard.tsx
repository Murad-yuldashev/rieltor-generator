import { Navigate, Outlet } from 'react-router';
import { useSession } from '@/entities/session';
import { useSubscription } from '@/features/subscription';
import { BecomeRealtorPage } from '@/pages/become-realtor';

/**
 * Subscription gate for the cabinet, nested inside RootLayout (which has already
 * guaranteed an authenticated session before this renders). Resolves three states:
 *
 *   1. role !== REALTOR         → the become-realtor page (no subscription fetch)
 *   2. REALTOR + isActive       → the cabinet outlet (dashboard etc.)
 *   3. REALTOR + not active     → redirect to /subscribe (the paywall)
 *
 * `/subscribe` deliberately sits OUTSIDE this guard so an inactive realtor can
 * reach the paywall without a redirect loop. A mid-session expiry (a RealtorGuard
 * endpoint returning 403) is caught globally in providers.tsx, which also routes
 * to /subscribe.
 */
export function CabinetGuard() {
  const { user } = useSession();
  const isRealtor = user?.role === 'REALTOR';

  // Skip the subscription fetch entirely for a USER — the role check alone
  // decides the become-realtor branch, and a USER has no subscription anyway.
  const { data: subscription, isPending } = useSubscription({ enabled: isRealtor });

  if (!isRealtor) return <BecomeRealtorPage />;

  // First load for a realtor whose subscription is not yet cached.
  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface">
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!subscription?.isActive) return <Navigate to="/subscribe" replace />;

  return <Outlet />;
}
