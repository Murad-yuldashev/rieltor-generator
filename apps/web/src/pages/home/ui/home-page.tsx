import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { ListingCard, listingsQuery } from '@/entities/listing';
import { useSession } from '@/entities/session';
import { LoginModal } from '@/features/auth';
import { FavoriteButton } from '@/features/favorites';
import {
  FilterBar,
  ListingFacets,
  ListingHero,
  SortSelect,
  serializeSearchQuery,
  useListingFilters,
} from '@/features/listing-filters';
import { useCreateSavedSearch } from '@/features/saved-search';
import { useInfiniteScroll } from '@/shared/lib/use-infinite-scroll';
import { Icon } from '@/shared/ui/icon';

/** How many cards fill the first screen — the rest arrive via infinite scroll. */
const PAGE_SIZE = 8;

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
  const { isAuthenticated } = useSession();
  const { create: createSavedSearch } = useCreateSavedSearch();
  const [loginOpen, setLoginOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [justSaved]);

  const shown = filters.visible.slice(0, limit);
  const hasMore = filters.visible.length > shown.length;
  const sentinelRef = useInfiniteScroll(hasMore, shown.length, () =>
    setLimit((n) => n + PAGE_SIZE),
  );

  // Changing a filter rewinds the list; otherwise a new slice would open
  // already "expanded" from the previous one.
  function resetPaging<T>(apply: (value: T) => void) {
    return (value: T) => {
      apply(value);
      setLimit(PAGE_SIZE);
    };
  }

  async function handleSaveSearch() {
    // Logged out: the save can't be attributed to anyone yet — ask first,
    // same pattern the wizard uses for its own auth gate.
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }

    const query = serializeSearchQuery({
      deal: filters.deal,
      type: filters.type,
      search: filters.search,
    });

    try {
      await createSavedSearch({ name: filters.search.trim() || 'Saqlangan qidiruv', query });
      setJustSaved(true);
    } catch {
      // Nothing surfaces a toast in this app yet — a silent no-op beats a crash.
    }
  }

  return (
    <main>
      <ListingHero search={filters.search} onSearchChange={resetPaging(filters.setSearch)} />

      {/* "Qidiryapman" board entry — sits beside the valuation hook as the other
          seller-facing way in: browse buyers' reverse requests. Renders the same
          at every width (a plain card), like the valuation banner above it. */}
      <Link
        to="/requests"
        className="mx-4 mt-3 flex items-center gap-3 rounded-card border border-line/60 bg-card p-4 shadow-card desk:mx-0 desk:mt-4"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-accent-soft text-accent">
          <Icon name="search" className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold text-ink">Qidiryapman</p>
          <p className="text-[12.5px] font-semibold text-ink-2">
            Xaridorlar so'rovlari — mijoz o'zi sizni topadi
          </p>
        </div>
        <Icon name="chevronRight" className="h-5 w-5 shrink-0 text-ink-3" strokeWidth={2.4} />
      </Link>

      {/* Desktop swaps the phone's sidebar for this sticky row above a
          full-width grid (CIAN-style — spec §2.1); ListingFacets keeps doing
          the same job below 1440px. */}
      <FilterBar
        deal={filters.deal}
        onDealChange={resetPaging(filters.setDeal)}
        type={filters.type}
        onTypeChange={resetPaging(filters.setType)}
        search={filters.search}
        onSearchChange={resetPaging(filters.setSearch)}
        onSaveSearch={handleSaveSearch}
      />

      {justSaved && (
        <p className="hidden text-[12.5px] font-bold text-brand-green desk:block desk:pt-2">
          Qidiruv saqlandi ✓ — "Mening e'lonlarim" sahifasida ko'rishingiz mumkin.
        </p>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* One DOM order serves both layouts: on a phone these two blocks simply
          stack; at 1440px the facets block is dropped (FilterBar replaces it)
          and the results run full width. */}
      <div className="desk:mt-7">
        <div className="desk:hidden">
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

          <div className="flex flex-col gap-4 px-4 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3 desk:grid-cols-4 desk:gap-5 desk:px-0">
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

          {/* Infinite scroll: this sentinel auto-loads the next slice as it nears the viewport. */}
          {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}

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
