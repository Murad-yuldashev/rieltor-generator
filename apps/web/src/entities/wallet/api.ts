import { queryOptions } from '@tanstack/react-query';
import { WalletViewSchema } from '@rieltor/shared';
import { apiGet } from '@/shared/api/client';

/**
 * The realtor's prepaid wallet (`GET /api/wallet`) — current balance plus ledger.
 * The lead board reads only the balance from it; the full top-up flow lives in the
 * cabinet (`apps/agent`), which keeps its own copy of this query. A short
 * `staleTime` keeps the balance fresh after a claim debits it without refetching
 * on every focus. Same `['wallet']` key the claim mutation invalidates.
 */
export const walletQuery = () =>
  queryOptions({
    queryKey: ['wallet'] as const,
    queryFn: () => apiGet('/api/wallet', WalletViewSchema),
    staleTime: 30_000,
  });
