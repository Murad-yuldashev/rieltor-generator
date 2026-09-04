import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrgWalletViewSchema, type Topup } from '@rieltor/shared';
import { apiGet, apiPost } from '@/shared/api/client';

export const ORG_WALLET_QUERY_KEY = ['crm-wallet'] as const;

/**
 * The developer organization's wallet — current balance plus the transaction
 * ledger (`GET /api/crm/wallet`, JwtGuard + DeveloperGuard). Runs only inside the
 * CRM cabinet, where a DEVELOPER always has an org wallet row. The balance MAY be
 * negative (a debt), so callers must inspect the STRING sign, never `Number()` it.
 * A short `staleTime` keeps the balance fresh after a commission debit elsewhere.
 */
export function useOrgWallet() {
  return useQuery({
    queryKey: ORG_WALLET_QUERY_KEY,
    queryFn: () => apiGet('/api/crm/wallet', OrgWalletViewSchema),
    staleTime: 30 * 1000,
  });
}

/**
 * `POST /api/crm/wallet/topup` — the STUB payment (no real charge) that credits the
 * chosen preset package. The response is the fresh org-wallet view; invalidating the
 * wallet key on success repaints the balance and the ledger with server truth.
 */
export function useOrgTopup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (packageId: Topup['packageId']) =>
      apiPost('/api/crm/wallet/topup', OrgWalletViewSchema, { packageId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ORG_WALLET_QUERY_KEY });
    },
  });
}
