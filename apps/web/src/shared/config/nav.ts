import type { IconName } from '@/shared/ui/icon';

/**
 * The main sections. Two widgets draw them — the bottom tab bar on phones and
 * the horizontal header nav on desktop — and FSD forbids one widget from
 * importing another, so the list lives here rather than next to either of them.
 */
export const NAV_TABS: { to: string; icon: IconName; label: string }[] = [
  { to: '/', icon: 'home', label: 'Bosh sahifa' },
  { to: '/search', icon: 'search', label: 'Qidiruv' },
  // The `floor` (multi-storey) glyph is the closest building/tower icon in the set.
  { to: '/jk', icon: 'floor', label: 'Novostroykalar' },
  { to: '/favorites', icon: 'heart', label: 'Sevimlilar' },
  { to: '/contact', icon: 'phone', label: 'Aloqa' },
];
