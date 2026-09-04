import { NavLink } from 'react-router';
import { cn } from '@/shared/lib/cn';

// The cabinet's top-level sections. `end` keeps the Organization tab from
// staying active on `/complexes` (the index route `/` is a prefix of everything).
const LINKS = [
  { to: '/', label: 'Tashkilot', end: true },
  { to: '/complexes', label: 'Majmualar', end: false },
  { to: '/bookings', label: 'Bandlar', end: false },
  { to: '/wallet', label: 'Hisob', end: false },
];

/** Persistent section switcher shown at the top of every cabinet page. */
export function CabinetNav() {
  return (
    <nav className="flex gap-2">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            cn(
              'rounded-full px-4 py-2 text-[13px] font-semibold transition-colors',
              isActive ? 'bg-accent text-white' : 'bg-card text-ink-2 shadow-card',
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
