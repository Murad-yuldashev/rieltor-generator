import { useQuery } from '@tanstack/react-query';
import type { RealtorProfile } from '@rieltor/shared';
import { meQuery } from '../api';

/** null means "not signed in" — an error state the UI does not need to distinguish. */
export function useMe(): { realtor: RealtorProfile | null; isLoading: boolean } {
  const { data, isLoading } = useQuery(meQuery());

  return { realtor: data ?? null, isLoading };
}
