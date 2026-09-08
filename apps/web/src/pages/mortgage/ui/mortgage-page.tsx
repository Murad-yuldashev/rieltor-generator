import { Link } from 'react-router';
import { MortgageCalculator } from '@/features/mortgage';
import { Icon } from '@/shared/ui/icon';
import { SectionCard } from '@/shared/ui/section-card';

/** No SiteHeader/BottomNav — this route sits outside TabLayout, so a bare page needs at least a way back home. */
function TopBar() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-[640px] items-center justify-between px-4 py-3.5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-linear-to-br from-violet-600 to-accent-dark text-white">
            <Icon name="homeSolid" className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-extrabold tracking-tight">
            Rieltor<span className="text-accent">App</span>
          </span>
        </Link>
        <Link
          to="/"
          aria-label="Yopish"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-3 hover:bg-surface"
        >
          <Icon name="close" className="h-4 w-4" strokeWidth={2.2} />
        </Link>
      </div>
    </header>
  );
}

/**
 * Standalone ipoteka (mortgage) calculator. Public route, own light chrome, no
 * bottom-nav dependency — a buyer landing from a link shouldn't have to parse the
 * full site nav first. The buyer types the price, so no `initialPriceSom`.
 */
export function MortgagePage() {
  return (
    <div className="min-h-dvh bg-surface">
      <TopBar />

      <main className="mx-auto max-w-[640px] px-4 py-6 desk:py-12">
        <div className="mb-5 text-center desk:mb-8">
          <h1 className="text-[22px] leading-tight font-extrabold tracking-tight desk:text-[28px]">
            Ipoteka kalkulyatori 🏦
          </h1>
          <p className="mt-1.5 text-[13.5px] text-ink-2 desk:text-[15px]">
            Oylik to'lovni hisoblang — narx, boshlang'ich to'lov va bank dasturini tanlang
          </p>
        </div>

        <SectionCard className="desk:p-7">
          <MortgageCalculator />
        </SectionCard>
      </main>
    </div>
  );
}
