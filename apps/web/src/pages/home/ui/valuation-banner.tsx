import { Link } from 'react-router';
import { Icon } from '@/shared/ui/icon';

/**
 * Entry point for the flagship seller-capture hook (spec A21). Unlike most
 * home-page blocks it renders identically at every width — a normal card,
 * no `desk:` split — so it's the simplest way in for a seller browsing on
 * either a phone or a desktop.
 */
export function ValuationBanner() {
  return (
    <Link
      to="/valuation"
      className="mx-4 mt-3.5 flex items-center gap-3 rounded-card bg-linear-to-br from-violet-600 to-accent-dark p-4 text-white shadow-card desk:mx-0 desk:mt-5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/15">
        <Icon name="money" className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-extrabold">Uyingiz qancha turadi?</p>
        <p className="text-[12.5px] font-semibold text-white/80">
          Bepul baholang — 1 daqiqada natija
        </p>
      </div>
      <Icon name="chevronRight" className="h-5 w-5 shrink-0 text-white/70" strokeWidth={2.4} />
    </Link>
  );
}
