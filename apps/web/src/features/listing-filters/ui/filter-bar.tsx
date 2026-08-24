import type { Deal } from '@rieltor/shared';
import { LISTING_TYPE_META, LISTING_TYPES } from '@/entities/listing';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import type { TypeFilter } from '../model/criteria';

interface Props {
  deal: Deal;
  onDealChange: (deal: Deal) => void;
  type: TypeFilter;
  onTypeChange: (type: TypeFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
  /** Wired to the saved-search API in a later task; until then the button just sits there. */
  onSaveSearch?: () => void;
}

const DEALS: { value: Deal; label: string }[] = [
  { value: 'SALE', label: 'Sotib olish' },
  { value: 'RENT', label: 'Ijara' },
];

const CHIPS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Barchasi' },
  ...LISTING_TYPES.map((t) => ({ value: t as TypeFilter, label: LISTING_TYPE_META[t].chipLabel })),
];

function pillClass(active: boolean) {
  return cn(
    'shrink-0 rounded-full border px-[15px] py-2 text-[13.5px] font-semibold whitespace-nowrap transition-colors',
    active
      ? 'border-accent bg-accent text-white shadow-lg shadow-accent/30'
      : 'border-line bg-card text-ink-2 hover:bg-surface',
  );
}

/**
 * Sticky desktop filter row shown above the results (spec §2.1 "Filter bar").
 *
 * Desktop-only (`hidden desk:flex`) — below 1440px `ListingHero` and
 * `ListingFacets` keep doing this job, unchanged. Props mirror those two
 * components so a page can drive whichever one is visible at a given width
 * from the same filter state.
 */
export function FilterBar({
  deal,
  onDealChange,
  type,
  onTypeChange,
  search,
  onSearchChange,
  onSaveSearch,
}: Props) {
  return (
    <div className="hidden desk:sticky desk:top-[7.5rem] desk:z-40 desk:flex desk:items-center desk:gap-2.5 desk:border-b desk:border-line desk:bg-white desk:py-3">
      <div role="tablist" aria-label="Bitim turi" className="flex shrink-0 gap-2">
        {DEALS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={deal === value}
            onClick={() => onDealChange(value)}
            className={pillClass(deal === value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="h-6 w-px shrink-0 bg-line" />

      <div role="tablist" aria-label="Obyekt turi" className="flex shrink-0 gap-2">
        {CHIPS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={type === value}
            onClick={() => onTypeChange(value)}
            className={pillClass(type === value)}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2">
        <Icon name="search" className="h-[15px] w-[15px] shrink-0 text-ink-3" strokeWidth={2.2} />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tuman, majmua yoki ko'cha qidiring..."
          aria-label="Obyektlar bo'yicha qidiruv"
          className="w-full min-w-0 bg-transparent text-[13.5px] outline-none placeholder:text-ink-3"
        />
      </label>

      <button
        type="button"
        onClick={onSaveSearch}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] font-bold text-ink-2 transition-colors hover:bg-surface"
      >
        <Icon name="heart" className="h-[15px] w-[15px] text-accent" />
        Qidiruvni saqlash
      </button>
    </div>
  );
}
