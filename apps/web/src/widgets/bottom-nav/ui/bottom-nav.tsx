import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { Icon, type IconName } from '@/shared/ui/icon';

/** Single source: both the layout and the router are built from this list. */
export const NAV_TABS: { to: string; icon: IconName; labelKey: string }[] = [
  { to: '/', icon: 'home', labelKey: 'nav.home' },
  { to: '/search', icon: 'search', labelKey: 'nav.search' },
  { to: '/favorites', icon: 'heart', labelKey: 'nav.favorites' },
  { to: '/contact', icon: 'phone', labelKey: 'nav.contact' },
];

export function BottomNav() {
  const { t } = useTranslation('common');
  return (
    <nav
      aria-label={t('nav.menu')}
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-content border-t border-line bg-white/95 px-1.5 pt-2 backdrop-blur-xl"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
    >
      {NAV_TABS.map(({ to, icon, labelKey }) => (
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
          {t(labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
