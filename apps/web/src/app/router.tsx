import { createBrowserRouter } from 'react-router';
import { HomePage } from '@/pages/home';
import { NotFoundPage } from '@/pages/not-found';
import { ObjectPage } from '@/pages/object';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/obj/:id', element: <ObjectPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
