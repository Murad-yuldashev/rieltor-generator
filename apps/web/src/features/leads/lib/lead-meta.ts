import type { LeadStatus } from '@rieltor/shared';

/**
 * How a lead status is presented — the SINGLE source (mirrors features/listing-form's
 * STATUS_META/TRANSITION_LABEL). Used by the status badge and the advance buttons on
 * each cabinet lead row.
 */
export const LEAD_STATUS_META: Record<LeadStatus, { label: string; badge: string }> = {
  NEW: { label: 'Yangi', badge: 'bg-accent/90' },
  CONTACTED: { label: "Bog'lanildi", badge: 'bg-brand-amber/90' },
  MEETING: { label: 'Uchrashildi', badge: 'bg-brand-green/90' },
  CLOSED: { label: 'Yakunlangan', badge: 'bg-ink-3/70' },
};

/** Label for the button that advances a lead TO this status (nextLeadStatuses,
 *  design spec §8.4). Kept short — these sit in a wrapped button row on a 360px
 *  screen, same convention as listing-form's TRANSITION_LABEL. */
export const LEAD_TRANSITION_LABEL: Partial<Record<LeadStatus, string>> = {
  CONTACTED: "Bog'landim",
  MEETING: 'Uchrashdim',
  CLOSED: 'Yakunlash',
};
