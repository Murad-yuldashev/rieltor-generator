import { useEffect, useRef } from 'react';

/**
 * Auto-loads the next slice when a sentinel scrolls into view — replaces a
 * "Ko'proq ko'rsatish" button with infinite scroll. Attach the returned ref to
 * an element rendered at the end of the list (only while `hasMore` is true).
 *
 * `onMore` fires as the sentinel nears the viewport. Re-observing whenever
 * `shownCount` grows keeps loading until the screen is filled, then waits for
 * the next scroll; when `hasMore` turns false no observer is attached, so the
 * list stops on its own.
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>(
  hasMore: boolean,
  shownCount: number,
  onMore: () => void,
) {
  const sentinelRef = useRef<T>(null);
  // Keep the latest callback without re-creating the observer on every render.
  const onMoreRef = useRef(onMore);
  onMoreRef.current = onMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onMoreRef.current();
      },
      // Start loading a screenful early so the scroll never visibly stalls.
      { rootMargin: '600px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, shownCount]);

  return sentinelRef;
}
