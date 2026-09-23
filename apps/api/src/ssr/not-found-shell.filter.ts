import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ComplexesPublicService } from '../complexes-public/complexes-public.service';
import type { Env } from '../config/env';
import { JournalPublicService } from '../journal-public/journal-public.service';
import { PresentationsService } from '../presentations/presentations.service';
import { RealtorPublicService } from '../realtor-public/realtor-public.service';
import { HtmlCacheService } from './html-cache.service';
import {
  buildArticleMetaTags,
  buildComplexMetaTags,
  buildPresentationMetaTags,
  buildRealtorMetaTags,
  realtorBootstrapScript,
} from './meta';
import { realtorHostBaseUrl } from './realtor-host.middleware';

/** Public presentation page path: /p/:token (a single token segment). */
const PRESENTATION_PATH = /^\/p\/([^/]+)\/?$/;

/** Public realtor microsite path: /r/:slug (a single slug segment). */
const REALTOR_PATH = /^\/r\/([^/]+)\/?$/;

/** Public realtor embed catalogue path: /r/:slug/embed. */
const REALTOR_EMBED_PATH = /^\/r\/([^/]+)\/embed\/?$/;

/** Public ЖК (residential complex) detail page path: /jk/:slug (a single slug segment). */
const COMPLEX_PATH = /^\/jk\/([^/]+)\/?$/;

/** Public ЖК marketplace browse page path: /jk (no slug). */
const COMPLEX_BROWSE_PATH = /^\/jk\/?$/;

/** Public journal article detail page path: /jurnal/:slug (a single slug segment). */
const JOURNAL_PATH = /^\/jurnal\/([^/]+)\/?$/;

/** Public journal list browse page path: /jurnal (no slug). */
const JOURNAL_BROWSE_PATH = /^\/jurnal\/?$/;

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
 * the identical reason. It is subscription-gated via getSiteMeta: a live slug gets
 * the full og-meta + JSON-LD (200); a known-but-paused/lapsed slug gets a minimal
 * noindex head (200, never 404 for a real realtor); only an unknown slug throws
 * NotFoundException → the plain 404 shell.
 *
 * The public ЖК pages are the same special case again: 'jk' is ALSO an API
 * controller (@Controller('jk') → /api/jk, /api/jk/:slug), so it cannot be a
 * prefix-excluded SSR route without un-prefixing that API GET. Both the detail
 * page (GET /jk/:slug) and the marketplace browse page (GET /jk) land here:
 * /jk/:slug gets its complex og-meta for a live slug (200) or the plain 404 shell
 * for an unknown one; /jk is a real browse page, so it gets the plain shell with
 * a 200 (site-default OG) — it need not fetch any complex.
 *
 * The public journal pages are the same special case again: 'jurnal' is ALSO an
 * API controller (@Controller('jurnal') → /api/jurnal, /api/jurnal/:slug), so it
 * cannot be a prefix-excluded SSR route without un-prefixing that API GET. Both
 * the article page (GET /jurnal/:slug) and the list browse page (GET /jurnal)
 * land here: /jurnal/:slug gets its article og-meta for a live PUBLISHED slug
 * (200) or the plain 404 shell for an unknown/draft one (never leaks a draft);
 * /jurnal is a real browse page, so it gets the plain shell with a 200.
 */
@Catch(NotFoundException)
export class NotFoundShellFilter implements ExceptionFilter {
  constructor(
    private readonly html: HtmlCacheService,
    private readonly presentations: PresentationsService,
    private readonly realtors: RealtorPublicService,
    private readonly complexes: ComplexesPublicService,
    private readonly journal: JournalPublicService,
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

    // Custom apex domain: any unmatched GET on a verified host (except the /embed page
    // handled below) serves the realtor site shell, so a deep link like
    // https://ali.uz/xyz still boots realtor mode. Canonical is the apex '/'.
    if (req.method === 'GET' && req.realtorSlug && !req.path.endsWith('/embed')) {
      try {
        const meta = await this.realtors.getSiteMeta(req.realtorSlug);
        const baseUrl = realtorHostBaseUrl(req.hostname);
        res
          .status(200)
          .type('html')
          .send(
            this.html.injectMeta(
              shell,
              realtorBootstrapScript(req.realtorSlug) +
                buildRealtorMetaTags(meta, req.realtorSlug, baseUrl, `${baseUrl}/`),
            ),
          );
        return;
      } catch (error) {
        if (!(error instanceof NotFoundException)) throw error;
      }
    }

    const embedMatch = req.method === 'GET' ? REALTOR_EMBED_PATH.exec(req.path) : null;
    const embedSlug = embedMatch?.[1];
    if (embedSlug) {
      try {
        const meta = await this.realtors.getSiteMeta(embedSlug);
        const baseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });
        // This page (only) is meant to be framed by external sites: drop the global
        // X-Frame-Options: SAMEORIGIN default (Step 2) and allow any frame-ancestor.
        res.removeHeader('X-Frame-Options');
        res.status(200).type('html').setHeader('Content-Security-Policy', 'frame-ancestors *');
        res.send(
          this.html.injectMeta(
            shell,
            realtorBootstrapScript(embedSlug, 'embed') +
              buildRealtorMetaTags(meta, embedSlug, baseUrl),
          ),
        );
        return;
      } catch (error) {
        // Unknown/paused slug → fall through to the plain 404 shell.
        if (!(error instanceof NotFoundException)) throw error;
      }
    }

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
        // getSiteMeta (not getBySlug): a known-but-paused slug returns siteActive:false
        // → buildRealtorMetaTags emits the minimal noindex head @200; ONLY an unknown
        // slug throws NotFoundException and falls through to the plain 404 shell.
        const meta = await this.realtors.getSiteMeta(slug);
        const baseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });
        res
          .status(200)
          .type('html')
          .send(this.html.injectMeta(shell, buildRealtorMetaTags(meta, slug, baseUrl)));
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

    const journalMatch = req.method === 'GET' ? JOURNAL_PATH.exec(req.path) : null;
    const articleSlug = journalMatch?.[1];
    if (articleSlug) {
      try {
        const article = await this.journal.getBySlug(articleSlug);
        const baseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });
        res
          .status(200)
          .type('html')
          .send(this.html.injectMeta(shell, buildArticleMetaTags(article, articleSlug, baseUrl)));
        return;
      } catch (error) {
        // Unknown/draft slug → fall through to the plain 404 shell, same as obj/:id.
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

    // The journal list browse page (GET /jurnal) is a real SPA page, not a missing
    // route: serve the plain shell (site-default OG) with a 200 so a hard refresh
    // or shared /jurnal link opens the list, mirroring the /jk browse branch.
    if (req.method === 'GET' && JOURNAL_BROWSE_PATH.test(req.path)) {
      res.status(200).type('html').send(shell);
      return;
    }

    res.status(404).type('html').send(shell);
  }
}
