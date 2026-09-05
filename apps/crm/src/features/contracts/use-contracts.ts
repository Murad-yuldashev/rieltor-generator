import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { ContractRowSchema, ContractSchema } from '@rieltor/shared';
import { apiGet, apiPost } from '@/shared/api/client';

export const CONTRACTS_QUERY_KEY = ['crm-contracts'] as const;
const ContractRowsSchema = z.array(ContractRowSchema);

/** The org's contracts (`GET /api/crm/contracts`, JwtGuard + DeveloperGuard). */
export function useContracts() {
  return useQuery({
    queryKey: CONTRACTS_QUERY_KEY,
    queryFn: () => apiGet('/api/crm/contracts', ContractRowsSchema),
    staleTime: 30 * 1000,
  });
}

/** One contract detail (`GET /api/crm/contracts/:id`) — a ContractRow, with unit + building labels. */
export function useContract(id: string) {
  return useQuery({
    queryKey: [...CONTRACTS_QUERY_KEY, id] as const,
    queryFn: () => apiGet(`/api/crm/contracts/${id}`, ContractRowSchema),
  });
}

/** Stub signing (`POST /api/crm/contracts/:id/sign`) — stamps signedAt, repaints list + detail. */
export function useSignContract(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost(`/api/crm/contracts/${id}/sign`, ContractSchema, {}),
    onSuccess: () => {
      // Invalidating the list root ['crm-contracts'] already refetches the detail query
      // ['crm-contracts', id] via TanStack Query v5 prefix matching; the explicit detail-key
      // line is for intent parity with the spec (§6) — both are harmless.
      void queryClient.invalidateQueries({ queryKey: CONTRACTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: [...CONTRACTS_QUERY_KEY, id] });
    },
  });
}
