import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { RequestMethod } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import { SPA_ROUTES } from './ssr/routes';

/**
 * Used by main.ts and by every e2e test, so the prefix/exclude list can never
 * drift apart between the two.
 */
export function configureApp(app: NestExpressApplication): void {
  // Behind Railway/Render the real client IP arrives in X-Forwarded-For.
  app.set('trust proxy', 1);

  // gzip/br for static JS/CSS and the SSR HTML — roughly a 4x smaller bundle.
  // Must come before the other handlers, otherwise their output is not compressed.
  app.use(compression());

  // SSR routes must stay outside the 'api' prefix.
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: 'obj/:id', method: RequestMethod.GET },
      { path: 'r/:username', method: RequestMethod.GET },
      ...SPA_ROUTES.map((path) => ({ path, method: RequestMethod.GET })),
    ],
  });

  const apiRoot = resolve(__dirname, '..');
  const publicDir = join(apiRoot, 'public');
  if (existsSync(publicDir)) {
    // Images live at /images/... and are not content-addressed, so a moderate cache.
    app.useStaticAssets(publicDir, { maxAge: '7d' });
  }

  const webDist = process.env.WEB_DIST ?? resolve(apiRoot, '..', 'web', 'dist');
  if (existsSync(webDist)) {
    // index:false lets SsrController own '/'.
    // Vite asset names are hashed, so they get a long-lived immutable cache.
    app.useStaticAssets(webDist, { index: false, maxAge: '1y', immutable: true });
  }
}
