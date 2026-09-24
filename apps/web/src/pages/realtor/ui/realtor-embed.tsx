import { useEffect, useRef, type MouseEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/client';
import { realtorQuery } from '../api';
import { brandThemeVars } from '@/shared/lib/brand-theme';
import { RealtorCatalogue } from './realtor-catalogue';

/**
 * The iframe-embedded catalogue: ONLY the branded listings grid (no hero/contact/
 * reviews chrome), themed by the realtor's brandColor. ListingCard links (/obj/:id)
 * are captured and opened in a NEW top-level tab so a click never navigates inside
 * the host page's iframe. Posts its content height to the parent (widget.js) so the
 * embed auto-resizes.
 */
export function RealtorEmbed({ slug }: { slug: string }) {
  const { data, isPending, error } = useQuery(realtorQuery(slug));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const post = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      window.parent?.postMessage({ type: 'rieltor-embed-height', height }, '*');
    };
    post();
    const ro = new ResizeObserver(post);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  // Capture phase runs before react-router's <Link> click handler; opening a new tab
  // and stopping propagation keeps the iframe on the catalogue.
  const openInNewTab = (e: MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a[href^="/obj/"]');
    if (anchor) {
      e.preventDefault();
      e.stopPropagation();
      window.open(anchor.getAttribute('href') ?? '/', '_blank', 'noopener');
    }
  };

  if (isPending) {
    return <div className="min-h-40 animate-pulse bg-card" />;
  }
  if (error) {
    const msg =
      error instanceof ApiError && error.status === 404 ? 'Sahifa topilmadi' : "Yuklab bo'lmadi";
    return <p className="p-6 text-center text-ink-2">{msg}</p>;
  }
  if (!data.siteActive) {
    return <p className="p-6 text-center text-ink-2">Bu sayt hozircha mavjud emas</p>;
  }

  return (
    <div ref={rootRef} style={brandThemeVars(data.brandColor)} onClickCapture={openInNewTab}>
      <RealtorCatalogue listings={data.listings} />
    </div>
  );
}
