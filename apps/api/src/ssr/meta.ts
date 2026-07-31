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
 * O'zbekcha sarlavhalarda apostrof ko'p — escape qilinmasa <head> buziladi
 * yoki atributdan chiqib ketish (injection) mumkin bo'ladi.
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
  const title = `${listing.title} — ${formatPriceSom(listing.priceSom)}`;
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
    // Telegram nisbiy yo'lni o'qimaydi — absolyut URL shart.
    tags.push(
      meta('property', 'og:image', `${baseUrl}${firstImage.ogUrl}`),
      meta('property', 'og:image:width', String(OG_IMAGE_WIDTH)),
      meta('property', 'og:image:height', String(OG_IMAGE_HEIGHT)),
      meta('name', 'twitter:image', `${baseUrl}${firstImage.ogUrl}`),
    );
  }

  if (firstImage) {
    // LCP rasmini oldindan yuklash — Lighthouse ≥90 uchun eng katta ta'sir (spec §8).
    tags.push(
      `<link rel="preload" as="image" imagesrcset="${escapeHtml(imageSrcSet(firstImage.base))}" imagesizes="${escapeHtml(IMAGE_SIZES)}" />`,
    );
  }

  return tags.join('\n    ');
}
