import { createBrowserRouter } from 'react-router';
import { ComplexesPage } from '@/pages/complexes';
import { ContactPage } from '@/pages/contact';
import { FavoritesPage } from '@/pages/favorites';
import { HomePage } from '@/pages/home';
import { ListingPage } from '@/pages/listing';
import { ListingCreatePage } from '@/pages/listing-create';
import { ModerationConversionPage } from '@/pages/moderation-conversion';
import { ModerationRealtorsPage } from '@/pages/moderation-realtors';
import { ModerationReviewsPage } from '@/pages/moderation-reviews';
import { MyListingsPage } from '@/pages/my-listings';
import { MyPropertiesPage, PropertyDetailPage } from '@/pages/my-properties';
import { NotFoundPage } from '@/pages/not-found';
import { NotificationsPage } from '@/pages/notifications';
import { OfferPage } from '@/pages/offer';
import { PresentationPage } from '@/pages/presentation';
import { RealtorPage } from '@/pages/realtor';
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
          // Public ЖК browse — shares the tab chrome so the nav highlights (T9 adds /jk/:slug outside).
          { path: '/jk', element: <ComplexesPage /> },
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
      // Public client presentation — token-gated, no auth, no bottom nav.
      { path: '/p/:token', element: <PresentationPage /> },
      // Public realtor microsite — slug-gated, no auth, no bottom nav.
      { path: '/r/:slug', element: <RealtorPage /> },
      // The wizard owns its own chrome (top bar + left rail, no bottom nav).
      { path: '/my/listings/new', element: <ListingCreatePage /> },
      // Public seller-capture valuation hook — own light chrome, no auth, no bottom nav.
      { path: '/valuation', element: <ValuationPage /> },
      // Moderator-only realtor verification — full-screen admin surface, role-gated in-page.
      { path: '/moderation/realtors', element: <ModerationRealtorsPage /> },
      // Moderator-only review queue — same full-screen admin surface, role-gated in-page.
      { path: '/moderation/reviews', element: <ModerationReviewsPage /> },
      // Moderator-only platform conversion overview — same admin surface, role-gated in-page.
      { path: '/moderation/conversion', element: <ModerationConversionPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
