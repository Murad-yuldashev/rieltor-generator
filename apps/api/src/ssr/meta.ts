import {
  IMAGE_SIZES,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  formatNarxSom,
  imageSrcSet,
  type ObjectDetail,
} from '@rieltor/shared';

const TAVSIF_MAKS = 200;

/**
 * O'zbekcha sarlavhalarda apostrof ko'p — escape qilinmasa <head> buziladi
 * yoki atributdan chiqib ketish (injection) mumkin bo'ladi.
 */
export function escapeHtml(matn: string): string {
  return matn
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function meta(nom: 'property' | 'name', kalit: string, qiymat: string): string {
  return `<meta ${nom}="${kalit}" content="${escapeHtml(qiymat)}" />`;
}

function qisqartir(matn: string): string {
  const bir = matn.replace(/\s+/g, ' ').trim();
  return bir.length <= TAVSIF_MAKS ? bir : `${bir.slice(0, TAVSIF_MAKS - 1)}…`;
}

export function metaTeglar(obj: ObjectDetail, baseUrl: string): string {
  const sarlavha = `${obj.sarlavha} — ${formatNarxSom(obj.narxSom)}`;
  const tavsif = qisqartir(obj.tavsif);
  const sahifaUrl = `${baseUrl}/obj/${obj.id}`;
  const birinchi = obj.rasmlar[0];

  const teglar = [
    `<title>${escapeHtml(sarlavha)}</title>`,
    meta('name', 'description', tavsif),
    `<link rel="canonical" href="${escapeHtml(sahifaUrl)}" />`,
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', 'Rieltor'),
    meta('property', 'og:url', sahifaUrl),
    meta('property', 'og:title', sarlavha),
    meta('property', 'og:description', tavsif),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', sarlavha),
    meta('name', 'twitter:description', tavsif),
  ];

  if (birinchi?.ogUrl) {
    // Telegram nisbiy yo'lni o'qimaydi — absolyut URL shart.
    teglar.push(
      meta('property', 'og:image', `${baseUrl}${birinchi.ogUrl}`),
      meta('property', 'og:image:width', String(OG_IMAGE_WIDTH)),
      meta('property', 'og:image:height', String(OG_IMAGE_HEIGHT)),
      meta('name', 'twitter:image', `${baseUrl}${birinchi.ogUrl}`),
    );
  }

  if (birinchi) {
    // LCP rasmini oldindan yuklash — Lighthouse ≥90 uchun eng katta ta'sir (spec §8).
    teglar.push(
      `<link rel="preload" as="image" imagesrcset="${escapeHtml(imageSrcSet(birinchi.base))}" imagesizes="${escapeHtml(IMAGE_SIZES)}" />`,
    );
  }

  return teglar.join('\n    ');
}
