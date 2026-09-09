import { useMutation } from '@tanstack/react-query';
import { LeadAssistResponseSchema, type LeadAssistResponse } from '@rieltor/shared';
import { apiPost } from '@/shared/api/client';

/** Request an AI assist for a claimed lead. A network/HTTP error resolves to a minimal client
 *  fallback so a failure never breaks the panel (the endpoint itself returns ai:false template for AI issues). */
export function useLeadAssist() {
  return useMutation<LeadAssistResponse, never, string>({
    mutationFn: async (leadId: string) => {
      try {
        return await apiPost(`/api/leads/${leadId}/assist`, LeadAssistResponseSchema);
      } catch {
        return {
          ai: false,
          nextAction: "Xaridorga qo'ng'iroq qilib, ehtiyojini aniqlang.",
          message: "AI hozircha mavjud emas — xaridorga qo'ng'iroq qilib boshlang.",
        };
      }
    },
  });
}
