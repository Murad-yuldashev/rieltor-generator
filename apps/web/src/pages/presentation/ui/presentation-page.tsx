import { useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import type { PublicPresentationItem } from '@rieltor/shared';
import { ListingCard } from '@/entities/listing';
import { ApiError } from '@/shared/api/client';
import { NotFoundView } from '@/widgets/not-found';
import { presentationQuery } from '../api';

// A card must cross half into view before its dwell timer starts, and only spans
// of at least a second are worth a beacon — anything shorter is a scroll-past.
const VISIBILITY_THRESHOLD = 0.5;
const MIN_DWELL_MS = 1000;

/**
 * Best-effort view analytics for the public presentation page. Fires one
 * presentation-opened event per mount, then measures per-listing dwell with an
 * IntersectionObserver and ships it via `sendBeacon` when the tab is backgrounded
 * or the page is torn down. Every call swallows its own failures — analytics must
 * never block the render or throw.
 *
 * Returns a stable callback-ref factory: attach `ref={registerCard(listingId)}` to
 * each listing card so the observer can key dwell by `listingId`.
 */
function usePresentationViewAnalytics(token: string, items: PublicPresentationItem[] | undefined) {
  // listingId -> observed element, populated by the callback refs during commit
  // (before effects run, so the observer sees every card).
  const cardEls = useRef(new Map<string, HTMLElement>());
  // Cache one stable ref callback per listingId so React doesn't detach/reattach
  // on every render (a fresh callback would fire null-then-element each time).
  const refCallbacks = useRef(new Map<string, (el: HTMLElement | null) => void>());
  // StrictMode double-invokes effects in dev; this guard keeps the open event to one.
  const openSent = useRef(false);

  const registerCard = useCallback((listingId: string) => {
    let callback = refCallbacks.current.get(listingId);
    if (!callback) {
      callback = (el: HTMLElement | null) => {
        if (el) cardEls.current.set(listingId, el);
        else cardEls.current.delete(listingId);
      };
      refCallbacks.current.set(listingId, callback);
    }
    return callback;
  }, []);

  // Open event: presentation-opened, once per mount (listingId null server-side).
  useEffect(() => {
    if (!token || openSent.current || typeof fetch !== 'function') return;
    openSent.current = true;
    void fetch(`/api/p/${token}/view`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    }).catch(() => {
      // Best-effort: a failed open beacon is silently ignored.
    });
  }, [token]);

  // Per-listing dwell: accumulate visible time, flush on background/teardown.
  const listingKey = items?.map((item) => item.listingId).join(',') ?? '';
  useEffect(() => {
    if (!token || typeof IntersectionObserver === 'undefined') return;

    // listingId -> accumulated dwell (ms) not yet sent.
    const dwell = new Map<string, number>();
    // listingId -> timestamp the card became ~50% visible (in-progress span).
    const visibleSince = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        const now = performance.now();
        for (const entry of entries) {
          const listingId = (entry.target as HTMLElement).dataset.listingId;
          if (!listingId) continue;
          if (entry.isIntersecting) {
            if (!visibleSince.has(listingId)) visibleSince.set(listingId, now);
          } else {
            const start = visibleSince.get(listingId);
            if (start !== undefined) {
              dwell.set(listingId, (dwell.get(listingId) ?? 0) + (now - start));
              visibleSince.delete(listingId);
            }
          }
        }
      },
      { threshold: VISIBILITY_THRESHOLD },
    );

    for (const el of cardEls.current.values()) observer.observe(el);

    const flush = () => {
      const now = performance.now();
      // Close out every still-visible card's in-progress span, re-anchoring its
      // timer to now so the flushed span is never counted a second time.
      for (const [listingId, start] of visibleSince) {
        dwell.set(listingId, (dwell.get(listingId) ?? 0) + (now - start));
        visibleSince.set(listingId, now);
      }
      for (const [listingId, durationMs] of dwell) {
        if (durationMs < MIN_DWELL_MS) continue;
        const blob = new Blob([JSON.stringify({ listingId, durationMs: Math.round(durationMs) })], {
          type: 'application/json',
        });
        navigator.sendBeacon?.(`/api/p/${token}/view`, blob);
      }
      // Reset accumulators so a return-to-tab or later flush starts fresh.
      dwell.clear();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', flush);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', flush);
    };
    // Re-run only when the token or the set of listings changes.
  }, [token, listingKey]);

  return registerCard;
}

function PageSkeleton() {
  return (
    <div className="mx-auto min-h-dvh max-w-content bg-surface">
      <div className="space-y-3.5 p-4">
        <div className="h-20 animate-pulse rounded-card bg-card" />
        <div className="h-80 animate-pulse rounded-card bg-card" />
        <div className="h-80 animate-pulse rounded-card bg-card" />
      </div>
    </div>
  );
}

export function PresentationPage() {
  const { token = '' } = useParams();
  const { data, isPending, error } = useQuery(presentationQuery(token));
  const registerCard = usePresentationViewAnalytics(token, data?.items);

  if (isPending) return <PageSkeleton />;

  if (error) {
    // An unknown token gets the plain "not found" page (mirrors the listing page).
    if (error instanceof ApiError && error.status === 404) return <NotFoundView />;
    return <p className="p-6 text-center text-ink-2">Taqdimotni yuklab bo'lmadi.</p>;
  }

  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface pb-10">
      <header className="bg-linear-to-br from-violet-600 to-accent-dark px-5 pt-8 pb-7 text-white">
        <p className="text-[12.5px] font-bold tracking-wide text-white/70 uppercase">Taqdimot</p>
        <h1 className="mt-1.5 text-2xl leading-tight font-extrabold">{data.title}</h1>
        <p className="mt-2.5 text-[13.5px] font-semibold text-white/85">
          {data.realtorName}
          {data.agency && ` · ${data.agency}`} tayyorladi
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4">
        {data.items.map((item) => (
          <section
            key={item.listingId}
            ref={registerCard(item.listingId)}
            data-listing-id={item.listingId}
            className="flex flex-col gap-2.5"
          >
            {item.note && (
              <div className="rounded-card border border-accent/20 bg-accent-soft px-4 py-3">
                <p className="text-[11.5px] font-extrabold tracking-wide text-accent uppercase">
                  Rieltor izohi
                </p>
                <p className="mt-1 text-[14px] leading-[1.5] font-medium text-ink-2">{item.note}</p>
              </div>
            )}

            <ListingCard listing={item.listing} />

            <Link
              to={`/obj/${item.listingId}`}
              className="block rounded-[12px] border-[1.5px] border-accent py-2.5 text-center text-[14px] font-extrabold text-accent active:bg-accent-soft"
            >
              Batafsil
            </Link>
          </section>
        ))}
      </div>
    </main>
  );
}
