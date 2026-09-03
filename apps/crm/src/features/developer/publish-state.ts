import type { ComplexPublishStatus } from '@rieltor/shared';

/** Uzbek labels for a complex's marketplace publish state (UI copy only). */
export const PUBLISH_STATE_LABELS: Record<ComplexPublishStatus, string> = {
  DRAFT: 'Qoralama',
  PUBLISHED: "E'lon qilingan",
};

/** Tailwind tint classes for the small publish-state badge, keyed by state. */
export const PUBLISH_STATE_BADGE: Record<ComplexPublishStatus, string> = {
  DRAFT: 'bg-ink-3/10 text-ink-2',
  PUBLISHED: 'bg-brand-green/10 text-brand-green',
};
