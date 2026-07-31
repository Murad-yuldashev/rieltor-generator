import { Controller, Get, Header, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { Env } from '../config/env';
import { ListingsService } from '../listings/listings.service';
import { HtmlCacheService } from './html-cache.service';
import { buildMetaTags } from './meta';

@ApiExcludeController()
@Controller()
export class SsrController {
  constructor(
    private readonly listings: ListingsService,
    private readonly html: HtmlCacheService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get()
  @Header('content-type', 'text/html; charset=utf-8')
  async home(): Promise<string> {
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
      // 404 status bilan bir xil SPA qobig'i — front o'zi "topilmadi" sahifasini ko'rsatadi.
      res.status(404);
      return shell;
    }
  }
}
