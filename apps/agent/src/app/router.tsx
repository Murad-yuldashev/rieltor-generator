import { createBrowserRouter } from 'react-router';
import { HomePage } from '@/pages/home';
import { RootLayout } from './root-layout';

// Served under /agent in production, so the router shares that basename; in dev
// Vite's base ('/agent/') puts the app at the same path.
export const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [
        // Single placeholder route. Later tasks slot the cabinet pages in here.
        { path: '/', element: <HomePage /> },
      ],
    },
  ],
  { basename: '/agent' },
);
