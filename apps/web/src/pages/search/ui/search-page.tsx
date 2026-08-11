import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ListingSummary } from '@rieltor/shared';
import { ListingCard, distanceLabel, listingsQuery } from '@/entities/listing';
import { FavoriteButton } from '@/features/favorites';
import {
  EMPTY_CRITERIA,
  FilterPanel,
  filterListings,
  type Criteria,
} from '@/features/listing-filters';
import { useSearchHistory } from '@/features/search-history';
import { useUserLocation } from '@/features/user-location';
import { Icon } from '@/shared/ui/icon';
import { PageHeading } from '@/shared/ui/page-heading';
import { SectionCard } from '@/shared/ui/section-card';

/** The mockup lists four districts. */
const TOP_DISTRICTS = 4;

/** How many result cards are shown before "Ko'proq ko'rsatish". */
const PAGE_SIZE = 6;

function countByDistrict(listings: ListingSummary[] | undefined) {
  const counts = new Map<string, number>();
  for (const listing of listings ?? []) {
    counts.set(listing.district, (counts.get(listing.district) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_DISTRICTS)
    .map(([district, count]) => ({ district, count }));
}

export function SearchPage() {
  const { data } = useQuery(listingsQuery());
  const { recent, remember, clear: clearHistory } = useSearchHistory();
  const { location } = useUserLocation();
  const origin = location ? { lat: location.lat, lng: location.lng } : null;

  const [criteria, setCriteria] = useState<Criteria>(EMPTY_CRITERIA);
  // Uncontrolled <input>s hold the price/area text, so "clear" rebuilds the
  // panel under a fresh key instead of tracking every raw string in state.
  const [panelKey, setPanelKey] = useState(0);
  // Results stay hidden until the user asks for them — the page opens as a
  // filter form, not as a listing feed.
  const [submitted, setSubmitted] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [openMapId, setOpenMapId] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Same function the home list uses, so the counter and the results always agree.
  const matches = filterListings(data, criteria, origin);
  const districts = countByDistrict(data);
  const shown = matches.slice(0, limit);

  function submit(next: Criteria = criteria) {
    setCriteria(next);
    remember(next.search);
    setSubmitted(true);
    setLimit(PAGE_SIZE);
    // Let React paint the results section before scrolling to it.
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }

  function reset() {
    setCriteria(EMPTY_CRITERIA);
    setPanelKey((n) => n + 1);
    setSubmitted(false);
  }

  return (
    <main>
      <PageHeading title="Qidiruv" subtitle="Filtrlar orqali o'zingizga mosini toping" />

      <form
        className="px-4 pt-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="flex items-center gap-2.5 rounded-[14px] border border-line bg-card px-3.5 py-3 shadow-card">
          <Icon name="search" className="h-[17px] w-[17px] text-ink-3" strokeWidth={2.2} />
          <input
            type="search"
            value={criteria.search}
            onChange={(e) => setCriteria({ ...criteria, search: e.target.value })}
            placeholder="Masalan: Kashtan majmuasi..."
            aria-label="Obyektlar bo'yicha qidiruv"
            className="w-full bg-transparent text-[14.5px] outline-none placeholder:text-ink-3"
          />
        </label>
      </form>

      <div className="flex flex-col gap-3.5 p-4">
        {recent.length > 0 && (
          <SectionCard
            title="So'nggi qidiruvlar"
            action={
              <button
                type="button"
                onClick={clearHistory}
                className="shrink-0 text-[13px] font-bold text-ink-3"
              >
                Tozalash ✕
              </button>
            }
          >
            {/* Capped at two rows: chips are a fixed 36px tall with an 8px gap, so
                36 + 8 + 36 = 80px. A third row starts below that and is clipped,
                however wide the individual queries turn out to be. */}
            <div className="flex max-h-20 flex-wrap gap-2 overflow-hidden">
              {recent.map((query) => (
                <button
                  key={query}
                  type="button"
                  onClick={() => submit({ ...criteria, search: query })}
                  className="flex h-9 max-w-full items-center gap-1.5 rounded-full bg-surface px-3.5 text-[13px] font-bold text-ink-2"
                >
                  <Icon name="clock" className="h-3.5 w-3.5 text-ink-3" />
                  <span className="truncate">{query}</span>
                </button>
              ))}
            </div>
          </SectionCard>
        )}

        {districts.length > 0 && (
          <SectionCard title="Ommabop tumanlar">
            <ul className="-my-1">
              {districts.map(({ district, count }, i) => (
                <li key={district}>
                  <button
                    type="button"
                    onClick={() => submit({ ...EMPTY_CRITERIA, search: district })}
                    className={`flex w-full items-center gap-3 py-3 text-left ${
                      i > 0 ? 'border-t border-line' : ''
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <Icon name="pin" className="h-[18px] w-[18px]" strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold">{district}</span>
                      <span className="block text-xs font-semibold text-ink-3">
                        {count} ta obyekt
                      </span>
                    </span>
                    <Icon name="chevronRight" className="h-4 w-4 text-ink-3" />
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        <SectionCard title="Filtrlar">
          <FilterPanel key={panelKey} value={criteria} onChange={setCriteria} />

          <button
            type="button"
            onClick={() => submit()}
            className="mt-5 w-full rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35"
          >
            Natijalarni ko'rsatish · {matches.length} ta
          </button>
          <button
            type="button"
            onClick={reset}
            className="mt-2.5 w-full py-2 text-[13px] font-bold text-ink-3"
          >
            Filtrlarni tozalash
          </button>
        </SectionCard>

        {submitted && (
          <div ref={resultsRef} className="scroll-mt-16">
            <div className="flex items-center justify-between pt-1 pb-3">
              <p className="text-[15px] font-extrabold">Natijalar · {matches.length} ta</p>
              {matches.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-full bg-accent-soft px-3.5 py-2 text-[13px] font-bold text-accent"
                >
                  Tozalash ✕
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {shown.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  favoriteSlot={<FavoriteButton id={listing.id} />}
                  distanceLabel={distanceLabel(listing, origin)}
                  mapOpen={openMapId === listing.id}
                  onToggleMap={() => setOpenMapId((id) => (id === listing.id ? null : listing.id))}
                />
              ))}
            </div>

            {matches.length === 0 && (
              <p className="px-2 py-10 text-center text-[15px] leading-relaxed text-ink-2">
                Bu shartlarga mos obyekt topilmadi. Filtrlarni kengaytirib ko'ring.
              </p>
            )}

            {matches.length > shown.length && (
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE_SIZE)}
                className="mt-4 w-full rounded-[14px] border-[1.5px] border-accent py-3.5 text-[14.5px] font-extrabold text-accent active:bg-accent-soft"
              >
                Ko'proq ko'rsatish
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
