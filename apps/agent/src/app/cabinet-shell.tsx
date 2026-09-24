import { Outlet } from 'react-router';
import { useProfile } from '@/features/profile';
import { brandThemeVars } from '@/shared/lib/brand-theme';
import { CabinetHeader } from '@/widgets/cabinet-header';

/**
 * Shared frame for every realtor-cabinet page. Applies the realtor's brand color
 * (Phase 11 / C15) to the whole cabinet subtree via CSS vars, so the header + all
 * pages' bg-accent/text-accent rebrand; null brandColor keeps the platform teal.
 * CabinetGuard gates on the session (not the profile), so on the very first paint
 * the profile query may still be pending — the subtree briefly shows the platform
 * default, then rebrands once it resolves (cached for later navigations). Harmless.
 */
export function CabinetShell() {
  const { data: profile } = useProfile();
  return (
    <div className="flex min-h-dvh flex-col" style={brandThemeVars(profile?.brandColor ?? null)}>
      <CabinetHeader />
      <div className="mx-auto w-full max-w-content flex-1 bg-surface px-4 py-6 md:max-w-tablet md:px-6 md:py-8 lg:max-w-laptop desk:max-w-desk desk:px-8 desk:py-10">
        <Outlet />
      </div>
    </div>
  );
}
