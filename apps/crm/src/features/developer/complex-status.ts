import { ComplexStatusSchema, type ComplexStatus } from '@rieltor/shared';

/** The status values in build-lifecycle order — used to build the status <select>. */
export const COMPLEX_STATUS_OPTIONS = ComplexStatusSchema.options;

/** Uzbek labels for a complex's build lifecycle (UI copy only). */
export const COMPLEX_STATUS_LABELS: Record<ComplexStatus, string> = {
  PLANNED: 'Rejalashtirilgan',
  UNDER_CONSTRUCTION: 'Qurilmoqda',
  DONE: 'Topshirilgan',
};

/** Tailwind tint classes for the small status badge, keyed by status. */
export const COMPLEX_STATUS_BADGE: Record<ComplexStatus, string> = {
  PLANNED: 'bg-accent/10 text-accent',
  UNDER_CONSTRUCTION: 'bg-brand-amber/10 text-brand-amber',
  DONE: 'bg-brand-green/10 text-brand-green',
};
