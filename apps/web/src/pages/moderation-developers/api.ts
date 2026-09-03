import { queryOptions } from '@tanstack/react-query';
import { ModeratorDeveloperRowSchema } from '@rieltor/shared';
import * as z from 'zod';
import { apiGet } from '@/shared/api/client';

/** Shared so the verify mutation always invalidates the same list. */
export const MODERATION_DEVELOPERS_KEY = ['moderation-developers'] as const;

/**
 * The moderator's developer roster (GET /api/moderation/developers). Bearer-token
 * gated on the API side; the page also checks the session role before it ever
 * fires. Mirrors the realtor roster surface — one row per developer org.
 */
export const developersQuery = queryOptions({
  queryKey: MODERATION_DEVELOPERS_KEY,
  queryFn: () => apiGet('/api/moderation/developers', z.array(ModeratorDeveloperRowSchema)),
});
