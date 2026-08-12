import type { EventCreate } from '@rieltor/shared';
import { apiPost } from '@/shared/api/client';

/**
 * POST /api/event (design spec §8.2) — fire-and-forget: the promise is never awaited
 * by callers and every failure is swallowed here, so a blocked/failed ping can never
 * break the page. This is additive alongside the pre-existing /api/view/:id counter
 * (features/view-counter), which it does not touch or replace.
 */
export function trackEvent(input: EventCreate): void {
  apiPost('/api/event', undefined, input).catch(() => {
    /* analytics must never surface an error to the UI */
  });
}
