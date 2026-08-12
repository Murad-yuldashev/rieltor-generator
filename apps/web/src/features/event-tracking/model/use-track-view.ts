import { useEffect, useRef } from 'react';
import { trackEvent } from '../api';
import { useShareCode } from './use-share-code';

/**
 * Fires one VIEW event (design spec §8.2) per listing per mount, once the listing is
 * confirmed to exist (`ready`) — a 404 id never gets counted. `listingId` is read from
 * the route, not `data.id`, so it is stable across the pending → loaded transition.
 */
export function useTrackView(listingId: string, ready: boolean): void {
  const shareCode = useShareCode();
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !listingId || firedFor.current === listingId) return;
    firedFor.current = listingId;
    trackEvent({ listingId, type: 'VIEW', shareCode });
  }, [listingId, ready, shareCode]);
}
