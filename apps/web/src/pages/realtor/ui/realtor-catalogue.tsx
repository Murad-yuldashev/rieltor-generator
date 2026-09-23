import { useMemo, useState } from 'react';
import { type Deal } from '@rieltor/shared';
import type { ListingSummary } from '@rieltor/shared';
import { ListingCard } from '@/entities/listing';
import {
  EMPTY_CRITERIA,
  FilterPanel,
  SortSelect,
  ListingFacets,
  filterListings,
  type Criteria,
} from '@/features/listing-filters';
import { useInfiniteScroll } from '@/shared/lib/use-infinite-scroll';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

const PAGE_SIZE = 8;

/** The branded listings catalogue shared by the full microsite (RealtorPage) and the
 *  iframe embed (RealtorEmbed): deal/type facets, district chips, search, filters, grid. */
export function RealtorCatalogue({ listings }: { listings: ListingSummary[] }) {
  const [criteria, setCriteria] = useState<Criteria>(EMPTY_CRITERIA);
  const [district, setDistrict] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const districts = useMemo(
    () => [...new Set(listings.map((l) => l.district))].sort((a, b) => a.localeCompare(b)),
    [listings],
  );
  const scoped = district ? listings.filter((l) => l.district === district) : listings;
  const matches = filterListings(scoped, criteria); // filterListings sorts by criteria.sort
  const shown = matches.slice(0, limit);
  const hasMore = matches.length > shown.length;
  const sentinelRef = useInfiniteScroll(hasMore, shown.length, () =>
    setLimit((n) => n + PAGE_SIZE),
  );

  const applyCriteria = (next: Criteria) => {
    setCriteria(next);
    setLimit(PAGE_SIZE);
  };
  const patch = (p: Partial<Criteria>) => applyCriteria({ ...criteria, ...p });
  // deal change resets the district facet so a stale RENT-only chip can't strand a SALE view.
  const pickDeal = (deal: Deal) => {
    setDistrict(null);
    applyCriteria({ ...criteria, deal });
  };
  const pickDistrict = (d: string | null) => {
    setDistrict(d);
    setLimit(PAGE_SIZE);
  };

  return (
    <section className="p-4 desk:px-0">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-extrabold text-ink">E'lonlar · {matches.length} ta</h2>
        <SortSelect value={criteria.sort} onChange={(sort) => patch({ sort })} />
      </div>
      <ListingFacets
        deal={criteria.deal}
        onDealChange={pickDeal}
        type={criteria.type}
        onTypeChange={(type) => patch({ type })}
      />
      {districts.length > 0 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => pickDistrict(null)}
            className={cn(
              'shrink-0 rounded-full border px-[15px] py-2 text-[13px] font-semibold transition-colors',
              district === null
                ? 'border-accent bg-accent text-white'
                : 'border-line bg-card text-ink-2',
            )}
          >
            Barcha tumanlar
          </button>
          {districts.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => pickDistrict(d)}
              className={cn(
                'shrink-0 rounded-full border px-[15px] py-2 text-[13px] font-semibold transition-colors',
                district === d
                  ? 'border-accent bg-accent text-white'
                  : 'border-line bg-card text-ink-2',
              )}
            >
              {d}
            </button>
          ))}
        </div>
      )}
      <label className="mt-3 flex items-center gap-2.5 rounded-[14px] border border-line bg-card px-3.5 py-3">
        <Icon name="search" className="h-[17px] w-[17px] text-ink-3" strokeWidth={2.2} />
        <input
          type="search"
          value={criteria.search}
          onChange={(e) => patch({ search: e.target.value })}
          placeholder="Tuman, majmua yoki ko'cha qidiring..."
          aria-label="Qidiruv"
          className="w-full bg-transparent text-[14.5px] outline-none placeholder:text-ink-3"
        />
      </label>
      <details className="mt-3 rounded-card border border-line/60 bg-card p-4">
        <summary className="cursor-pointer text-[14px] font-bold text-ink">Filtrlar</summary>
        <div className="mt-3">
          <FilterPanel value={criteria} onChange={applyCriteria} />
        </div>
      </details>
      {matches.length === 0 ? (
        <p className="mt-4 rounded-card border border-line/60 bg-card px-4 py-10 text-center text-[14px] font-medium text-ink-2">
          Bu shartlarga mos e'lon topilmadi
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 desk:grid-cols-4 desk:gap-5">
          {shown.map((listing, i) => (
            <ListingCard key={listing.id} listing={listing} isFirst={i === 0} />
          ))}
        </div>
      )}
      {hasMore && <div ref={sentinelRef} aria-hidden className="mt-4 h-px w-full" />}
    </section>
  );
}
