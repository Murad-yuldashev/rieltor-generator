import { createBrowserRouter } from 'react-router';
import { ContactPage } from '@/pages/contact';
import { FavoritesPage } from '@/pages/favorites';
import { HomePage } from '@/pages/home';
import { ListingPage } from '@/pages/listing';
import { NotFoundPage } from '@/pages/not-found';
import { OfferPage } from '@/pages/offer';
import { SearchPage } from '@/pages/search';
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
          { path: '/contact', element: <ContactPage /> },
          // Not in the bottom nav — reached from the link on the contact page.
          { path: '/offer', element: <OfferPage /> },
        ],
      },
      // The listing page sits outside TabLayout: full-bleed gallery and its own sticky CTA.
      { path: '/obj/:id', element: <ListingPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
