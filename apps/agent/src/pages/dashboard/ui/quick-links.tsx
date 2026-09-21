import { Link } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { Icon, type IconName } from '@/shared/ui/icon';

/** Cabinet sections surfaced as a quick-nav list in the dashboard aside. */
const QUICK_LINKS: { to: string; icon: IconName; label: string }[] = [
  { to: '/leads', icon: 'chart', label: 'Leadlar' },
  { to: '/browse', icon: 'search', label: "E'lonlar" },
  { to: '/collections', icon: 'heart', label: "To'plamlar" },
  { to: '/presentations', icon: 'share', label: 'Taqdimotlar' },
  { to: '/notes', icon: 'doc', label: 'Eslatmalar' },
  { to: '/profile', icon: 'home', label: 'Profil' },
];

/** Quick-nav list to the cabinet's main sections. */
export function QuickLinks({ className }: { className?: string }) {
  return (
    <nav
      className={cn('rounded-card bg-card p-2 shadow-card', className)}
      aria-label="Tezkor havolalar"
    >
      <ul className="flex flex-col">
        {QUICK_LINKS.map(({ to, icon, label }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 hover:bg-surface"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <Icon name={icon} className="h-[17px] w-[17px]" strokeWidth={2.1} />
              </span>
              <span className="flex-1 text-[14px] font-semibold text-ink">{label}</span>
              <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={2.2} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
