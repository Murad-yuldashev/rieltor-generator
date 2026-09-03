import { Outlet } from 'react-router';
import { useSession } from '@/entities/session';
import { BecomeDeveloperPage } from '@/pages/become-developer';

/**
 * Role gate for the cabinet, nested inside RootLayout (which has already
 * guaranteed an authenticated session before this renders). Unlike the agent's
 * subscription gate, the developer cabinet is role-only — there is no paywall:
 *
 *   1. session still loading → a loading line
 *   2. role !== DEVELOPER     → the become-developer onboarding page
 *   3. role === DEVELOPER     → the cabinet outlet
 *
 * The become-developer mutation invalidates the session query on success, so once
 * the role flips this gate re-reads it and swaps the onboarding page for the outlet.
 */
export function DeveloperGuard() {
  const { user, isPending } = useSession();

  if (isPending) return <main className="p-8 text-ink-2">Yuklanmoqda...</main>;
  if (user?.role !== 'DEVELOPER') return <BecomeDeveloperPage />;

  return <Outlet />;
}
