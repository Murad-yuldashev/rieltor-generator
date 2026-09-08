import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { DebtorRowSchema, FinanceSummarySchema } from '@rieltor/shared';
import { apiGet } from '@/shared/api/client';

const DebtorRowsSchema = z.array(DebtorRowSchema);

/**
 * The developer organization's finance snapshot (`GET /api/crm/finance`, JwtGuard +
 * DeveloperGuard): contracted / collected / outstanding / overdue totals over the
 * payment schedules, net commission paid, and the org wallet balance — which MAY be
 * negative (a debt), so callers read its STRING sign, never `Number()` it. A short
 * `staleTime` keeps the totals fresh after a payment or commission elsewhere.
 */
export function useFinanceSummary() {
  return useQuery({
    queryKey: ['crm-finance'] as const,
    queryFn: () => apiGet('/api/crm/finance', FinanceSummarySchema),
    staleTime: 30 * 1000,
  });
}

/**
 * The org's debtors (`GET /api/crm/debtors`) — one row per contract carrying overdue
 * installments, with the buyer, the overdue amount, the oldest missed due date, and
 * the remaining balance. Shares the finance page's short `staleTime`.
 */
export function useDebtors() {
  return useQuery({
    queryKey: ['crm-debtors'] as const,
    queryFn: () => apiGet('/api/crm/debtors', DebtorRowsSchema),
    staleTime: 30 * 1000,
  });
}
