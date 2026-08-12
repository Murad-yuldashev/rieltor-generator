import { useMutation } from '@tanstack/react-query';
import { createShareLink } from '../api';

/** label is left to the caller for a future "named channel" affordance; the share
 *  screen itself (§8.1) always creates an unlabelled link today. */
export function useShareLink(listingId: string) {
  return useMutation({
    mutationFn: (label?: string) => createShareLink(listingId, label),
  });
}
