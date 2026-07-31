import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { HtmlCacheService } from './html-cache.service';

/**
 * NestJS'ning o'zi (mos marshrut topilmaganda "Cannot GET /x" bilan) yoki
 * ilova kodi (masalan ListingsService) otgan NotFoundException'ni ushlaydi.
 *
 * `/api/*` so'rovlar uchun standart JSON xatolik saqlanadi — API
 * kontraktini buzmaslik uchun (mavjud e2e testlar shunga tayanadi).
 * Qolgan barcha yo'llar — ya'ni mos marshrut topilmagan har qanday
 * hard-navigation (masalan "GET /foo" yoki "GET /obj/bx-001/ortiqcha") —
 * uchun head-inject qilingan SPA qobig'i 404 status bilan qaytariladi,
 * shunda front o'zining <NotFoundPage /> ni ko'rsatadi (spec §8).
 *
 * setGlobalPrefix'ning `exclude` ro'yxatiga catch-all marshrut qo'shish
 * ishlamaydi: u {path, method} bo'yicha butun ilova bo'ylab tekshiriladi,
 * controller'ga bog'liq emas — shuning uchun '{*yol}' kabi keng qolip
 * barcha GET marshrutlaridan 'api/' prefiksini olib tashlardi (tekshirib
 * ko'rildi: /api/health "Cannot GET /api/health"ga aylanib qoldi).
 * Shu sababli catch-all @Get('*') o'rniga shu filter ishlatiladi.
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
