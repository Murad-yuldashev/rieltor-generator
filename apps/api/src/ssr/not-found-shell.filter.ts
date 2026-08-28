import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { Env } from '../config/env';
import { PresentationsService } from '../presentations/presentations.service';
import { RealtorPublicService } from '../realtor-public/realtor-public.service';
import { HtmlCacheService } from './html-cache.service';
import { buildPresentationMetaTags, buildRealtorMetaTags } from './meta';

/** Public presentation page path: /p/:token (a single token segment). */
const PRESENTATION_PATH = /^\/p\/([^/]+)\/?$/;

/** Public realtor microsite path: /r/:slug (a single slug segment). */
const REALTOR_PATH = /^\/r\/([^/]+)\/?$/;

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
 */
@Catch(NotFoundException)
export class NotFoundShellFilter implements ExceptionFilter {
  constructor(
    private readonly html: HtmlCacheService,
    private readonly presentations: PresentationsService,
    private readonly realtors: RealtorPublicService,
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

    res.status(404).type('html').send(shell);
  }
}
