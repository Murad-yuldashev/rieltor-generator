import { createBrowserRouter } from 'react-router';
import { ComplexDetailPage } from '@/pages/complex-detail';
import { ComplexesPage } from '@/pages/complexes';
import { OrganizationPage } from '@/pages/organization';
import { DeveloperGuard } from './developer-guard';
import { RootLayout } from './root-layout';

// Served under /crm in production, so the router shares that basename; in dev
// Vite's base ('/crm/') puts the app at the same path. RootLayout gates on being
// logged in; DeveloperGuard then gates on role=DEVELOPER (or shows the
// become-developer onboarding). Under the guard: the organization dashboard
// (index), the complexes list, and a complex's detail. Units (buildings/:id)
// land in T10.
export const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [
        {
          element: <DeveloperGuard />,
          children: [
            { index: true, element: <OrganizationPage /> },
            { path: 'complexes', element: <ComplexesPage /> },
            { path: 'complexes/:id', element: <ComplexDetailPage /> },
          ],
        },
      ],
    },
  ],
  { basename: '/crm' },
);
