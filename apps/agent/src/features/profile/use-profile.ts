import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RealtorProfileSchema,
  type RealtorProfile,
  type RealtorProfileUpdate,
} from '@rieltor/shared';
import { apiGet, apiPatch, apiUpload } from '@/shared/api/client';

export const PROFILE_QUERY_KEY = ['profile'] as const;

/**
 * `GET /api/agent/profile` → the realtor's editable profile. The endpoint is
 * RealtorGuard-protected and, for a realtor who has never saved anything, returns
 * all-default values (agency '', bio null, regions [], experienceYears null) — so
 * the query always resolves to a full `RealtorProfile`, never null.
 */
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => apiGet('/api/agent/profile', RealtorProfileSchema),
    staleTime: 60 * 1000,
  });
}

/**
 * `PATCH /api/agent/profile` — an all-optional update (only the fields the user
 * edited are sent). The endpoint returns the full, reconciled profile, so we seed
 * the cache with it for an instant reflect and then invalidate to stay honest with
 * server truth.
 */
export function useSaveProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: RealtorProfileUpdate) =>
      apiPatch('/api/agent/profile', RealtorProfileSchema, patch),
    onSuccess: (profile) => {
      queryClient.setQueryData<RealtorProfile>(PROFILE_QUERY_KEY, profile);
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}

/**
 * `POST /api/agent/profile/logo` — multipart brand-logo upload. The endpoint stores
 * the file and returns the full, reconciled `RealtorProfile` (with the new `logoUrl`),
 * so — exactly like `useSaveProfile` — we seed the cache with it for an instant reflect
 * and then invalidate to stay honest with server truth.
 */
export function useSaveLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiUpload('/api/agent/profile/logo', formData, RealtorProfileSchema);
    },
    onSuccess: (profile) => {
      queryClient.setQueryData<RealtorProfile>(PROFILE_QUERY_KEY, profile);
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}
