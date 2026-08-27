import { queryOptions } from '@tanstack/react-query';
import { PublicPresentationSchema } from '@rieltor/shared';
import { apiGet } from '@/shared/api/client';

/**
 * The public, token-gated presentation (GET /api/p/:token). No auth — a client
 * with the link opens it directly. A 404 surfaces as an ApiError the page maps
 * to the "not found" view.
 */
export const presentationQuery = (token: string) =>
  queryOptions({
    queryKey: ['presentation', token] as const,
    queryFn: () => apiGet(`/api/p/${token}`, PublicPresentationSchema),
    // A shared presentation is an immutable snapshot — it never changes mid-view.
    staleTime: 5 * 60 * 1000,
  });
