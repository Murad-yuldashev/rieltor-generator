import { Link } from 'react-router';
import { Icon } from '@/shared/ui/icon';

interface Props {
  search: string;
  onSearchChange: (search: string) => void;
}

/**
 * Page title and the free-text search box.
 *
 * Split out from the deal/type facets so the desktop layout can keep this row
 * full width while the facets drop into a narrow sidebar beside the results.
 */
export function ListingHero({ search, onSearchChange }: Props) {
  return (
    <section className="px-4 pt-[18px] desk:px-0 desk:pt-0">
      <h1 className="text-[22px] leading-[1.25] font-extrabold tracking-tight desk:text-[30px]">
        O'zingizga mos uyni toping 🏡
      </h1>
      <p className="mt-1 text-[13.5px] text-ink-2 desk:text-[15px]">
        Toshkent bo'ylab tekshirilgan e'lonlar — har kuni yangilanadi
      </p>

      <div className="mt-3.5 flex gap-2.5 desk:mt-5 desk:max-w-2xl">
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
  );
}
