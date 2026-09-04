import { createBrowserRouter } from 'react-router';
import { BookingsPage } from '@/pages/bookings';
import { BuildingDetailPage } from '@/pages/building-detail';
import { ComplexDetailPage } from '@/pages/complex-detail';
import { ComplexesPage } from '@/pages/complexes';
import { OrganizationPage } from '@/pages/organization';
import { WalletPage } from '@/pages/wallet';
import { DeveloperGuard } from './developer-guard';
import { RootLayout } from './root-layout';

// Served under /crm in production, so the router shares that basename; in dev
// Vite's base ('/crm/') puts the app at the same path. RootLayout gates on being
// logged in; DeveloperGuard then gates on role=DEVELOPER (or shows the
// become-developer onboarding). Under the guard: the organization dashboard
// (index), the complexes list, a complex's detail, and a building's units
// (buildings/:id).
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
            { path: 'buildings/:id', element: <BuildingDetailPage /> },
            { path: 'bookings', element: <BookingsPage /> },
            { path: 'wallet', element: <WalletPage /> },
          ],
        },
      ],
    },
  ],
  { basename: '/crm' },
);
