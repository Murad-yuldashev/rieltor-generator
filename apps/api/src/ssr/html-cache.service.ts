import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';

/** Marker inside index.html — preserved through the Vite build. */
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

  /** Read from disk once; later requests only do string replacement. */
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
   * Replaces the marker with the generated tags. The static <title> is stripped
   * as well — otherwise the page would carry two <title> elements and a browser
   * or scraper would use the first (generic) one instead of buildMetaTags' title.
   */
  injectMeta(shell: string, tags: string): string {
    const cleaned = shell.replace(/<title>[^<]*<\/title>\s*/i, '');
    return cleaned.includes(OG_MARKER)
      ? cleaned.replace(OG_MARKER, tags)
      : cleaned.replace('</head>', `    ${tags}\n  </head>`);
  }
}
