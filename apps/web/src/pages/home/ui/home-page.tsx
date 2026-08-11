import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ListingCard, distanceLabel, listingsQuery } from '@/entities/listing';
import { FavoriteButton } from '@/features/favorites';
import {
  ListingFilters,
  SortSelect,
  useListingFilters,
  type Sort,
} from '@/features/listing-filters';
import { useUserLocation } from '@/features/user-location';
import { MAPS_ENABLED } from '@/shared/ui/static-map';
import { RealtorCta } from '@/widgets/realtor-cta';

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
  const { location, detect } = useUserLocation();
  const origin = location ? { lat: location.lat, lng: location.lng } : null;
  const filters = useListingFilters(data, origin);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [openMapId, setOpenMapId] = useState<string | null>(null);

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

  // Design spec §7: picking "Yaqin" without a known location asks for it, rather
  // than silently keeping the newest-first order with no distance badges.
  function changeSort(sort: Sort) {
    if (sort === 'NEAR' && !origin) detect();
    filters.setSort(sort);
  }

  return (
    <main>
      <RealtorCta />

      <ListingFilters
        deal={filters.deal}
        onDealChange={resetPaging(filters.setDeal)}
        type={filters.type}
        onTypeChange={resetPaging(filters.setType)}
        search={filters.search}
        onSearchChange={resetPaging(filters.setSearch)}
      />

      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <p className="min-w-0 truncate">
          <b className="text-[15px] font-extrabold">{filters.visible.length} ta obyekt</b>{' '}
          <span className="text-[13px] font-semibold text-ink-3">· bugun yangilandi</span>
        </p>
        <SortSelect value={filters.sort} onChange={resetPaging(changeSort)} />
      </div>

      <div className="flex flex-col gap-4 px-4">
        {isPending && Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}

        {shown.map((listing, i) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isFirst={i === 0}
            favoriteSlot={<FavoriteButton id={listing.id} />}
            distanceLabel={distanceLabel(listing, origin)}
            mapOpen={openMapId === listing.id}
            onToggleMap={
              MAPS_ENABLED
                ? () => setOpenMapId((id) => (id === listing.id ? null : listing.id))
                : undefined
            }
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
        <div className="px-4 pt-[18px] pb-1.5">
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE_SIZE)}
            className="w-full rounded-[14px] border-[1.5px] border-accent py-3.5 text-[14.5px] font-extrabold text-accent active:bg-accent-soft"
          >
            Ko'proq ko'rsatish
          </button>
        </div>
      )}

      {!hasMore && shown.length > 0 && (
        <p className="px-4 pt-3 pb-1 text-center text-xs font-semibold text-ink-3">
          Har kuni soat 09:00 da yangi e'lonlar qo'shiladi
        </p>
      )}
    </main>
  );
}
