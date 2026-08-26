import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { RequestMethod } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
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

  // The realtor cabinet SPA (@rieltor/agent) is a SEPARATE Vite bundle served at
  // /agent/*. It must NOT be wired as a NestJS controller:
  //   - A `@Controller('agent')` would collide with the real AgentController (the
  //     /api/agent/* API), which already owns the 'agent' path under the global prefix.
  //   - Adding 'agent' to setGlobalPrefix({ exclude }) would strip the /api prefix off
  //     that AgentController and break every /api/agent/* endpoint.
  // So it is served entirely at the Express level, below the global prefix, matching
  // ONLY paths that start with /agent (never /api/agent, which starts with /api).
  const agentDist = process.env.AGENT_DIST ?? resolve(apiRoot, '..', 'agent', 'dist');
  if (existsSync(agentDist)) {
    // Hashed assets (built with Vite base '/agent/') live under /agent/assets/*.
    // Registered before the SPA fallback so real files always win. `redirect:false`
    // stops serve-static from 301-ing a bare `/agent` to `/agent/` (it treats the
    // prefix root as a directory) — the fallback below owns that path instead.
    app.useStaticAssets(agentDist, {
      prefix: '/agent',
      index: false,
      redirect: false,
      maxAge: '1y',
      immutable: true,
    });

    // SPA fallback: any GET /agent or /agent/<client-route> that is not a static
    // file returns the agent index.html (no SSR — a plain shell is correct here).
    // Runs before Nest's router, so /agent never falls through to the web SsrController
    // or NotFoundShellFilter (which would serve the web shell instead). The HTML is
    // read once at boot (like HtmlCacheService does for the web shell) so there is no
    // per-request filesystem lookup and no `sendFile` path resolution at request time.
    const agentHtml = readFileSync(join(agentDist, 'index.html'), 'utf-8');
    app.use((req: Request, res: Response, next: NextFunction) => {
      const isAgentPath = req.path === '/agent' || req.path.startsWith('/agent/');
      if (isAgentPath && (req.method === 'GET' || req.method === 'HEAD')) {
        res.type('html').send(agentHtml);
        return;
      }
      next();
    });
  }
}
