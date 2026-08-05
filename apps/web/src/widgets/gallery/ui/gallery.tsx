import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import type { Image, ListingType } from '@rieltor/shared';
import { TypeBadge } from '@/entities/listing';
import { FavoriteButton } from '@/features/favorites';
import { Icon } from '@/shared/ui/icon';
import { ResponsiveImage } from '@/shared/ui/responsive-image';

interface Props {
  images: Image[];
  alt: string;
  /** Drives the coloured badge over the photo. */
  type: ListingType;
  /** The heart button marks this listing. */
  id: string;
}

function OverlayButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/95 text-ink shadow-lg"
    >
      {children}
    </button>
  );
}

/**
 * Swiping is handled by CSS scroll-snap — no carousel library.
 * iOS keeps its native momentum, the JS bundle stays small, and LCP is untouched.
 */
export function Gallery({ images, alt, type, id }: Props) {
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
    const data = { title: alt, url: window.location.href };
    // Native share sheet on phones, clipboard copy on desktop.
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard?.writeText(data.url);
    } catch {
      // The user dismissed the sheet or permission was denied — ignore it quietly.
    }
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
              // Each image gets an alt that states its position. An empty alt would
              // turn the <img> into role="presentation" (the test counts them with
              // getAllByRole('img')), and an identical alt would make a screen reader
              // repeat one sentence five times. These photos are rooms, not decoration.
              alt={`${alt} — ${i + 1}/${images.length}`}
              isFirst={i === 0}
              className="aspect-[4/3] w-full"
            />
          </div>
        ))}
      </div>

      {/* Top gradient keeps the white buttons legible over a light photo. */}
      <div className="absolute inset-x-0 top-0 flex justify-between bg-linear-to-b from-ink/35 to-transparent p-3.5">
        <OverlayButton
          label="Orqaga"
          // With no history (the link was opened directly) fall back to the home page.
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        >
          <Icon name="chevronLeft" className="h-[18px] w-[18px]" strokeWidth={2.4} />
        </OverlayButton>

        <div className="flex gap-2">
          <OverlayButton label="Ulashish" onClick={share}>
            <Icon name="share" className="h-4 w-4" strokeWidth={2.2} />
          </OverlayButton>
          <FavoriteButton id={id} className="h-[38px] w-[38px] shadow-lg" />
        </div>
      </div>

      <div className="absolute bottom-11 left-3.5">
        <TypeBadge type={type} />
      </div>

      {images.length > 1 && (
        <>
          <div className="absolute right-3.5 bottom-11 flex items-center gap-1.5 rounded-lg bg-ink/55 px-2.5 py-1 text-[11.5px] font-bold text-white backdrop-blur-sm">
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
