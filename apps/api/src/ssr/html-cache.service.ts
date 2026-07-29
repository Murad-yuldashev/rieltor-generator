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

  /** Markerni tayyor teglar bilan almashtiradi. */
  injectQil(qobiq: string, teglar: string): string {
    return qobiq.includes(OG_MARKER)
      ? qobiq.replace(OG_MARKER, teglar)
      : qobiq.replace('</head>', `    ${teglar}\n  </head>`);
  }
}
