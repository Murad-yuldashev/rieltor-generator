import { queryOptions } from '@tanstack/react-query';
import { PublicRealtorSchema } from '@rieltor/shared';
import { apiGet } from '@/shared/api/client';

/**
 * The public, slug-gated realtor microsite (GET /api/r/:slug). No auth — a
 * visitor with the link opens it directly. A 404 surfaces as an ApiError the
 * page maps to the "not found" view. Not subscription-gated: a lapsed
 * subscription still serves the page (the API decides that, not the client).
 */
export const realtorQuery = (slug: string) =>
  queryOptions({
    queryKey: ['realtor', slug] as const,
    queryFn: () => apiGet(`/api/r/${slug}`, PublicRealtorSchema),
    // A microsite is a slow-moving profile — no need to refetch on every focus.
    staleTime: 5 * 60 * 1000,
  });
