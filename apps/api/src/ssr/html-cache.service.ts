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
  private cached: string | null = null;

  constructor(private readonly config: ConfigService<Env, true>) {}

  get distPath(): string {
    return (
      this.config.get('WEB_DIST', { infer: true }) ??
      resolve(__dirname, '..', '..', '..', 'web', 'dist')
    );
  }

  /** Diskdan bir marta o'qiladi; keyingi so'rovlarda faqat satr almashtirish bo'ladi. */
  async shell(): Promise<string> {
    if (this.cached !== null) return this.cached;

    const htmlPath = join(this.distPath, 'index.html');
    const html = await readFile(htmlPath, 'utf8');

    if (!html.includes(OG_MARKER)) {
      this.logger.error(
        `${htmlPath} ichida ${OG_MARKER} markeri yo'q — OG teglari inject qilinmaydi`,
      );
    }

    this.cached = html;
    return html;
  }

  /**
   * Markerni tayyor teglar bilan almashtiradi. Statik <title> ham olib
   * tashlanadi — aks holda sahifada ikkita <title> qoladi va brauzer/scraper
   * birinchisini (umumiy nom) ishlatadi, buildMetaTags bergan nom emas.
   */
  injectMeta(shell: string, tags: string): string {
    const cleaned = shell.replace(/<title>[^<]*<\/title>\s*/i, '');
    return cleaned.includes(OG_MARKER)
      ? cleaned.replace(OG_MARKER, tags)
      : cleaned.replace('</head>', `    ${tags}\n  </head>`);
  }
}
