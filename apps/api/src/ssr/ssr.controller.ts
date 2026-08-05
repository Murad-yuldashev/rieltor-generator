import { Controller, Get, Header, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { Env } from '../config/env';
import { ListingsService } from '../listings/listings.service';
import { HtmlCacheService } from './html-cache.service';
import { buildMetaTags } from './meta';
import { SPA_ROUTES } from './routes';

@ApiExcludeController()
@Controller()
export class SsrController {
  constructor(
    private readonly listings: ListingsService,
    private readonly html: HtmlCacheService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * The home page plus the rest of the bottom-nav pages. If a path is not listed
   * here, NotFoundShellFilter takes over and returns the shell with a 404 status —
   * the page still opens, but the link reads as "gone" to search engines. The list
   * comes from the same source as the exclude list in bootstrap.ts.
   */
  @Get(['', ...SPA_ROUTES])
  @Header('content-type', 'text/html; charset=utf-8')
  async shell(): Promise<string> {
    return this.html.shell();
  }

  @Get('obj/:id')
  @Header('content-type', 'text/html; charset=utf-8')
  async listing(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const shell = await this.html.shell();
    const baseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });

    try {
      const listing = await this.listings.findOne(id);
      return this.html.injectMeta(shell, buildMetaTags(listing, baseUrl));
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      // Same SPA shell, but with a 404 status — the frontend renders its own "not found" page.
      res.status(404);
      return shell;
    }
  }
}
