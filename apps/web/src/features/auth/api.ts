import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RealtorProfileSchema,
  type RealtorProfile,
  type RealtorProfileUpdate,
} from '@rieltor/shared';
import * as z from 'zod';
import { ApiError, apiGet, apiPatch, apiPost } from '@/shared/api/client';

export const meQuery = () =>
  queryOptions({
    queryKey: ['me'] as const,
    queryFn: async (): Promise<RealtorProfile | null> => {
      try {
        return await apiGet('/api/me', RealtorProfileSchema);
      } catch (error) {
        // 401 is the normal "not signed in" answer, not a failure worth retrying.
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  });

export function loginWithTelegram(payload: unknown): Promise<RealtorProfile> {
  return apiPost('/api/auth/telegram', RealtorProfileSchema, payload);
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost('/api/auth/logout', z.object({ ok: z.literal(true) })),
    onSuccess: () => queryClient.setQueryData(['me'], null),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: RealtorProfileUpdate) => apiPatch('/api/me', RealtorProfileSchema, patch),
    onSuccess: (profile) => queryClient.setQueryData(['me'], profile),
  });
}
