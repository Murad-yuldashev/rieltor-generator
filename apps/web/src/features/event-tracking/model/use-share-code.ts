import { useSearchParams } from 'react-router';

/**
 * Reads the `?s=` ShareLink code (design spec §8.1/§8.2) off the current URL —
 * present when the visit came from a "Ulashish" link, absent for organic/direct
 * traffic. Deliberately does not read the SSR meta tags: the design spec requires
 * `?s=` to have zero effect on those (a separate e2e concern, not this hook's).
 */
export function useShareCode(): string | undefined {
  const [searchParams] = useSearchParams();
  return searchParams.get('s') ?? undefined;
}
