'use strict';

/**
 * The whole NestJS app inside one Netlify Function.
 *
 * Only the dynamic routes reach it — netlify.toml rewrites /api/* and /obj/* here. The
 * SPA bundle and the seed-generated images are real files in the publish directory, so
 * the CDN serves them the way useStaticAssets() serves them from disk locally.
 *
 * Plain CommonJS on purpose: it requires apps/api/dist, which `nest build` emits as CJS,
 * and it keeps the file outside every workspace's tsconfig/eslint project.
 */

const { existsSync } = require('node:fs');
const path = require('node:path');
const serverless = require('serverless-http');

// HtmlCacheService reads index.html from here, and netlify.toml ships it with the function
// via included_files. The bundle keeps the repo-relative layout, so __dirname is the
// reliable anchor; `netlify dev` runs the function straight from source, where the CLI's
// working directory is whatever the developer started it from and cwd would miss.
const WEB_DIST_CANDIDATES = [
  path.resolve(__dirname, '..', '..', 'apps', 'web', 'dist'),
  path.join(process.cwd(), 'apps', 'web', 'dist'),
];
process.env.WEB_DIST ||=
  WEB_DIST_CANDIDATES.find((dir) => existsSync(path.join(dir, 'index.html'))) ??
  WEB_DIST_CANDIDATES[0];

// env.ts demands an absolute PUBLIC_BASE_URL for og:image, and a missing one crashes the
// app on boot. Netlify already knows the deploy's own URL, which removes the deploy-then-
// fix-the-variable-then-redeploy dance the Railway guide describes. An explicitly set
// PUBLIC_BASE_URL still wins — that is what a custom domain needs.
process.env.PUBLIC_BASE_URL ||= process.env.URL || process.env.DEPLOY_PRIME_URL || '';

// NestFactory picks its HTTP adapter through its own runtime require(), and create-app.ts
// only imports the package as a type, so nothing the tracer can see references it. Without
// this line the bundle ships without it and every request dies on boot with
// "No driver (HTTP) has been selected".
require('@nestjs/platform-express');

const { createApp } = require('../../apps/api/dist/create-app');

/** Reused by every warm invocation: a Nest bootstrap per request would cost ~1s each. */
let handlerPromise;

async function buildHandler() {
  const app = await createApp();
  await app.init();

  // binary: true keeps the body base64-encoded all the way to the CDN. configureApp()
  // installs compression(), so responses can be gzip bytes — read back as utf8 they
  // would arrive corrupted.
  return serverless(app.getHttpAdapter().getInstance(), { binary: true });
}

exports.handler = async (event, context) => {
  // Prisma's pool keeps the event loop busy, so without this the response is held back
  // until the function times out instead of being flushed when the handler resolves.
  context.callbackWaitsForEmptyEventLoop = false;

  handlerPromise ||= buildHandler();
  const handler = await handlerPromise;

  // A rewrite hands the function its own path (/.netlify/functions/api/...), but Nest
  // routes on the path the visitor asked for; rawUrl is the only field that still has it.
  const requestPath = event.rawUrl ? new URL(event.rawUrl).pathname : event.path;

  return handler({ ...event, path: requestPath }, context);
};
