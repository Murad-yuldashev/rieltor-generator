import {
  IMAGE_SIZES,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  formatPriceSom,
  imageSrcSet,
  type ArticleDetail,
  type ListingDetail,
  type PublicComplexDetail,
  type PublicPresentation,
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
 * Server-only meta model for a realtor microsite (/r/:slug), produced by
 * RealtorPublicService.getSiteMeta and consumed by buildRealtorMetaTags. It is a
 * SUPERSET of the public payload: seoTitle/seoDescription are server-only SEO
 * overrides that never ship in PublicRealtor. `siteActive` is the subscription +
 * sitePublished gate — false means the SSR head is reduced to a noindex stub.
 */
export interface RealtorSiteMeta {
  name: string;
  agency: string;
  bio: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  listingCount: number;
  firstListingImageOgUrl: string | null;
  regions: string[];
  ratingAvg: number | null;
  ratingCount: number;
  siteActive: boolean;
}

/**
 * A <script type="application/ld+json"> block. The JSON is a text node, so the
 * three HTML-significant chars (< > &) are unicode-escaped to keep a stray
 * "</script>" or "&" in the data from breaking out of the tag. escapeHtml() must
 * NOT be used here — its entity encoding (&amp; etc.) would corrupt the JSON.
 */
function jsonLdScript(data: unknown): string {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return `<script type="application/ld+json">${json}</script>`;
}

/**
 * Inline classic <script> that hands the realtor slug (and optional embed mode) to
 * the web SPA before its module script runs. Placed at OG_MARKER (top of <head>),
 * far above the deferred bundle in <body>, so window.__REALTOR_SITE__ is set first.
 * The JSON is unicode-escaped (like jsonLdScript) — escapeHtml would corrupt it.
 */
export function realtorBootstrapScript(slug: string, mode?: 'embed'): string {
  const json = JSON.stringify(mode ? { slug, mode } : { slug })
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return `<script>window.__REALTOR_SITE__=${json};</script>`;
}

/** RealEstateAgent structured data for the microsite (rich-result eligibility). */
function buildRealtorJsonLd(site: RealtorSiteMeta, pageUrl: string, baseUrl: string): string {
  const image = site.coverImageUrl ?? site.logoUrl ?? site.firstListingImageOgUrl;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: site.agency || site.name,
    url: pageUrl,
  };
  const desc = site.seoDescription?.trim() || site.bio?.trim();
  if (desc) data.description = truncate(desc);
  if (site.logoUrl) data.logo = `${baseUrl}${site.logoUrl}`;
  if (image) data.image = `${baseUrl}${image}`;
  if (site.regions.length) data.areaServed = site.regions;
  if (site.ratingCount > 0 && site.ratingAvg != null)
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(site.ratingAvg.toFixed(1)),
      reviewCount: site.ratingCount,
    };
  return jsonLdScript(data);
}

/**
 * OG/head tags for a public realtor microsite (/r/:slug). Subscription-gated: a
 * paused/lapsed site (siteActive === false) emits only a minimal noindex head
 * (title + canonical) so search engines drop it, while a live site gets the full
 * OG/Twitter set plus RealEstateAgent JSON-LD. og:site_name is the agency; the
 * title/description honor the realtor's seoTitle/seoDescription overrides, then
 * fall back to "<name> · <agency>" / the bio / "<N> e'lon"; the preview image is
 * the cover OG jpg, then the logo, then the first listing's cover.
 *
 * The first param is `site`, NOT `meta` — a `meta` param would shadow the
 * module-level meta() helper used to build every tag below.
 */
export function buildRealtorMetaTags(
  site: RealtorSiteMeta,
  slug: string,
  baseUrl: string,
  pageUrlOverride?: string,
): string {
  const pageUrl = pageUrlOverride ?? `${baseUrl}/r/${slug}`;
  if (!site.siteActive) {
    // Known-but-paused slug: served @200 (not 404) with a noindex head so search
    // engines drop it while the SPA still renders its own "site paused" state.
    return [
      `<title>${escapeHtml(site.name)}</title>`,
      meta('name', 'robots', 'noindex'),
      `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    ].join('\n    ');
  }
  const title = site.seoTitle?.trim()
    ? site.seoTitle.trim()
    : site.agency
      ? `${site.name} · ${site.agency}`
      : site.name;
  const description = site.seoDescription?.trim()
    ? truncate(site.seoDescription)
    : site.bio
      ? truncate(site.bio)
      : `${site.listingCount} e'lon`;
  // The cover OG jpg (Task 5) is preferred; the logo, then the first listing's
  // cover, are fallbacks when no cover has been uploaded.
  const relativeImage = site.coverImageUrl ?? site.logoUrl ?? site.firstListingImageOgUrl;
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    meta('name', 'description', description),
    `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', site.agency || site.name),
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

  tags.push(buildRealtorJsonLd(site, pageUrl, baseUrl));

  return tags.join('\n    ');
}

/**
 * OG/head tags for a public journal article page (/jurnal/:slug). Mirrors
 * buildComplexMetaTags: the Telegram/link preview is the whole point of the SSR
 * shell for a share link. The title is the article title; the description is the
 * excerpt (truncated, since the excerpt max is 300 but a description caps at 200);
 * the preview image is the cover, or omitted (like the complex branch) when the
 * article has none.
 */
export function buildArticleMetaTags(
  article: ArticleDetail,
  slug: string,
  baseUrl: string,
): string {
  const title = article.title;
  const description = truncate(article.excerpt);
  const pageUrl = `${baseUrl}/jurnal/${slug}`;
  // The cover is a renderable relative URL; omitted (no og:image tag) when the
  // article has no cover, same as the complex/realtor branches.
  const relativeImage = article.cover?.ogUrl ?? null;

  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    meta('name', 'description', description),
    `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    meta('property', 'og:type', 'article'),
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
