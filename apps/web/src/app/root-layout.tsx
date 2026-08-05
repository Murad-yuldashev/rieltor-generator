import { Outlet, ScrollRestoration } from 'react-router';

/**
 * Outermost layer around every route.
 *
 * Without ScrollRestoration the scroll offset carries across SPA navigations:
 * tapping "Ommaviy oferta" from a scrolled-down contact page would open the
 * document halfway through. It resets to the top on a new navigation and
 * restores the previous offset on back/forward.
 */
export function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
