import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ComplexesPublicService } from '../complexes-public/complexes-public.service';
import type { Env } from '../config/env';
import { PresentationsService } from '../presentations/presentations.service';
import { RealtorPublicService } from '../realtor-public/realtor-public.service';
import { HtmlCacheService } from './html-cache.service';
import { buildComplexMetaTags, buildPresentationMetaTags, buildRealtorMetaTags } from './meta';

/** Public presentation page path: /p/:token (a single token segment). */
const PRESENTATION_PATH = /^\/p\/([^/]+)\/?$/;

/** Public realtor microsite path: /r/:slug (a single slug segment). */
const REALTOR_PATH = /^\/r\/([^/]+)\/?$/;

/** Public ЖК (residential complex) detail page path: /jk/:slug (a single slug segment). */
const COMPLEX_PATH = /^\/jk\/([^/]+)\/?$/;

/** Public ЖК marketplace browse page path: /jk (no slug). */
const COMPLEX_BROWSE_PATH = /^\/jk\/?$/;

/**
 * Catches NotFoundException thrown either by NestJS itself (the "Cannot GET /x"
 * case, when no route matches) or by application code such as ListingsService.
 *
 * `/api/*` requests keep the standard JSON error so the API contract is not
 * broken (the existing e2e tests rely on it). Every other path — that is, any
 * hard navigation with no matching route, such as "GET /foo" or
 * "GET /obj/bx-001/extra" — gets the head-injected SPA shell with a 404 status,
 * so the frontend can render its own <NotFoundPage /> (spec §8).
 *
 * Adding a catch-all route to setGlobalPrefix's `exclude` list does not work:
 * the list is matched on {path, method} across the whole app, independent of the
 * controller, so a broad pattern like '{*path}' would strip the 'api/' prefix
 * from every GET route (verified: /api/health turned into
 * "Cannot GET /api/health"). Hence this filter instead of a catch-all @Get('*').
 *
 * The public presentation page (GET /p/:token) is a special case handled here
 * rather than in SsrController: its base segment 'p' is ALSO an API controller
 * (@Controller('p') → /api/p/:token), so it cannot be a prefix-excluded SSR
 * route without un-prefixing that API GET (the same cross-controller exclude
 * limitation noted above). It has no matching NestJS route, so it lands in this
 * filter, where its og-meta is injected for the Telegram/link preview — 200 for
 * a live token, the plain shell with 404 for an unknown one (mirrors obj/:id).
 *
 * The public realtor microsite (GET /r/:slug) is the same special case: 'r' is
 * ALSO an API controller (@Controller('r') → /api/r/:slug), so it lives here for
 * the identical reason — og-meta injected for a live slug, the plain 404 shell
 * for an unknown one.
 *
 * The public ЖК pages are the same special case again: 'jk' is ALSO an API
 * controller (@Controller('jk') → /api/jk, /api/jk/:slug), so it cannot be a
 * prefix-excluded SSR route without un-prefixing that API GET. Both the detail
 * page (GET /jk/:slug) and the marketplace browse page (GET /jk) land here:
 * /jk/:slug gets its complex og-meta for a live slug (200) or the plain 404 shell
 * for an unknown one; /jk is a real browse page, so it gets the plain shell with
 * a 200 (site-default OG) — it need not fetch any complex.
 */
@Catch(NotFoundException)
export class NotFoundShellFilter implements ExceptionFilter {
  constructor(
    private readonly html: HtmlCacheService,
    private readonly presentations: PresentationsService,
    private readonly realtors: RealtorPublicService,
    private readonly complexes: ComplexesPublicService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async catch(exception: NotFoundException, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    if (req.path === '/api' || req.path.startsWith('/api/')) {
      res.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    const shell = await this.html.shell();

    const presentationMatch = req.method === 'GET' ? PRESENTATION_PATH.exec(req.path) : null;
    const token = presentationMatch?.[1];
    if (token) {
      try {
        const presentation = await this.presentations.publicGet(token);
        const baseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });
        res
          .status(200)
          .type('html')
          .send(
            this.html.injectMeta(shell, buildPresentationMetaTags(presentation, token, baseUrl)),
          );
        return;
      } catch (error) {
        // Unknown token → fall through to the plain 404 shell, same as obj/:id.
        if (!(error instanceof NotFoundException)) throw error;
      }
    }

    const realtorMatch = req.method === 'GET' ? REALTOR_PATH.exec(req.path) : null;
    const slug = realtorMatch?.[1];
    if (slug) {
      try {
        const realtor = await this.realtors.getBySlug(slug);
        const baseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });
        res
          .status(200)
          .type('html')
          .send(this.html.injectMeta(shell, buildRealtorMetaTags(realtor, slug, baseUrl)));
        return;
      } catch (error) {
        // Unknown slug → fall through to the plain 404 shell, same as obj/:id.
        if (!(error instanceof NotFoundException)) throw error;
      }
    }

    const complexMatch = req.method === 'GET' ? COMPLEX_PATH.exec(req.path) : null;
    const complexSlug = complexMatch?.[1];
    if (complexSlug) {
      try {
        const complex = await this.complexes.getBySlug(complexSlug);
        const baseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });
        res
          .status(200)
          .type('html')
          .send(this.html.injectMeta(shell, buildComplexMetaTags(complex, complexSlug, baseUrl)));
        return;
      } catch (error) {
        // Unknown slug → fall through to the plain 404 shell, same as obj/:id.
        if (!(error instanceof NotFoundException)) throw error;
      }
    }

    // The ЖК marketplace browse page (GET /jk) is a real SPA page, not a missing
    // route: serve the plain shell (site-default OG) with a 200 so a hard refresh
    // or shared /jk link opens the list, mirroring the SPA_ROUTES browse pages.
    if (req.method === 'GET' && COMPLEX_BROWSE_PATH.test(req.path)) {
      res.status(200).type('html').send(shell);
      return;
    }

    res.status(404).type('html').send(shell);
  }
}
