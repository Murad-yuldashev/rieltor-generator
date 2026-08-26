import { Outlet, ScrollRestoration } from 'react-router';

/**
 * Outermost layer around every cabinet route. ScrollRestoration resets the
 * scroll offset on navigation and restores it on back/forward, so later pages
 * do not open halfway down.
 */
export function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
