import { useEffect, useRef, useState } from 'react';
import type { Rasm } from '@rieltor/shared';
import { ResponsiveImage } from '@/shared/ui/responsive-image';

interface Props {
  rasmlar: Rasm[];
  alt: string;
}

/**
 * Svayp CSS scroll-snap orqali — kutubxonasiz.
 * iOS'da native momentum ishlaydi, JS bundle o'smaydi, LCP'ga xalaqit bermaydi.
 */
export function Gallery({ rasmlar, alt }: Props) {
  const [faol, setFaol] = useState(0);
  const lentaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lenta = lentaRef.current;
    if (!lenta || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (yozuvlar) => {
        for (const yozuv of yozuvlar) {
          if (!yozuv.isIntersecting) continue;
          const index = Number((yozuv.target as HTMLElement).dataset.index);
          if (!Number.isNaN(index)) setFaol(index);
        }
      },
      { root: lenta, threshold: 0.6 },
    );

    for (const bola of lenta.children) observer.observe(bola);
    return () => observer.disconnect();
  }, [rasmlar.length]);

  function nuqtagaOt(index: number) {
    const bola = lentaRef.current?.children[index];
    bola?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }

  return (
    <div className="relative">
      <div
        ref={lentaRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {rasmlar.map((rasm, i) => (
          <div key={rasm.base} data-index={i} className="w-full shrink-0 snap-start">
            <ResponsiveImage
              rasm={rasm}
              // Har rasmga o'z o'rnini bildiruvchi alt. Bo'sh alt bo'lsa <img>
              // role="presentation" ga aylanadi (test getAllByRole('img') bilan
              // sanaydi), bir xil alt bo'lsa esa ekran o'quvchi bitta jumlani
              // besh marta o'qiydi. Bu rasmlar bezak emas — uyning xonalari.
              alt={`${alt} — ${i + 1}/${rasmlar.length}`}
              birinchi={i === 0}
              className="aspect-[4/3] w-full"
            />
          </div>
        ))}
      </div>

      {rasmlar.length > 1 && (
        <div
          role="tablist"
          aria-label="Rasmlar"
          className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5"
        >
          {rasmlar.map((rasm, i) => (
            <button
              key={rasm.base}
              type="button"
              role="tab"
              aria-selected={i === faol}
              aria-label={`${i + 1}-rasm`}
              onClick={() => nuqtagaOt(i)}
              className={
                i === faol
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
