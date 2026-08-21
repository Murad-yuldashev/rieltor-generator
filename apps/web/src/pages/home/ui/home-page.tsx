import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ListingCard, listingsQuery } from '@/entities/listing';
import { FavoriteButton } from '@/features/favorites';
import {
  ListingFacets,
  ListingHero,
  SortSelect,
  useListingFilters,
} from '@/features/listing-filters';

/** How many cards fill the first screen — the rest arrive via "Ko'proq". */
const PAGE_SIZE = 6;

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
      <div className="aspect-[4/3] w-full animate-pulse bg-line" />
      <div className="space-y-2.5 p-4">
        <div className="h-5 w-1/2 animate-pulse rounded bg-line" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-line" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-line" />
      </div>
    </div>
  );
}

export function HomePage() {
  const { data, isPending, isError } = useQuery(listingsQuery());
  const filters = useListingFilters(data);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const shown = filters.visible.slice(0, limit);
  const hasMore = filters.visible.length > shown.length;

  // Changing a filter rewinds the list; otherwise a new slice would open
  // already "expanded" from the previous one.
  function resetPaging<T>(apply: (value: T) => void) {
    return (value: T) => {
      apply(value);
      setLimit(PAGE_SIZE);
    };
  }

  return (
    <main>
      <ListingHero search={filters.search} onSearchChange={resetPaging(filters.setSearch)} />

      {/* One DOM order serves both layouts: on a phone these two blocks simply
          stack, and at 1440px the first becomes a sticky sidebar beside the grid. */}
      <div className="desk:mt-7 desk:grid desk:grid-cols-[17rem_1fr] desk:items-start desk:gap-7">
        <div className="desk:sticky desk:top-24 desk:rounded-card desk:border desk:border-line/60 desk:bg-card desk:p-5 desk:shadow-card">
          <ListingFacets
            deal={filters.deal}
            onDealChange={resetPaging(filters.setDeal)}
            type={filters.type}
            onTypeChange={resetPaging(filters.setType)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 desk:px-0 desk:pt-0">
            <p className="min-w-0 truncate">
              <b className="text-[15px] font-extrabold">{filters.visible.length} ta obyekt</b>{' '}
              <span className="text-[13px] font-semibold text-ink-3">· bugun yangilandi</span>
            </p>
            <SortSelect value={filters.sort} onChange={resetPaging(filters.setSort)} />
          </div>

          <div className="flex flex-col gap-4 px-4 desk:grid desk:grid-cols-3 desk:gap-5 desk:px-0">
            {isPending && Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}

            {shown.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFirst={i === 0}
                favoriteSlot={<FavoriteButton id={listing.id} />}
              />
            ))}
          </div>

          {isError && (
            <p className="px-6 py-12 text-center text-[15px] text-ink-2">
              Obyektlarni yuklab bo'lmadi. Keyinroq urinib ko'ring.
            </p>
          )}

          {!isPending && !isError && shown.length === 0 && (
            <p className="px-6 py-12 text-center text-[15px] leading-relaxed text-ink-2">
              Qidiruvga mos obyekt topilmadi. Boshqa so'z bilan urinib ko'ring.
            </p>
          )}

          {hasMore && (
            <div className="px-4 pt-[18px] pb-1.5 desk:px-0 desk:pt-6">
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE_SIZE)}
                className="w-full rounded-[14px] border-[1.5px] border-accent py-3.5 text-[14.5px] font-extrabold text-accent active:bg-accent-soft desk:mx-auto desk:block desk:w-64 desk:hover:bg-accent-soft"
              >
                Ko'proq ko'rsatish
              </button>
            </div>
          )}

          {!hasMore && shown.length > 0 && (
            <p className="px-4 pt-3 pb-1 text-center text-xs font-semibold text-ink-3 desk:pt-6">
              Har kuni soat 09:00 da yangi e'lonlar qo'shiladi
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
