export interface RealtorBootstrap {
  slug: string;
  mode?: 'embed';
}

/**
 * Reads the server-injected window.__REALTOR_SITE__ (custom domain or /embed). Any
 * absence/garbling returns null so the app falls back to the normal marketplace.
 */
export function readRealtorBootstrap(): RealtorBootstrap | null {
  try {
    const raw = (window as unknown as { __REALTOR_SITE__?: unknown }).__REALTOR_SITE__;
    if (raw && typeof raw === 'object') {
      const obj = raw as { slug?: unknown; mode?: unknown };
      if (typeof obj.slug === 'string' && obj.slug.length > 0) {
        return { slug: obj.slug, mode: obj.mode === 'embed' ? 'embed' : undefined };
      }
    }
  } catch {
    /* ignore — fall back to marketplace */
  }
  return null;
}
