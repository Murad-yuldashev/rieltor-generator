import { useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { openLoginModal, useSession } from '@/entities/session';
import { AuthModalHost } from '@/features/auth';

/**
 * Outermost layer around every cabinet route. ScrollRestoration resets the
 * scroll offset on navigation and restores it on back/forward, so later pages
 * do not open halfway down.
 *
 * It also gates the whole cabinet on being logged in: without an authenticated
 * session the outlet is withheld and the app-wide login modal is raised. Once
 * `useLogin` seeds the session cache (or a token restore resolves), the query
 * flips to authenticated and the cabinet outlet renders. Role-based routing
 * (become-realtor / paywall) lands in a later Phase 3.1 task — here the only
 * gate is "is there a session".
 */
export function RootLayout() {
  const { isAuthenticated, isPending } = useSession();

  // No valid session (no tokens, or the client cleared an expired pair on a 401)
  // → prompt for login. The modal is app-wide and mounted below, so raising the
  // flag is all this layer has to do.
  useEffect(() => {
    if (!isPending && !isAuthenticated) openLoginModal();
  }, [isPending, isAuthenticated]);

  return (
    <>
      <ScrollRestoration />
      {isAuthenticated ? (
        <Outlet />
      ) : (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
          {isPending ? (
            <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
          ) : (
            <>
              <h1 className="text-[20px] font-extrabold tracking-tight">Rieltor kabineti</h1>
              <p className="max-w-[280px] text-[14px] text-ink-2">
                Davom etish uchun tizimga kiring.
              </p>
              <button
                type="button"
                onClick={openLoginModal}
                className="rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35"
              >
                Kirish
              </button>
            </>
          )}
        </div>
      )}
      <AuthModalHost />
    </>
  );
}
