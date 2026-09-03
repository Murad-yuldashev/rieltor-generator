import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TASHKENT_DISTRICTS } from '@rieltor/shared';
import { ComplexCard, complexesQuery } from '@/entities/complex';
import { useInfiniteScroll } from '@/shared/lib/use-infinite-scroll';
import { PageHeading } from '@/shared/ui/page-heading';

/** How many cards fill the first screen — the rest arrive via infinite scroll. */
const PAGE_SIZE = 8;

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
      <div className="aspect-[4/3] w-full animate-pulse bg-line" />
      <div className="space-y-2.5 p-4">
        <div className="h-6 w-2/3 animate-pulse rounded bg-line" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-line" />
        <div className="h-4 w-2/5 animate-pulse rounded bg-line" />
      </div>
    </div>
  );
}

export function ComplexesPage() {
  const { data, isPending, isError } = useQuery(complexesQuery());
  const [district, setDistrict] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  // The facet stays canonical (TASHKENT_DISTRICTS order + spelling) but drops any
  // district with no published complex, so no dead chip is ever offered.
  const facets = useMemo(() => {
    const present = new Set((data ?? []).map((c) => c.district));
    return TASHKENT_DISTRICTS.filter((d) => present.has(d));
  }, [data]);

  const matches = useMemo(
    () => (district === null ? (data ?? []) : (data ?? []).filter((c) => c.district === district)),
    [data, district],
  );

  const shown = matches.slice(0, limit);
  const hasMore = matches.length > shown.length;
  const sentinelRef = useInfiniteScroll(hasMore, shown.length, () =>
    setLimit((n) => n + PAGE_SIZE),
  );

  function pickDistrict(next: string | null) {
    setDistrict(next);
    setLimit(PAGE_SIZE);
  }

  return (
    <main>
      <PageHeading
        title="Turar-joy majmualari"
        subtitle="Quruvchilardan yangi novostroykalar — to'g'ridan-to'g'ri"
      />

      {facets.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3.5 pb-1 desk:px-0">
          <button
            type="button"
            onClick={() => pickDistrict(null)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors ${
              district === null ? 'bg-accent text-white' : 'bg-surface text-ink-2'
            }`}
          >
            Barchasi
          </button>
          {facets.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => pickDistrict(d)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors ${
                district === d ? 'bg-accent text-white' : 'bg-surface text-ink-2'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 px-4 pt-3.5 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3 desk:grid-cols-4 desk:gap-5 desk:px-0 desk:pt-5">
        {isPending && Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}

        {shown.map((complex, i) => (
          <ComplexCard key={complex.slug} complex={complex} isFirst={i === 0} />
        ))}
      </div>

      {isError && (
        <p className="px-6 py-12 text-center text-[15px] text-ink-2">
          Majmualarni yuklab bo'lmadi. Keyinroq urinib ko'ring.
        </p>
      )}

      {!isPending && !isError && shown.length === 0 && (
        <p className="px-6 py-12 text-center text-[15px] leading-relaxed text-ink-2">
          Hozircha turar-joy majmualari yo'q. Keyinroq qayta kiring.
        </p>
      )}

      {/* Infinite scroll: this sentinel auto-loads the next slice as it nears the viewport. */}
      {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}
    </main>
  );
}
