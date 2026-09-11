import { useMutation } from '@tanstack/react-query';
import {
  AiContentResponseSchema,
  type AiContentRequest,
  type AiContentResponse,
} from '@rieltor/shared';
import { apiPost } from '@/shared/api/client';

/** Generate social content for a listing. A network/HTTP error resolves to a minimal client fallback
 *  so a failure never breaks the panel (the endpoint itself returns ai:false template for AI issues). */
export function useListingContent() {
  return useMutation<AiContentResponse, never, AiContentRequest>({
    mutationFn: async (req: AiContentRequest) => {
      try {
        return await apiPost('/api/ai/content', AiContentResponseSchema, req);
      } catch {
        return {
          ai: false,
          caption: "AI hozircha mavjud emas — e'lonni qo'lda tavsiflab joylang.",
          hashtags: '#toshkent #korchmasmulk',
        };
      }
    },
  });
}
