import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WalletViewSchema, type Topup } from '@rieltor/shared';
import { apiGet, apiPost } from '@/shared/api/client';

export const WALLET_QUERY_KEY = ['wallet'] as const;

/**
 * The realtor's prepaid wallet — current balance plus the transaction ledger
 * (`GET /api/wallet`). Only ever runs inside the cabinet (CabinetGuard), where a
 * REALTOR always has a wallet row. A short `staleTime` keeps the balance fresh
 * after a lead claim on another screen without refetching on every focus.
 */
export function useWallet() {
  return useQuery({
    queryKey: WALLET_QUERY_KEY,
    queryFn: () => apiGet('/api/wallet', WalletViewSchema),
    staleTime: 30 * 1000,
  });
}

/**
 * `POST /api/wallet/topup` — the STUB payment (no real charge) that credits the
 * chosen preset package. The response is the fresh wallet view; invalidating the
 * wallet key on success repaints the balance and the ledger with server truth.
 */
export function useTopup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (packageId: Topup['packageId']) =>
      apiPost('/api/wallet/topup', WalletViewSchema, { packageId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY });
    },
  });
}
