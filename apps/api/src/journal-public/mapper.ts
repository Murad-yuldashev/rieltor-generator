import type { Article, User } from '@prisma/client';
import type { ArticleCover, ArticleDetail, ArticleSummary } from '@rieltor/shared';

export type ArticleRow = Article & { author?: Pick<User, 'name'> | null };

function cover(a: Article): ArticleCover | null {
  if (!a.coverBase || a.coverWidth == null || a.coverHeight == null) return null;
  return { base: a.coverBase, ogUrl: a.coverOgUrl, width: a.coverWidth, height: a.coverHeight };
}

export function toArticleSummary(a: ArticleRow): ArticleSummary {
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    cover: cover(a),
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
  };
}

export function toArticleDetail(a: ArticleRow): ArticleDetail {
  return { ...toArticleSummary(a), body: a.body, authorName: a.author?.name ?? 'Rieltor' };
}
