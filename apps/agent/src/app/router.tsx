import { createBrowserRouter } from 'react-router';
import { BrowsePage } from '@/pages/browse';
import { CollectionDetailPage } from '@/pages/collection-detail';
import { CollectionsPage } from '@/pages/collections';
import { DashboardPage } from '@/pages/dashboard';
import { NotesPage } from '@/pages/notes';
import { PresentationDetailPage } from '@/pages/presentation-detail';
import { PresentationsPage } from '@/pages/presentations';
import { ProfilePage } from '@/pages/profile';
import { SubscribePage } from '@/pages/subscribe';
import { CabinetGuard } from './cabinet-guard';
import { RootLayout } from './root-layout';

// Served under /agent in production, so the router shares that basename; in dev
// Vite's base ('/agent/') puts the app at the same path.
//
// RootLayout gates on being logged in. CabinetGuard nests under it and gates on
// role + an active subscription — it renders the become-realtor page, the
// dashboard, or a redirect to /subscribe. The paywall sits OUTSIDE CabinetGuard
// so an inactive realtor can reach it without a redirect loop.
export const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [
        {
          element: <CabinetGuard />,
          children: [
            { index: true, element: <DashboardPage /> },
            { path: 'profile', element: <ProfilePage /> },
            { path: 'browse', element: <BrowsePage /> },
            { path: 'notes', element: <NotesPage /> },
            { path: 'collections', element: <CollectionsPage /> },
            { path: 'collections/:id', element: <CollectionDetailPage /> },
            { path: 'presentations', element: <PresentationsPage /> },
            { path: 'presentations/:id', element: <PresentationDetailPage /> },
          ],
        },
        { path: 'subscribe', element: <SubscribePage /> },
      ],
    },
  ],
  { basename: '/agent' },
);
