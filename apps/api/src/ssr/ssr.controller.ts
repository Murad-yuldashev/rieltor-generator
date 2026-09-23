import { Controller, Get, Header, NotFoundException, Param, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { Env } from '../config/env';
import { ListingsService } from '../listings/listings.service';
import { RealtorPublicService } from '../realtor-public/realtor-public.service';
import { HtmlCacheService } from './html-cache.service';
import { buildMetaTags, buildRealtorMetaTags, realtorBootstrapScript } from './meta';
import { realtorHostBaseUrl } from './realtor-host.middleware';
import { SPA_ROUTES } from './routes';

@ApiExcludeController()
@Controller()
export class SsrController {
  constructor(
    private readonly listings: ListingsService,
    private readonly html: HtmlCacheService,
    private readonly config: ConfigService<Env, true>,
    private readonly realtors: RealtorPublicService,
  ) {}

  /** Custom-domain apex: the realtor-site shell (bootstrap + realtor meta), with the
   *  realtor's own host as canonical (the apex '/' URL, not the /r/:slug path). */
  private async realtorApexShell(req: Request, slug: string): Promise<string> {
    const shell = await this.html.shell();
    const baseUrl = realtorHostBaseUrl(req.hostname);
    const meta = await this.realtors.getSiteMeta(slug);
    return this.html.injectMeta(
      shell,
      realtorBootstrapScript(slug) + buildRealtorMetaTags(meta, slug, baseUrl, `${baseUrl}/`),
    );
  }

  /**
   * The home page plus the rest of the bottom-nav pages. If a path is not listed
   * here, NotFoundShellFilter takes over and returns the shell with a 404 status —
   * the page still opens, but the link reads as "gone" to search engines. The list
   * comes from the same source as the exclude list in bootstrap.ts.
   */
  @Get(['', ...SPA_ROUTES])
  @Header('content-type', 'text/html; charset=utf-8')
  async shell(@Req() req: Request): Promise<string> {
    const slug = req.realtorSlug;
    if (!slug) return this.html.shell();
    try {
      return await this.realtorApexShell(req, slug);
    } catch {
      return this.html.shell(); // slug vanished between resolve and now → marketplace.
    }
  }

  @Get('obj/:id')
  @Header('content-type', 'text/html; charset=utf-8')
  async listing(
    @Param('id') id: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const shell = await this.html.shell();
    const slug = req.realtorSlug;
    const baseUrl = slug
      ? realtorHostBaseUrl(req.hostname)
      : this.config.get('PUBLIC_BASE_URL', { infer: true });
    const bootstrap = slug ? realtorBootstrapScript(slug) : '';

    try {
      const listing = await this.listings.findOne(id);
      return this.html.injectMeta(shell, bootstrap + buildMetaTags(listing, baseUrl));
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      res.status(404);
      if (slug) {
        // Custom host: realtor apex shell (keeps a <title>, boots realtor mode).
        try {
          return await this.realtorApexShell(req, slug);
        } catch {
          return shell;
        }
      }
      return shell; // Canonical host: the plain 404 shell (SPA renders NotFoundPage).
    }
  }
}
