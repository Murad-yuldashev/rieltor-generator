import { Controller, Get, Header, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { Env } from '../config/env';
import { RealtorsService } from '../realtors/realtors.service';
import { HtmlCacheService } from './html-cache.service';
import { buildRealtorMetaTags } from './meta';

/**
 * Serves /r/:username as the SPA shell with OG meta injected — the realtor-showcase
 * mirror of SsrController's obj/:id handler (design spec §9.1). Kept as its own file
 * and controller, per the design's explicit "SsrController is not touched" rule, and
 * registered on the same excluded (non-'api') path family in bootstrap.ts.
 */
@ApiExcludeController()
@Controller()
export class RealtorSsrController {
  constructor(
    private readonly realtors: RealtorsService,
    private readonly html: HtmlCacheService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get('r/:username')
  @Header('content-type', 'text/html; charset=utf-8')
  async showcase(
    @Param('username') username: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const shell = await this.html.shell();
    const baseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });

    try {
      const realtor = await this.realtors.showcase(username);
      return this.html.injectMeta(shell, buildRealtorMetaTags(realtor, baseUrl));
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      // Same SPA shell, but with a 404 status — the frontend renders its own "not found" page.
      res.status(404);
      return shell;
    }
  }
}
