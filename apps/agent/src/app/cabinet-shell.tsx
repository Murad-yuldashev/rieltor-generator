import { Outlet } from 'react-router';
import { CabinetHeader } from '@/widgets/cabinet-header';

/**
 * Shared frame for every realtor-cabinet page. Provides the responsive
 * centred container (480 → md 720 → lg 1040 → desk 1440), so pages no longer
 * cap themselves at max-w-content. Nested inside CabinetGuard, so it renders
 * only for an active REALTOR — the become-realtor onboarding (rendered by the
 * guard directly, not via Outlet) and the /subscribe paywall (a route outside
 * the guard) both stay outside this shell.
 */
export function CabinetShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <CabinetHeader />
      {/* bg-surface + min-h-dvh live on the CENTRED column (spec §3, mirrors web
          tab-layout), NOT a full-bleed outer — so the darker body frame (#e9e9ee)
          still frames the column below 1440px and the frozen phone look is kept.
          The header stays full-bleed above it. */}
      <div className="mx-auto w-full max-w-content flex-1 bg-surface px-4 py-6 md:max-w-tablet md:px-6 md:py-8 lg:max-w-laptop desk:max-w-desk desk:px-8 desk:py-10">
        <Outlet />
      </div>
    </div>
  );
}
