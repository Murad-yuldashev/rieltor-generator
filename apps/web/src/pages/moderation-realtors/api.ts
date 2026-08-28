import { queryOptions } from '@tanstack/react-query';
import { ModeratorRealtorRowSchema } from '@rieltor/shared';
import * as z from 'zod';
import { apiGet } from '@/shared/api/client';

/** Shared so the verify mutation always invalidates the same list. */
export const MODERATION_REALTORS_KEY = ['moderation-realtors'] as const;

/**
 * The moderator's realtor roster (GET /api/moderation/realtors). Bearer-token
 * gated on the API side; the page also checks the session role before it ever
 * fires. This is the only moderator surface in the app.
 */
export const moderationRealtorsQuery = queryOptions({
  queryKey: MODERATION_REALTORS_KEY,
  queryFn: () => apiGet('/api/moderation/realtors', z.array(ModeratorRealtorRowSchema)),
});
