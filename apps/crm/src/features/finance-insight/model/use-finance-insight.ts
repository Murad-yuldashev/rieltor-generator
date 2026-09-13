import { useMutation } from '@tanstack/react-query';
import { FinanceInsightResponseSchema, type FinanceInsightResponse } from '@rieltor/shared';
import { apiGet } from '@/shared/api/client';

/** Fetch the org's AI finance insight on demand (a GET, triggered by the button — not auto-loaded).
 *  A network/HTTP error resolves to a minimal client fallback so a failure never breaks the panel
 *  (the endpoint itself already returns an ai:false template for any AI/parse issue). */
export function useFinanceInsight() {
  return useMutation<FinanceInsightResponse, never, void>({
    mutationFn: async () => {
      try {
        return await apiGet('/api/crm/finance/insight', FinanceInsightResponseSchema);
      } catch {
        return {
          ai: false,
          insight:
            "AI tahlil hozircha mavjud emas. Yuqoridagi ko'rsatkichlarni qo'lda ko'rib chiqing.",
        };
      }
    },
  });
}
