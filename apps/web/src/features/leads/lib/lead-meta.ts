import type { LeadStatus } from '@rieltor/shared';

/**
 * How a lead status is presented — the SINGLE source (mirrors features/listing-form's
 * STATUS_META/TRANSITION_LABEL). Used by the status badge and the advance buttons on
 * each cabinet lead row.
 *
 * `labelKey` is a cabinet ns i18n key, not display text — module scope has no
 * `useTranslation()`, so callers resolve it with `t(meta.labelKey)` (same pattern as
 * bottom-nav's NAV_TABS).
 */
export const LEAD_STATUS_META: Record<LeadStatus, { labelKey: string; badge: string }> = {
  NEW: { labelKey: 'leadStatus.new', badge: 'bg-accent/90' },
  CONTACTED: { labelKey: 'leadStatus.contacted', badge: 'bg-brand-amber/90' },
  MEETING: { labelKey: 'leadStatus.meeting', badge: 'bg-brand-green/90' },
  CLOSED: { labelKey: 'leadStatus.closed', badge: 'bg-ink-3/70' },
};

/** i18n key for the button that advances a lead TO this status (nextLeadStatuses,
 *  design spec §8.4). Kept short — these sit in a wrapped button row on a 360px
 *  screen, same convention as listing-form's TRANSITION_LABEL. */
export const LEAD_TRANSITION_LABEL: Partial<Record<LeadStatus, string>> = {
  CONTACTED: 'leadTransition.contacted',
  MEETING: 'leadTransition.meeting',
  CLOSED: 'leadTransition.closed',
};
