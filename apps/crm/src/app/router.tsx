import { createBrowserRouter } from 'react-router';
import { RootLayout } from './root-layout';

// Placeholder cabinet home. Task 8 replaces this with the developer guard + real
// pages; for now the route tree just proves the shell (login gate → cabinet)
// renders end to end.
function PlaceholderHome() {
  return <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-8 text-ink">CRM</main>;
}

// Served under /crm in production, so the router shares that basename; in dev
// Vite's base ('/crm/') puts the app at the same path. RootLayout gates on being
// logged in and renders the outlet once a session exists.
export const router = createBrowserRouter(
  [{ element: <RootLayout />, children: [{ index: true, element: <PlaceholderHome /> }] }],
  { basename: '/crm' },
);
