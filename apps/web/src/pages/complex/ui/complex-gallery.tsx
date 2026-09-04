import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { IMAGE_SIZES_GALLERY, type Image } from '@rieltor/shared';
import { Icon } from '@/shared/ui/icon';
import { ResponsiveImage } from '@/shared/ui/responsive-image';

interface Props {
  images: Image[];
  /** The complex name — the alt base and the share-sheet title. */
  name: string;
}

/**
 * The hero gallery mirrors the listing `Gallery` widget's approach — CSS
 * scroll-snap, no carousel library, so the JS bundle and LCP stay untouched —
 * but drops the listing-only chrome (a favourite heart and a listing TypeBadge
 * have no meaning for a complex). An empty gallery falls back to a placeholder
 * rather than a broken empty strip.
 */
export function ComplexGallery({ images, name }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(index)) setActiveIndex(index);
        }
      },
      { root: strip, threshold: 0.6 },
    );

    for (const child of strip.children) observer.observe(child);
    return () => observer.disconnect();
  }, [images.length]);

  function scrollToSlide(index: number) {
    const child = stripRef.current?.children[index];
    child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }

  async function share() {
    const data = { title: name, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard?.writeText(data.url);
    } catch {
      // The user dismissed the sheet or permission was denied — ignore it quietly.
    }
  }

  const backButton = (
    <button
      type="button"
      aria-label="Orqaga"
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/jk'))}
      className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/95 text-ink shadow-lg"
    >
      <Icon name="chevronLeft" className="h-[18px] w-[18px]" strokeWidth={2.4} />
    </button>
  );

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-line">
        <Icon name="home" className="h-12 w-12 text-ink-3" strokeWidth={1.6} />
        <div className="absolute inset-x-0 top-0 bg-linear-to-b from-ink/35 to-transparent p-3.5">
          {backButton}
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-ink">
      <div
        ref={stripRef}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {images.map((image, i) => (
          <div key={image.base} data-index={i} className="w-full shrink-0 snap-start">
            <ResponsiveImage
              image={image}
              alt={`${name} — ${i + 1}/${images.length}`}
              isFirst={i === 0}
              sizes={IMAGE_SIZES_GALLERY}
              className="aspect-[4/3] w-full"
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 top-0 flex justify-between bg-linear-to-b from-ink/35 to-transparent p-3.5">
        {backButton}
        <button
          type="button"
          aria-label="Ulashish"
          onClick={share}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/95 text-ink shadow-lg"
        >
          <Icon name="share" className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      {images.length > 1 && (
        <>
          <div className="absolute right-3.5 bottom-4 flex items-center gap-1.5 rounded-lg bg-ink/55 px-2.5 py-1 text-[11.5px] font-bold text-white backdrop-blur-sm">
            <Icon name="camera" className="h-3 w-3" strokeWidth={2.2} />
            {activeIndex + 1}/{images.length}
          </div>

          <div
            role="tablist"
            aria-label="Rasmlar"
            className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5"
          >
            {images.map((image, i) => (
              <button
                key={image.base}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`${i + 1}-rasm`}
                onClick={() => scrollToSlide(i)}
                className={
                  i === activeIndex
                    ? 'h-1.5 w-4 rounded-full bg-white transition-all'
                    : 'h-1.5 w-1.5 rounded-full bg-white/50 transition-all'
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
