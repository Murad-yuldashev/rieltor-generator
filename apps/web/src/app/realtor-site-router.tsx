import { createBrowserRouter } from 'react-router';
import { ListingPage } from '@/pages/listing';
import { RealtorEmbed, RealtorPage } from '@/pages/realtor';
import { RootLayout } from './root-layout';

/**
 * Route tree mounted when the shell was served for a realtor (custom domain or the
 * embed page) instead of the marketplace. Apex routes sit UNDER RootLayout so
 * ScrollRestoration + AuthModalHost mount — otherwise the reused ListingPage's
 * desktop-header login (openLoginModal) is a silent no-op and scroll never resets
 * on the custom domain. The embed is a single bare route: no site chrome, and it
 * needs neither auth modal nor scroll restoration.
 */
export function realtorSiteRouter(slug: string, mode?: 'embed') {
  if (mode === 'embed') {
    return createBrowserRouter([{ path: '*', element: <RealtorEmbed slug={slug} /> }]);
  }
  return createBrowserRouter([
    {
      element: <RootLayout />,
      children: [
        { path: '/', element: <RealtorPage slug={slug} /> },
        { path: '/obj/:id', element: <ListingPage /> },
        { path: '*', element: <RealtorPage slug={slug} /> },
      ],
    },
  ]);
}
