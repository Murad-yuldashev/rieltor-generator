import { Link, NavLink } from 'react-router';
import { NAV_TABS } from '@/shared/config/nav';
import { Icon } from '@/shared/ui/icon';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-linear-to-br from-violet-600 to-accent-dark text-white">
        <Icon name="homeSolid" className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </span>
      <span className="text-[17px] font-extrabold tracking-tight">
        Rieltor<span className="text-accent">App</span>
      </span>
    </Link>
  );
}

/* There is no city picker yet — every listing is in Tashkent. So this is a
   plain label rather than a button that would do nothing. */
function CityLabel() {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-[7px] text-[13px] font-semibold text-ink-2">
      <Icon name="pin" className="h-[13px] w-[13px] text-accent" strokeWidth={2.4} />
      Toshkent
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/92 backdrop-blur-xl">
      {/* Phone header: logo on the left, city on the right. Unchanged below 1440px. */}
      <div className="flex items-center justify-between px-4 py-3 desk:hidden">
        <Logo />
        <CityLabel />
      </div>

      {/* Desktop header: the four bottom-nav destinations move up here, because
          the tab bar is hidden from 1440px. */}
      <div className="mx-auto hidden w-full max-w-desk items-center gap-10 px-8 py-3.5 desk:flex">
        <Logo />

        <nav aria-label="Asosiy menyu" className="flex items-center gap-1">
          {NAV_TABS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              // Without `end` the home tab would read as active on every route.
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
                  isActive ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-surface'
                }`
              }
            >
              <Icon name={icon} className="h-[17px] w-[17px]" strokeWidth={2.1} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto">
          <CityLabel />
        </div>
      </div>
    </header>
  );
}
