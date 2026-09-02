import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { router } from './router';

// The CRM SPA has no paywall, so unlike the agent cabinet there is no 403→paywall
// error routing on the query/mutation caches — just the shared client defaults.
// 401 stays owned by the API client (refresh-or-clear), and the shell falls back
// to the login gate.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
