import { Outlet } from 'react-router';
import { BottomNav } from '@/widgets/bottom-nav';
import { SiteHeader } from '@/widgets/site-header';

/**
 * Shared frame for the bottom-nav pages.
 * The listing page stays outside this layout — it opens with a full-bleed
 * gallery and its own sticky CTA, where a bottom nav would only get in the way.
 *
 * Responsive tiers: <768 the 480px phone column + bottom tab bar; md (768) the
 * column grows to 720px, lg (1024) to 1040px, and the tab bar is replaced by the
 * top nav (its own `md:hidden`); desk (1440) the cap comes off for the CIAN
 * container. Phone (<768) and CIAN (>=1440) are frozen — the middle tiers are new.
 */
export function TabLayout() {
  return (
    <div className="mx-auto min-h-dvh max-w-content bg-surface pb-bottom-nav md:max-w-none md:pb-0 desk:max-w-none">
      <SiteHeader />

      {/* The outer div centres the column (max-w-tablet/laptop); pages keep their
          own px-4 through md/lg, then switch to desk:px-0 where this wrapper pads
          at desk — the same phone→desk handoff pattern, now with two tiers between. */}
      <div className="md:pt-4 md:pb-8 desk:mx-auto desk:w-full desk:max-w-desk desk:px-8 desk:pt-6 desk:pb-12">
        <Outlet />
      </div>

      <BottomNav />
    </div>
  );
}
