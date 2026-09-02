import { queryOptions } from '@tanstack/react-query';
import { PlatformConversionSchema } from '@rieltor/shared';
import { apiGet } from '@/shared/api/client';

/** Shared key for the platform-wide conversion overview. */
export const MODERATION_CONVERSION_KEY = ['moderation-conversion'] as const;

/**
 * The platform-wide conversion analytics (GET /api/moderation/conversion).
 * Bearer-token gated on the API side; the page also checks the session role
 * before it ever fires. Read-only — mirrors the moderator review/realtor queries.
 */
export const moderationConversionQuery = queryOptions({
  queryKey: MODERATION_CONVERSION_KEY,
  queryFn: () => apiGet('/api/moderation/conversion', PlatformConversionSchema),
});
