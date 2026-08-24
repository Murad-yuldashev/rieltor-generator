import { useCallback } from 'react';
import * as z from 'zod';
import { apiGet } from '@/shared/api/client';

/**
 * `GET /api/objects/:id/contact` (Task 8) — no shared schema exists for it yet,
 * so it's defined here, next to its only consumer. PUBLISHED-only; every call
 * logs a ContactReveal row (this tap *is* the tracked lead).
 */
const ContactSchema = z.object({
  phone: z.string(),
  telegram: z.string(),
});

/**
 * Reveal-then-dial for the sticky call button: the masked number shown on the
 * page is never enough to place a call by itself, so tapping "Qo'ng'iroq" first
 * fetches the real number (recording the reveal) and only then dials it.
 */
export function useContactReveal(listingId: string) {
  const callSeller = useCallback(async (): Promise<void> => {
    const { phone } = await apiGet(`/api/objects/${listingId}/contact`, ContactSchema);
    window.location.href = `tel:${phone}`;
  }, [listingId]);

  return { callSeller };
}
