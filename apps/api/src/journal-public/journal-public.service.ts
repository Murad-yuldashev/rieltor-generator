import { Injectable, NotFoundException } from '@nestjs/common';
import type { ArticleCategory, ArticleDetail, ArticleSummary } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toArticleDetail, toArticleSummary } from './mapper';

@Injectable()
export class JournalPublicService {
  constructor(private readonly prisma: PrismaService) {}

  /** Published articles, newest first, optionally filtered by category. */
  async list(category?: ArticleCategory): Promise<ArticleSummary[]> {
    const rows = await this.prisma.article.findMany({
      where: { status: 'PUBLISHED', ...(category ? { category } : {}) },
      orderBy: { publishedAt: 'desc' },
    });
    return rows.map(toArticleSummary);
  }

  /** A published article by slug. Unknown/draft slug → 404 (never leaks a draft). */
  async getBySlug(slug: string): Promise<ArticleDetail> {
    const row = await this.prisma.article.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: { author: { select: { name: true } } },
    });
    if (!row) throw new NotFoundException();
    return toArticleDetail(row);
  }
}
