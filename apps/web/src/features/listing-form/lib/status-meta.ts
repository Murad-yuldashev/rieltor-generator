import type { ListingStatus } from '@rieltor/shared';

/**
 * How a listing status is presented — the SINGLE source (mirrors entities/listing's
 * LISTING_TYPE_META). Used by the status bar on the edit form and by the "Mening
 * e'lonlarim" cards on the cabinet page, so the two can never drift apart.
 */
export const STATUS_META: Record<ListingStatus, { label: string; badge: string }> = {
  DRAFT: { label: 'Qoralama', badge: 'bg-ink-3/90' },
  PENDING: { label: 'Moderatsiyada', badge: 'bg-brand-amber/90' },
  ACTIVE: { label: 'Faol', badge: 'bg-brand-green/90' },
  RESERVED: { label: 'Band qilingan', badge: 'bg-accent/90' },
  SOLD: { label: 'Sotilgan', badge: 'bg-ink/80' },
  RENTED: { label: 'Ijaraga berilgan', badge: 'bg-ink/80' },
  ARCHIVED: { label: 'Arxivlangan', badge: 'bg-ink-3/70' },
};

/** Label for the button that requests a move TO this status (§7.4 transition table).
 *  Kept short — these sit in a wrapped button row on a 360px-wide screen. */
export const TRANSITION_LABEL: Partial<Record<ListingStatus, string>> = {
  DRAFT: "Qoralamaga qaytarish",
  ACTIVE: 'Faollashtirish',
  RESERVED: 'Band qilish',
  SOLD: 'Sotildi deb belgilash',
  RENTED: 'Ijaraga berildi',
  ARCHIVED: 'Arxivlash',
};
