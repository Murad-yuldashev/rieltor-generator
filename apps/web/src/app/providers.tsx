import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { readRealtorBootstrap } from './realtor-bootstrap';
import { realtorSiteRouter } from './realtor-site-router';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// Decided once at module load: a realtor bootstrap (custom domain / embed) mounts a
// realtor-only route tree; otherwise the full marketplace router.
const bootstrap = readRealtorBootstrap();
const activeRouter = bootstrap ? realtorSiteRouter(bootstrap.slug, bootstrap.mode) : router;

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={activeRouter} />
    </QueryClientProvider>
  );
}
