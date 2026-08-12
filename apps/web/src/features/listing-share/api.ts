import { ShareLinkSchema, type ShareLink } from '@rieltor/shared';
import { apiPost } from '@/shared/api/client';

/** POST /api/objects/:id/share (design spec §8.1) — owner-only. */
export function createShareLink(listingId: string, label?: string): Promise<ShareLink> {
  return apiPost(`/api/objects/${listingId}/share`, ShareLinkSchema, label ? { label } : undefined);
}
