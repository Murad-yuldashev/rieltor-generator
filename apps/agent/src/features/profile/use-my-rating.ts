import { queryOptions, useQuery } from '@tanstack/react-query';
import { PublicRealtorSchema } from '@rieltor/shared';
import { apiGet } from '@/shared/api/client';

/**
 * `GET /api/r/:slug` — the realtor's OWN public microsite payload, read here only for
 * its `ratingAvg`/`ratingCount`/`reviews` so the cabinet can show a read-only mirror
 * of the ratings buyers see. The endpoint is public and slug-gated; the realtor's own
 * slug comes from `GET /api/agent/profile`. Only called once a slug is set (an
 * unpublished realtor has no public page to read), so `slug` here is always non-null.
 */
export function myRatingQueryOptions(slug: string) {
  return queryOptions({
    queryKey: ['my-rating', slug],
    queryFn: () => apiGet(`/api/r/${slug}`, PublicRealtorSchema),
    staleTime: 60 * 1000,
  });
}

export function useMyRating(slug: string) {
  return useQuery(myRatingQueryOptions(slug));
}
