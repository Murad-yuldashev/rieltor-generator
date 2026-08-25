import { Outlet, ScrollRestoration } from 'react-router';
import { AuthModalHost } from '@/features/auth';

/**
 * Outermost layer around every route.
 *
 * Without ScrollRestoration the scroll offset carries across SPA navigations:
 * tapping "Ommaviy oferta" from a scrolled-down contact page would open the
 * document halfway through. It resets to the top on a new navigation and
 * restores the previous offset on back/forward.
 *
 * AuthModalHost is mounted here (inside the router, so its `<Link>`s resolve) so
 * `openLoginModal()` works on every route — including pages outside the site
 * header, like the public valuation flow.
 */
export function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
      <AuthModalHost />
    </>
  );
}
