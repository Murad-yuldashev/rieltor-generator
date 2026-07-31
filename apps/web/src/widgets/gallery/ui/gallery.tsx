import { useEffect, useRef, useState } from 'react';
import type { Image } from '@rieltor/shared';
import { ResponsiveImage } from '@/shared/ui/responsive-image';

interface Props {
  images: Image[];
  alt: string;
}

/**
 * Svayp CSS scroll-snap orqali — kutubxonasiz.
 * iOS'da native momentum ishlaydi, JS bundle o'smaydi, LCP'ga xalaqit bermaydi.
 */
export function Gallery({ images, alt }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative">
      <div
        ref={stripRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, i) => (
          <div key={image.base} data-index={i} className="w-full shrink-0 snap-start">
            <ResponsiveImage
              image={image}
              // Har rasmga o'z o'rnini bildiruvchi alt. Bo'sh alt bo'lsa <img>
              // role="presentation" ga aylanadi (test getAllByRole('img') bilan
              // sanaydi), bir xil alt bo'lsa esa ekran o'quvchi bitta jumlani
              // besh marta o'qiydi. Bu rasmlar bezak emas — uyning xonalari.
              alt={`${alt} — ${i + 1}/${images.length}`}
              isFirst={i === 0}
              className="aspect-[4/3] w-full"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div
          role="tablist"
          aria-label="Rasmlar"
          className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5"
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
                  ? 'h-1.5 w-4 rounded-full bg-white shadow'
                  : 'h-1.5 w-1.5 rounded-full bg-white/60 shadow'
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
