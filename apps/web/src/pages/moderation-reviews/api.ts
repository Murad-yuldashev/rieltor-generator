import { queryOptions } from '@tanstack/react-query';
import { ModeratorReviewRowSchema } from '@rieltor/shared';
import * as z from 'zod';
import { apiGet } from '@/shared/api/client';

/** Shared so the moderate mutation always invalidates the same list. */
export const MODERATION_REVIEWS_KEY = ['moderation-reviews'] as const;

/**
 * The moderator's pending-review queue (GET /api/moderation/reviews).
 * Bearer-token gated on the API side; the page also checks the session role
 * before it ever fires. Mirrors the realtor roster query.
 */
export const moderationReviewsQuery = queryOptions({
  queryKey: MODERATION_REVIEWS_KEY,
  queryFn: () => apiGet('/api/moderation/reviews', z.array(ModeratorReviewRowSchema)),
});
