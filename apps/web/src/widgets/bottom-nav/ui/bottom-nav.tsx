import { NavLink } from 'react-router';
import { Icon, type IconName } from '@/shared/ui/icon';

/** Single source: both the layout and the router are built from this list. */
export const NAV_TABS: { to: string; icon: IconName; label: string }[] = [
  { to: '/', icon: 'home', label: 'Bosh sahifa' },
  { to: '/search', icon: 'search', label: 'Qidiruv' },
  { to: '/favorites', icon: 'heart', label: 'Sevimlilar' },
  { to: '/contact', icon: 'phone', label: 'Aloqa' },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Asosiy menyu"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-content border-t border-line bg-white/95 px-1.5 pt-2 backdrop-blur-xl"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
    >
      {NAV_TABS.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          // Without `end` the home tab would read as active on every route.
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-[3px] text-[10.5px] font-bold ${
              isActive ? 'text-accent' : 'text-ink-3'
            }`
          }
        >
          <Icon name={icon} className="h-[21px] w-[21px]" strokeWidth={2.1} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
