import { createBrowserRouter } from 'react-router';
import { HomePage } from '@/pages/home';
import { ListingPage } from '@/pages/listing';
import { NotFoundPage } from '@/pages/not-found';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/obj/:id', element: <ListingPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
