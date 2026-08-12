/**
 * Every SPA page except the home route — served without the 'api' prefix as the
 * HTML shell ('offer' is not in the bottom nav but must open from a direct link).
 *
 * SINGLE SOURCE: bootstrap.ts feeds this list to setGlobalPrefix({exclude}) and
 * SsrController feeds it to @Get(). Adding a path to only one of them makes the
 * route 404 silently — either the prefix is not stripped, or no handler matches.
 */
export const SPA_ROUTES = [
  'search',
  'favorites',
  'contact',
  'offer',
  'cabinet',
  'cabinet/profile',
  'cabinet/new',
  'cabinet/obj/:id/edit',
] as const;
