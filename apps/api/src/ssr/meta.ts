import {
  IMAGE_SIZES,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  formatPriceSom,
  imageSrcSet,
  type ListingDetail,
  type PublicComplexDetail,
  type PublicPresentation,
  type PublicRealtor,
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
 * OG/head tags for a public presentation page (/p/:token). Mirrors buildMetaTags:
 * the Telegram/link preview is the whole point of the SSR shell for a share link.
 * The title is the presentation title; the description reads "<N> obyekt · <realtor>";
 * the preview image is the first item's cover, if any.
 */
export function buildPresentationMetaTags(
  presentation: PublicPresentation,
  token: string,
  baseUrl: string,
): string {
  const title = presentation.title;
  const description = `${presentation.items.length} obyekt · ${presentation.realtorName}`;
  const pageUrl = `${baseUrl}/p/${token}`;
  // Reuses the same absolute-URL shape buildMetaTags uses for a listing's cover.
  const firstImage = presentation.items[0]?.listing.image ?? null;

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

  return tags.join('\n    ');
}

/**
 * OG/head tags for a public realtor microsite (/r/:slug). Mirrors
 * buildPresentationMetaTags: the Telegram/link preview is the whole point of the
 * SSR shell for a share link. The title is "<name> · <agency>" (name alone when
 * the agency is blank); the description is the bio (truncated) or "<N> e'lon";
 * the preview image is the realtor's logo, or the first listing's cover as a
 * fallback.
 */
export function buildRealtorMetaTags(
  realtor: PublicRealtor,
  slug: string,
  baseUrl: string,
): string {
  const title = realtor.agency ? `${realtor.name} · ${realtor.agency}` : realtor.name;
  const description = realtor.bio ? truncate(realtor.bio) : `${realtor.listings.length} e'lon`;
  const pageUrl = `${baseUrl}/r/${slug}`;
  // The logo is a renderable relative URL ("/images/logo-<user>/01-1200.webp");
  // the first listing's cover is the fallback when a realtor has uploaded none.
  const relativeImage = realtor.logoUrl ?? realtor.listings[0]?.image?.ogUrl ?? null;

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

  if (relativeImage) {
    // Telegram does not follow relative paths — an absolute URL is required.
    const absolute = `${baseUrl}${relativeImage}`;
    tags.push(
      meta('property', 'og:image', absolute),
      meta('property', 'og:image:width', String(OG_IMAGE_WIDTH)),
      meta('property', 'og:image:height', String(OG_IMAGE_HEIGHT)),
      meta('name', 'twitter:image', absolute),
    );
  }

  return tags.join('\n    ');
}

/**
 * OG/head tags for a public ЖК (residential complex) page (/jk/:slug). Mirrors
 * buildRealtorMetaTags: the Telegram/link preview is the whole point of the SSR
 * shell for a share link. The title is "<name> — <district>"; the description is
 * the cheapest available price ("<price> so'mdan") plus the free-unit count, or
 * just the count when nothing is priced yet; the preview image is the cover, or
 * omitted (like the realtor branch) when the complex has no gallery.
 */
export function buildComplexMetaTags(
  complex: PublicComplexDetail,
  slug: string,
  baseUrl: string,
): string {
  const title = `${complex.name} — ${complex.district}`;
  // A new-build complex is always a SALE, so formatPriceSom carries no "/oy"
  // period suffix here; "dan" turns "780 000 000 so'm" into "…so'mdan" (from).
  const description = complex.priceFromSom
    ? `${formatPriceSom(complex.priceFromSom, 'SALE')}dan · ${complex.unitsAvailable} ta bo'sh xonadon`
    : `${complex.unitsAvailable} ta bo'sh xonadon`;
  const pageUrl = `${baseUrl}/jk/${slug}`;
  // The cover is a renderable relative URL ("/images/<complex>/og.jpg"); omitted
  // (no og:image tag) when the complex has no gallery, same as the realtor branch.
  const relativeImage = complex.coverImage?.ogUrl ?? null;

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

  if (relativeImage) {
    // Telegram does not follow relative paths — an absolute URL is required.
    const absolute = `${baseUrl}${relativeImage}`;
    tags.push(
      meta('property', 'og:image', absolute),
      meta('property', 'og:image:width', String(OG_IMAGE_WIDTH)),
      meta('property', 'og:image:height', String(OG_IMAGE_HEIGHT)),
      meta('name', 'twitter:image', absolute),
    );
  }

  return tags.join('\n    ');
}
