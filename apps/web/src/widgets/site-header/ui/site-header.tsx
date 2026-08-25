import { Link, NavLink } from 'react-router';
import { openLoginModal, useSession } from '@/entities/session';
import { NotificationBell } from '@/features/notification-bell';
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

/** Right-hand cluster of the desktop header: post-listing CTA, then account state. */
function AccountArea({ onOpenLogin }: { onOpenLogin: () => void }) {
  const { user, isAuthenticated } = useSession();

  return (
    <div className="ml-auto flex items-center gap-2 lg:gap-3">
      {/* City label is redundant with the mobile header and eats width — only the
          roomy CIAN header (desk) has space for it. */}
      <div className="hidden desk:flex">
        <CityLabel />
      </div>

      <Link
        to="/my/listings/new"
        className="rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-3.5 py-2.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 lg:px-4"
      >
        {/* Shorter label on tablet to save width. */}
        <span className="lg:hidden">+ E'lon</span>
        <span className="hidden lg:inline">+ E'lon joylash</span>
      </Link>

      <NotificationBell />

      {isAuthenticated && user ? (
        <div className="flex items-center gap-2.5 pl-1">
          {user.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.name ?? user.phone}
              width={34}
              height={34}
              className="h-[34px] w-[34px] shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[13px] font-extrabold text-accent">
              {(user.name ?? user.phone).slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="max-w-[140px] truncate text-[14px] font-bold text-ink">
            {user.name ?? user.phone}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenLogin}
          className="rounded-[14px] border border-line px-4 py-2.5 text-[15px] font-extrabold text-ink transition-colors hover:bg-surface"
        >
          Kirish
        </button>
      )}
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/92 backdrop-blur-xl">
      {/* Phone header: logo on the left, city + notification bell on the right.
            The bell self-gates on session, so it only appears for logged-in users.
            From 768px the top nav takes over (md:hidden). */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden">
        <Logo />
        <div className="flex items-center gap-2.5">
          <CityLabel />
          <NotificationBell />
        </div>
      </div>

      {/* Top nav: the four bottom-nav destinations move up here from 768px, where
            the tab bar is hidden. Fluid width + tighter spacing on tablet/laptop;
            the roomy CIAN sizing (max-w-desk, gap-10, px-8) returns at 1440px. */}
      <div className="mx-auto hidden w-full items-center gap-4 px-4 py-3.5 md:flex lg:gap-8 lg:px-6 desk:max-w-desk desk:gap-10 desk:px-8">
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
              {/* Icon-only on tablet so the whole nav fits at 768; labels return at 1024. */}
              <span className="hidden lg:inline">{label}</span>
            </NavLink>
          ))}

          {/* Not in NAV_TABS: that list is shared with the phone bottom nav, and the
                valuation entry point is desktop-only — the phone header stays untouched. */}
          <NavLink
            to="/valuation"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
                isActive ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-surface'
              }`
            }
          >
            <Icon name="money" className="h-[17px] w-[17px]" strokeWidth={2.1} />
            <span className="hidden lg:inline">Baholash</span>
          </NavLink>
        </nav>

        <AccountArea onOpenLogin={openLoginModal} />
      </div>
    </header>
  );
}
