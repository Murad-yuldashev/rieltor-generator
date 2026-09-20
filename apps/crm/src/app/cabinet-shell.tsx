import { Outlet } from 'react-router';
import { CabinetHeader } from '@/widgets/cabinet-header';

/**
 * Shared frame for every developer-cabinet page. Provides the responsive
 * centred container (480 → md 720 → lg 1040 → desk 1440), so pages no longer
 * cap themselves at max-w-content. Nested inside DeveloperGuard, so it renders
 * only for a DEVELOPER — the become-developer onboarding (rendered by the guard
 * directly, not via Outlet) stays outside this shell.
 */
export function CabinetShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <CabinetHeader />
      {/* bg-surface lives on the CENTRED column (not a full-bleed outer), so the
          darker body frame (#e9e9ee) still frames it below 1440px and the frozen
          phone look is kept. The outer flex column owns min-h-dvh so the sticky
          header sits inside the viewport height (no overflow); the column flex-1
          fills the remainder. */}
      <div className="mx-auto w-full max-w-content flex-1 bg-surface px-4 py-6 md:max-w-tablet md:px-6 md:py-8 lg:max-w-laptop desk:max-w-desk desk:px-8 desk:py-10">
        <Outlet />
      </div>
    </div>
  );
}
