import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { HtmlCacheService } from './html-cache.service';

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
 */
@Catch(NotFoundException)
export class NotFoundShellFilter implements ExceptionFilter {
  constructor(private readonly html: HtmlCacheService) {}

  async catch(exception: NotFoundException, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    if (req.path === '/api' || req.path.startsWith('/api/')) {
      res.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    const shell = await this.html.shell();
    res.status(404).type('html').send(shell);
  }
}
