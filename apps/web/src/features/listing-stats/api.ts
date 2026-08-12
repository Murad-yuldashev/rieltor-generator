import { queryOptions } from '@tanstack/react-query';
import { ListingStatsSchema, type ListingStats } from '@rieltor/shared';
import { apiGet } from '@/shared/api/client';

/** GET /api/me/objects/:id/stats (design spec §8.3) — owner-only. */
export const myObjectStatsQuery = (id: string) =>
  queryOptions({
    queryKey: ['myObjectStats', id] as const,
    queryFn: (): Promise<ListingStats> => apiGet(`/api/me/objects/${id}/stats`, ListingStatsSchema),
    // A 404/403 (wrong owner, bad id) will not fix itself on retry.
    retry: false,
  });
