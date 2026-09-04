import type { ContractStatus } from '@rieltor/shared';

/**
 * Uzbek labels for a contract's lifecycle status (UI copy only). Single source of
 * truth shared by the contracts list + detail pages.
 */
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIVE: 'Faol',
  CANCELLED: 'Bekor qilingan',
};

/** Badge tint per contract status. */
export const CONTRACT_STATUS_BADGE: Record<ContractStatus, string> = {
  ACTIVE: 'bg-brand-green/10 text-brand-green',
  CANCELLED: 'bg-ink-3/10 text-ink-3',
};
