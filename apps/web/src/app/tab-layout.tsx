import { Outlet } from 'react-router';
import { BottomNav } from '@/widgets/bottom-nav';
import { SiteHeader } from '@/widgets/site-header';

/**
 * Shared frame for the bottom-nav pages.
 * The listing page stays outside this layout — it opens with a full-bleed
 * gallery and its own sticky CTA, where a bottom nav would only get in the way.
 *
 * Below 1440px this is the 480px phone column. At 1440px the column cap comes
 * off, the tab bar is hidden by its own `desk:hidden`, and the page content sits
 * in a centred 1440px container instead.
 */
export function TabLayout() {
  return (
    <div className="mx-auto min-h-dvh max-w-content bg-surface pb-bottom-nav desk:max-w-none">
      <SiteHeader />

      <div className="desk:mx-auto desk:w-full desk:max-w-desk desk:px-8 desk:pt-6 desk:pb-12">
        <Outlet />
      </div>

      <BottomNav />
    </div>
  );
}
