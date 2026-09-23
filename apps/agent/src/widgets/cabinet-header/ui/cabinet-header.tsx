import { Link, NavLink, useLocation } from 'react-router';
import { useSession } from '@/entities/session';
import { Icon, type IconName } from '@/shared/ui/icon';

// `alsoActiveFor`: a route prefix that should ALSO light this section, for detail
// routes not nested under the section's own path. The agent cabinet needs none —
// every detail route (/collections/:id, /presentations/:id) is already prefixed
// by its section, so a NavLink prefix match reaches it. The field is kept so the
// rendering stays identical to the CRM header.
const SECTIONS: {
  to: string;
  end?: boolean;
  icon: IconName;
  label: string;
  alsoActiveFor?: string;
}[] = [
  { to: '/', end: true, icon: 'home', label: 'Boshqaruv' },
  { to: '/leads', icon: 'phone', label: 'Mijozlar' },
  { to: '/browse', icon: 'search', label: 'Qidiruv' },
  { to: '/my-listings', icon: 'camera', label: "Mening e'lonlarim" },
  { to: '/collections', icon: 'heart', label: 'Kolleksiyalar' },
  { to: '/presentations', icon: 'share', label: 'Taqdimotlar' },
  { to: '/notes', icon: 'doc', label: 'Eslatmalar' },
  { to: '/wallet', icon: 'money', label: 'Hisob' },
  { to: '/profile', icon: 'user', label: 'Profil' },
];

function Brand() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5">
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-linear-to-br from-accent to-accent-dark text-white">
        <Icon name="homeSolid" className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </span>
      <span className="text-[17px] font-extrabold tracking-tight">
        Rieltor<span className="text-accent">Agent</span>
      </span>
    </Link>
  );
}

function Account() {
  const { user } = useSession();
  if (!user) return null;
  const label = user.name ?? user.phone;
  return (
    <div className="ml-auto flex shrink-0 items-center gap-2.5 pl-1">
      {user.photoUrl ? (
        <img
          src={user.photoUrl}
          alt={label}
          width={34}
          height={34}
          className="h-[34px] w-[34px] shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[13px] font-extrabold text-accent">
          {label.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="hidden max-w-[160px] truncate text-[14px] font-bold text-ink md:block">
        {label}
      </span>
    </div>
  );
}

export function CabinetHeader() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/92 backdrop-blur-xl">
      {/* Inner container tiers MUST match CabinetShell's content column
          (md:max-w-tablet lg:max-w-laptop desk:max-w-desk) so the brand/nav
          left/right-align with the page content beneath at every tier. */}
      <div className="mx-auto flex w-full max-w-content items-center gap-3 px-4 py-3 md:max-w-tablet md:gap-6 md:px-6 lg:max-w-laptop lg:gap-8 desk:max-w-desk desk:gap-10 desk:px-8">
        <Brand />
        {/* Scrollable on phone (nav wider than 480), inline from md. */}
        <nav
          aria-label="Kabinet menyusi"
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto no-scrollbar"
        >
          {SECTIONS.map(({ to, end, icon, label, alsoActiveFor }) => {
            const forceActive = !!alsoActiveFor && pathname.startsWith(alsoActiveFor);
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                aria-label={label}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
                    isActive || forceActive
                      ? 'bg-accent-soft text-accent'
                      : 'text-ink-2 hover:bg-surface'
                  }`
                }
              >
                <Icon name={icon} className="h-[17px] w-[17px]" strokeWidth={2.1} />
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            );
          })}
        </nav>
        <Account />
      </div>
    </header>
  );
}
