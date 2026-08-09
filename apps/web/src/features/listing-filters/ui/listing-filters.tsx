import { Link } from 'react-router';
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
}

const DEALS: { value: Deal; label: string }[] = [
  { value: 'SALE', label: 'Sotib olish' },
  { value: 'RENT', label: 'Ijara' },
];

const CHIPS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Barchasi' },
  ...LISTING_TYPES.map((t) => ({ value: t as TypeFilter, label: LISTING_TYPE_META[t].chipLabel })),
];

export function ListingFilters({
  deal,
  onDealChange,
  type,
  onTypeChange,
  search,
  onSearchChange,
}: Props) {
  return (
    <>
      <section className="px-4 pt-[18px]">
        <h1 className="text-[22px] leading-[1.25] font-extrabold tracking-tight">
          O'zingizga mos uyni toping 🏡
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-2">
          Toshkent bo'ylab tekshirilgan e'lonlar — har kuni yangilanadi
        </p>

        <div className="mt-3.5 flex gap-2.5">
          <label className="flex flex-1 items-center gap-2.5 rounded-[14px] border border-line bg-card px-3.5 py-3 shadow-card">
            <Icon name="search" className="h-[17px] w-[17px] text-ink-3" strokeWidth={2.2} />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tuman, majmua yoki ko'cha qidiring..."
              aria-label="Obyektlar bo'yicha qidiruv"
              className="w-full bg-transparent text-[14.5px] outline-none placeholder:text-ink-3"
            />
          </label>

          {/* The full filter panel (price range, room count, area) lives on the
              search page, so this button just takes the user there. */}
          <Link
            to="/search"
            aria-label="Kengaytirilgan filtrlar"
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark text-white shadow-lg shadow-accent/35"
          >
            <Icon name="filter" className="h-[19px] w-[19px]" strokeWidth={2.2} />
          </Link>
        </div>
      </section>

      <div
        role="tablist"
        aria-label="Bitim turi"
        className="mx-4 mt-3.5 flex rounded-xl bg-[#e8e8ee] p-1"
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

      <div
        role="tablist"
        aria-label="Obyekt turi"
        className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3.5 pb-1"
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
