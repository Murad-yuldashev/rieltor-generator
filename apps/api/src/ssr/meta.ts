import {
  IMAGE_SIZES,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  absoluteUrl,
  formatPriceSom,
  imageSrcSet,
  type ListingDetail,
  type RealtorShowcase,
} from '@rieltor/shared';

const DESCRIPTION_MAX = 200;

/**
 * Uzbek titles are full of apostrophes — without escaping they would break the
 * <head> or allow breaking out of an attribute (injection).
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function meta(attr: 'property' | 'name', key: string, value: string): string {
  return `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
}

function truncate(text: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.length <= DESCRIPTION_MAX ? trimmed : `${trimmed.slice(0, DESCRIPTION_MAX - 1)}…`;
}

export function buildMetaTags(listing: ListingDetail, baseUrl: string): string {
  // The Telegram preview is the whole point of the SSR shell — a rent price has
  // to carry its "/oy" here, or the preview reads as a sale.
  const title = `${listing.title} — ${formatPriceSom(listing.priceSom, listing.deal)}`;
  const description = truncate(listing.description);
  const pageUrl = `${baseUrl}/obj/${listing.id}`;
  const firstImage = listing.images[0];

  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    meta('name', 'description', description),
    `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', 'Rieltor'),
    meta('property', 'og:url', pageUrl),
    meta('property', 'og:title', title),
    meta('property', 'og:description', description),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', title),
    meta('name', 'twitter:description', description),
  ];

  if (firstImage?.ogUrl) {
    // Telegram does not follow relative paths — an absolute URL is required.
    tags.push(
      meta('property', 'og:image', `${baseUrl}${firstImage.ogUrl}`),
      meta('property', 'og:image:width', String(OG_IMAGE_WIDTH)),
      meta('property', 'og:image:height', String(OG_IMAGE_HEIGHT)),
      meta('name', 'twitter:image', `${baseUrl}${firstImage.ogUrl}`),
    );
  }

  if (firstImage) {
    // Preloading the LCP image is the biggest single win for Lighthouse ≥90 (spec §8).
    tags.push(
      `<link rel="preload" as="image" imagesrcset="${escapeHtml(imageSrcSet(firstImage.base))}" imagesizes="${escapeHtml(IMAGE_SIZES)}" />`,
    );
  }

  return tags.join('\n    ');
}

/**
 * Meta tags for /r/:username (design spec §9.1) — title is the realtor's name plus
 * agency, image is their Telegram photo or, failing that, the first active
 * listing's og.jpg. Separate function from buildMetaTags: a realtor card has no
 * price/description to lead with, and its photo is not a guaranteed 1200×630 crop
 * the way a listing's og.jpg is, so width/height only get asserted for that case.
 */
export function buildRealtorMetaTags(realtor: RealtorShowcase, baseUrl: string): string {
  const title = realtor.agency ? `${realtor.name} — ${realtor.agency}` : realtor.name;
  const description = truncate(
    realtor.listings.length > 0
      ? `${title} — ${realtor.listings.length} ta faol e'lon`
      : `${title} — Rieltor profili`,
  );
  const pageUrl = `${baseUrl}/r/${realtor.username}`;

  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    meta('name', 'description', description),
    `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    meta('property', 'og:type', 'profile'),
    meta('property', 'og:site_name', 'Rieltor'),
    meta('property', 'og:url', pageUrl),
    meta('property', 'og:title', title),
    meta('property', 'og:description', description),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', title),
    meta('name', 'twitter:description', description),
  ];

  // realtor.photoUrl (Telegram's CDN) is already absolute; a listing's og.jpg is a
  // relative local/R2 path — absoluteUrl() handles either without double-prefixing.
  const fallbackOg = realtor.listings[0]?.image?.ogUrl ?? null;
  const ogImageSource = realtor.photoUrl ?? fallbackOg;
  if (ogImageSource) {
    const absolute = absoluteUrl(baseUrl, ogImageSource);
    tags.push(meta('property', 'og:image', absolute), meta('name', 'twitter:image', absolute));
    if (!realtor.photoUrl && fallbackOg) {
      tags.push(
        meta('property', 'og:image:width', String(OG_IMAGE_WIDTH)),
        meta('property', 'og:image:height', String(OG_IMAGE_HEIGHT)),
      );
    }
  }

  return tags.join('\n    ');
}
