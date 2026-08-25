import { createBrowserRouter } from 'react-router';
import { ContactPage } from '@/pages/contact';
import { FavoritesPage } from '@/pages/favorites';
import { HomePage } from '@/pages/home';
import { ListingPage } from '@/pages/listing';
import { ListingCreatePage } from '@/pages/listing-create';
import { MyListingsPage } from '@/pages/my-listings';
import { MyPropertiesPage, PropertyDetailPage } from '@/pages/my-properties';
import { NotFoundPage } from '@/pages/not-found';
import { NotificationsPage } from '@/pages/notifications';
import { OfferPage } from '@/pages/offer';
import { MyRequestsPage, RequestCreatePage, RequestsPage } from '@/pages/requests';
import { SearchPage } from '@/pages/search';
import { ValuationPage } from '@/pages/valuation';
import { RootLayout } from './root-layout';
import { TabLayout } from './tab-layout';

export const router = createBrowserRouter([
  {
    // Owns scroll behaviour; everything else sits underneath it.
    element: <RootLayout />,
    children: [
      {
        // Bottom-nav pages: the header and the nav are drawn once, the body swaps.
        element: <TabLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/search', element: <SearchPage /> },
          { path: '/favorites', element: <FavoritesPage /> },
          { path: '/my/listings', element: <MyListingsPage /> },
          { path: '/my/properties', element: <MyPropertiesPage /> },
          { path: '/my/properties/:id', element: <PropertyDetailPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/contact', element: <ContactPage /> },
          // Not in the bottom nav — reached from the link on the contact page.
          { path: '/offer', element: <OfferPage /> },
          // "Qidiryapman" reverse-listings board — reached from the home-page entry.
          { path: '/requests', element: <RequestsPage /> },
          { path: '/requests/new', element: <RequestCreatePage /> },
          { path: '/my/requests', element: <MyRequestsPage /> },
        ],
      },
      // The listing page sits outside TabLayout: full-bleed gallery and its own sticky CTA.
      { path: '/obj/:id', element: <ListingPage /> },
      // The wizard owns its own chrome (top bar + left rail, no bottom nav).
      { path: '/my/listings/new', element: <ListingCreatePage /> },
      // Public seller-capture valuation hook — own light chrome, no auth, no bottom nav.
      { path: '/valuation', element: <ValuationPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
