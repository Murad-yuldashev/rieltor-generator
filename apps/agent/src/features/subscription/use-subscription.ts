import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SubscriptionViewSchema, type AuthUser, type SubscriptionView } from '@rieltor/shared';
import { apiGet, apiPost } from '@/shared/api/client';

/**
 * `GET /api/agent/subscription` returns `null` for a plain USER (no subscription
 * row), so the schema is nullable. In the cabinet the query only ever runs for a
 * REALTOR — who always has a row — but the contract stays honest either way.
 */
const NullableSubscriptionSchema = SubscriptionViewSchema.nullable();

export const SUBSCRIPTION_QUERY_KEY = ['subscription'] as const;
const SESSION_QUERY_KEY = ['session'] as const;

/**
 * The realtor's subscription. `enabled` lets the gate skip the fetch for a USER
 * (whose role check has already decided the become-realtor branch) so no
 * guaranteed-null request is fired before the role is known.
 */
export function useSubscription({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: () => apiGet('/api/agent/subscription', NullableSubscriptionSchema),
    enabled,
    staleTime: 60 * 1000,
    // A subscription failure is deterministic (403 → paywall, handled globally),
    // so retrying only delays the redirect.
    retry: false,
  });
}

/**
 * `POST /api/agent/become-realtor` — USER → REALTOR + a 14-day trial. Idempotent
 * on the server. On success we seed the caches (role → REALTOR, the fresh trial
 * view) so the gate flips to the cabinet without a flash, then invalidate both
 * to reconcile with server truth. The session key MUST be invalidated because
 * the role changed and every gate reads it.
 */
export function useBecomeRealtor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost('/api/agent/become-realtor', NullableSubscriptionSchema),
    onSuccess: (subscription) => {
      queryClient.setQueryData<AuthUser>(SESSION_QUERY_KEY, (prev) =>
        prev ? { ...prev, role: 'REALTOR' } : prev,
      );
      queryClient.setQueryData<SubscriptionView | null>(SUBSCRIPTION_QUERY_KEY, subscription);
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
}

/**
 * `POST /api/agent/subscription/activate` — the STUB payment (no real charge).
 * Extends the paid period by 30 days. On success we seed and invalidate the
 * subscription so the gate re-opens the cabinet immediately.
 */
export function useActivateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost('/api/agent/subscription/activate', NullableSubscriptionSchema),
    onSuccess: (subscription) => {
      queryClient.setQueryData<SubscriptionView | null>(SUBSCRIPTION_QUERY_KEY, subscription);
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
    },
  });
}
