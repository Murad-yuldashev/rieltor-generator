import type { ListingStatus } from '@rieltor/shared';

/**
 * How a listing status is presented — the SINGLE source (mirrors entities/listing's
 * LISTING_TYPE_META). Used by the status bar on the edit form and by the "Mening
 * e'lonlarim" cards on the cabinet page, so the two can never drift apart.
 *
 * `labelKey` is a cabinet ns i18n key, not display text — module scope has no
 * `useTranslation()`, so callers resolve it with `t(meta.labelKey)` (same pattern as
 * bottom-nav's NAV_TABS).
 */
export const STATUS_META: Record<ListingStatus, { labelKey: string; badge: string }> = {
  DRAFT: { labelKey: 'status.draft', badge: 'bg-ink-3/90' },
  PENDING: { labelKey: 'status.pending', badge: 'bg-brand-amber/90' },
  ACTIVE: { labelKey: 'status.active', badge: 'bg-brand-green/90' },
  RESERVED: { labelKey: 'status.reserved', badge: 'bg-accent/90' },
  SOLD: { labelKey: 'status.sold', badge: 'bg-ink/80' },
  RENTED: { labelKey: 'status.rented', badge: 'bg-ink/80' },
  ARCHIVED: { labelKey: 'status.archived', badge: 'bg-ink-3/70' },
};

/** i18n key for the button that requests a move TO this status (§7.4 transition
 *  table). Kept short — these sit in a wrapped button row on a 360px-wide screen.
 *  ACTIVE reuses `statusAction.activate`, the same key MyListingRow's toggle button
 *  uses for the identical "Faollashtirish" copy. */
export const TRANSITION_LABEL: Partial<Record<ListingStatus, string>> = {
  DRAFT: 'transition.toDraft',
  ACTIVE: 'statusAction.activate',
  RESERVED: 'transition.toReserved',
  SOLD: 'transition.toSold',
  RENTED: 'transition.toRented',
  ARCHIVED: 'transition.toArchived',
};
