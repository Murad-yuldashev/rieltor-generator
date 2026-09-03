import { UnitStatusSchema, type UnitStatus } from '@rieltor/shared';

/** The unit sales-lifecycle values in order — used to build the status <select>. */
export const UNIT_STATUS_OPTIONS = UnitStatusSchema.options;

/** Uzbek labels for a unit's sales status (UI copy only). */
export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  AVAILABLE: "Bo'sh",
  BOOKED: 'Band',
  SOLD: 'Sotilgan',
};

/** Tailwind tint classes for the small status badge, keyed by status. */
export const UNIT_STATUS_BADGE: Record<UnitStatus, string> = {
  AVAILABLE: 'bg-brand-green/10 text-brand-green',
  BOOKED: 'bg-brand-amber/10 text-brand-amber',
  SOLD: 'bg-brand-rose/10 text-brand-rose',
};
