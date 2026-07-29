import { Controller, Get, Header, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { Env } from '../config/env';
import { ObjectsService } from '../objects/objects.service';
import { HtmlCacheService } from './html-cache.service';
import { metaTeglar } from './meta';

@ApiExcludeController()
@Controller()
export class SsrController {
  constructor(
    private readonly objects: ObjectsService,
    private readonly html: HtmlCacheService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get()
  @Header('content-type', 'text/html; charset=utf-8')
  async bosh(): Promise<string> {
    return this.html.qobiq();
  }

  @Get('obj/:id')
  @Header('content-type', 'text/html; charset=utf-8')
  async obyekt(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const qobiq = await this.html.qobiq();
    const baseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });

    try {
      const obj = await this.objects.bittasi(id);
      return this.html.injectQil(qobiq, metaTeglar(obj, baseUrl));
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      // 404 status bilan bir xil SPA qobig'i — front o'zi "topilmadi" sahifasini ko'rsatadi.
      res.status(404);
      return qobiq;
    }
  }
}
