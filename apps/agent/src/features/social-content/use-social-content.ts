import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { AiSocialContentSchema, RealtorOwnListingSchema } from '@rieltor/shared';
import { apiGet, apiPost } from '@/shared/api/client';

const OwnListingsSchema = z.array(RealtorOwnListingSchema);

/** `GET /api/agent/content/listings` → the realtor's own PUBLISHED listings for the card grid. */
export function useOwnListings() {
  return useQuery({
    queryKey: ['own-listings'] as const,
    queryFn: () => apiGet('/api/agent/content/listings', OwnListingsSchema),
    staleTime: 60 * 1000,
  });
}

/**
 * `POST /api/agent/content/listings/:id/social` → caption + hashtags + shareUrl. A per-listing
 * useQuery (NOT a mutation): keyed by listing id with `staleTime: Infinity`, so re-opening the same
 * listing serves from cache (never re-bills Gemini) and React Query dedupes the StrictMode
 * double-mount into ONE call. `enabled` is true only while the modal is open. (A POST queryFn is
 * fine here — the call is idempotent "generate", cached for the session.)
 */
export function useListingContent(listingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['social-content', listingId] as const,
    queryFn: () =>
      apiPost(`/api/agent/content/listings/${listingId}/social`, AiSocialContentSchema),
    enabled,
    staleTime: Infinity,
  });
}
