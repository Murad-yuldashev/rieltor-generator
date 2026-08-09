import {
  IMAGE_SIZES,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  formatPriceSom,
  imageSrcSet,
  type ListingDetail,
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
