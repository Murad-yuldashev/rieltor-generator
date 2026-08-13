import { Link } from 'react-router';
import { LocationChip } from '@/features/user-location';
import { LanguageSwitcher } from '@/shared/i18n';
import { Icon } from '@/shared/ui/icon';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/92 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-linear-to-br from-violet-600 to-accent-dark text-white">
            <Icon name="homeSolid" className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </span>
          <span className="text-[17px] font-extrabold tracking-tight">
            Rieltor<span className="text-accent">App</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          <LocationChip />
        </div>
      </div>
    </header>
  );
}
