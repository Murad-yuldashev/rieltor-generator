import { Outlet } from 'react-router';
import { BottomNav } from '@/widgets/bottom-nav';
import { SiteHeader } from '@/widgets/site-header';

/**
 * Shared frame for the bottom-nav pages.
 * The listing page stays outside this layout — it opens with a full-bleed
 * gallery and its own sticky CTA, where a bottom nav would only get in the way.
 */
export function TabLayout() {
  return (
    <div
      className="mx-auto min-h-dvh max-w-content bg-surface"
      style={{ paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))' }}
    >
      <SiteHeader />
      <Outlet />
      <BottomNav />
    </div>
  );
}
