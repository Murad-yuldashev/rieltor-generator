import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { ApiError } from '@/shared/api/client';
import { router } from './router';

/**
 * Global agent-API error routing. A RealtorGuard endpoint returns 403 the moment
 * a subscription lapses mid-session; mapping any 403 to the paywall makes that
 * expiry surface as "obuna tugadi" instead of a silently-failed request. 401 is
 * left to the client (Task 7): it refreshes the token or clears the pair, and the
 * shell falls back to the login gate.
 */
function routeAgentErrorToPaywall(error: unknown) {
  if (
    error instanceof ApiError &&
    error.status === 403 &&
    router.state.location.pathname !== '/subscribe'
  ) {
    void router.navigate('/subscribe');
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: routeAgentErrorToPaywall }),
  mutationCache: new MutationCache({ onError: routeAgentErrorToPaywall }),
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
