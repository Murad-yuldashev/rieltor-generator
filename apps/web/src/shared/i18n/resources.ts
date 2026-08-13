import type { Resource } from 'i18next';
import { cabinetI18n } from './bundles/cabinet';
import { feedI18n } from './bundles/feed';
import { listingI18n } from './bundles/listing';
import { miscI18n } from './bundles/misc';
import { commonI18n } from './common';
import type { I18nBundle } from './types';

export const LANGS = ['uz', 'ru', 'en'] as const;
export type Lang = (typeof LANGS)[number];

/**
 * Every slice's translation bundle is registered here. To add a slice: create its
 * `<slice>/i18n.ts` exporting an I18nBundle, import it below, and push it into
 * BUNDLES. This single file is the only place namespaces are wired, so slice work
 * can happen in parallel without colliding on it.
 */
const BUNDLES: I18nBundle[] = [commonI18n, feedI18n, listingI18n, cabinetI18n, miscI18n];

export const resources: Resource = Object.fromEntries(
  LANGS.map((lng) => [lng, Object.fromEntries(BUNDLES.map((b) => [b.ns, b[lng]]))]),
) as Resource;
