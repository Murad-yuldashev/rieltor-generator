import { createBrowserRouter } from 'react-router';
import { DeveloperGuard } from './developer-guard';
import { RootLayout } from './root-layout';
// Real page imports (organization, complexes, complexes/:id, buildings/:id) land in T9/T10.

// Served under /crm in production, so the router shares that basename; in dev
// Vite's base ('/crm/') puts the app at the same path. RootLayout gates on being
// logged in; DeveloperGuard then gates on role=DEVELOPER (or shows the
// become-developer onboarding). The index below is a placeholder cabinet that
// T9 replaces with the organization dashboard.
export const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [
        {
          element: <DeveloperGuard />,
          children: [
            // T9/T10 add: index (organization), complexes, complexes/:id, buildings/:id
            { index: true, element: <main className="p-8 text-ink">Kabinet</main> },
          ],
        },
      ],
    },
  ],
  { basename: '/crm' },
);
