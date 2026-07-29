import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';

/** index.html ichidagi marker — Vite build'da ham saqlanadi. */
export const OG_MARKER = '<!--OG-META-->';

@Injectable()
export class HtmlCacheService {
  private readonly logger = new Logger(HtmlCacheService.name);
  private kesh: string | null = null;

  constructor(private readonly config: ConfigService<Env, true>) {}

  get distYoli(): string {
    return (
      this.config.get('WEB_DIST', { infer: true }) ??
      resolve(__dirname, '..', '..', '..', 'web', 'dist')
    );
  }

  /** Diskdan bir marta o'qiladi; keyingi so'rovlarda faqat satr almashtirish bo'ladi. */
  async qobiq(): Promise<string> {
    if (this.kesh !== null) return this.kesh;

    const yol = join(this.distYoli, 'index.html');
    const html = await readFile(yol, 'utf8');

    if (!html.includes(OG_MARKER)) {
      this.logger.error(`${yol} ichida ${OG_MARKER} markeri yo'q — OG teglari inject qilinmaydi`);
    }

    this.kesh = html;
    return html;
  }

  /**
   * Markerni tayyor teglar bilan almashtiradi. Statik <title> ham olib
   * tashlanadi — aks holda sahifada ikkita <title> qoladi va brauzer/scraper
   * birinchisini (umumiy nom) ishlatadi, metaTeglar bergan nom emas.
   */
  injectQil(qobiq: string, teglar: string): string {
    const tozalangan = qobiq.replace(/<title>[^<]*<\/title>\s*/i, '');
    return tozalangan.includes(OG_MARKER)
      ? tozalangan.replace(OG_MARKER, teglar)
      : tozalangan.replace('</head>', `    ${teglar}\n  </head>`);
  }
}
