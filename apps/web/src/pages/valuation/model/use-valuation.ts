import { useMutation } from '@tanstack/react-query';
import { ValuationResultSchema, type ValuationRequest } from '@rieltor/shared';
import { apiPost } from '@/shared/api/client';

/**
 * Wraps `POST /api/valuation` — the free, public "Uyingiz qancha turadi?"
 * estimate. No auth, and nothing is persisted server-side; the caller just
 * holds the latest result in local state.
 */
export function useValuation() {
  const mutation = useMutation({
    mutationFn: (body: ValuationRequest) => apiPost('/api/valuation', ValuationResultSchema, body),
  });

  return {
    estimate: mutation.mutateAsync,
    result: mutation.data,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
