import type { Deal } from '@rieltor/shared';
import { LISTING_TYPE_META, LISTING_TYPES } from '@/entities/listing';
import { cn } from '@/shared/lib/cn';
import type { TypeFilter } from '../model/criteria';

interface Props {
  deal: Deal;
  onDealChange: (deal: Deal) => void;
  type: TypeFilter;
  onTypeChange: (type: TypeFilter) => void;
}

const DEALS: { value: Deal; label: string }[] = [
  { value: 'SALE', label: 'Sotib olish' },
  { value: 'RENT', label: 'Ijara' },
];

const CHIPS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Barchasi' },
  ...LISTING_TYPES.map((t) => ({ value: t as TypeFilter, label: LISTING_TYPE_META[t].chipLabel })),
];

/**
 * Deal segment and the property-type chips.
 *
 * On a phone the chips are one scrollable row. In the desktop sidebar there is
 * no room to scroll sideways, so they wrap instead.
 */
export function ListingFacets({ deal, onDealChange, type, onTypeChange }: Props) {
  return (
    <>
      <div
        role="tablist"
        aria-label="Bitim turi"
        className="mx-4 mt-3.5 flex rounded-xl bg-[#e8e8ee] p-1 desk:mx-0 desk:mt-0"
      >
        {DEALS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={deal === value}
            onClick={() => onDealChange(value)}
            className={cn(
              'flex-1 rounded-[9px] py-2.5 text-sm font-bold transition-colors',
              deal === value ? 'bg-white text-ink shadow-sm' : 'text-ink-2',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="hidden text-[13px] font-bold text-ink-2 desk:mt-6 desk:mb-2.5 desk:block">
        Obyekt turi
      </p>

      <div
        role="tablist"
        aria-label="Obyekt turi"
        className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3.5 pb-1 desk:flex-wrap desk:overflow-visible desk:px-0 desk:pt-0 desk:pb-0"
      >
        {CHIPS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={type === value}
            onClick={() => onTypeChange(value)}
            className={cn(
              'shrink-0 rounded-full border px-[15px] py-2.5 text-[13.5px] font-semibold transition-colors',
              type === value
                ? 'border-accent bg-accent text-white shadow-lg shadow-accent/30'
                : 'border-line bg-card text-ink-2',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
