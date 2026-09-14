import { resolve } from 'node:path';
import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ArticleCreate,
  ArticleUpdate,
  ModeratorArticleDetail,
  ModeratorArticleRow,
} from '@rieltor/shared';
import type { Article } from '@prisma/client';
import { slugify } from '../developer/slug';
import { processImage } from '../listings/process-image';
import { PrismaService } from '../prisma/prisma.service';

// Same directory bootstrap.ts serves '/images' from, resolved relative to the
// API root (not this file after compilation) — mirrors developer.service.
const PUBLIC_DIR = resolve(__dirname, '..', '..', 'public');

@Injectable()
export class ModerationJournalService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every article (drafts included), newest edit first. */
  async list(): Promise<ModeratorArticleRow[]> {
    const rows = await this.prisma.article.findMany({ orderBy: { updatedAt: 'desc' } });
    return rows.map((r) => this.toRow(r));
  }

  /** Full article for the editor; 404 if missing. */
  async get(id: string): Promise<ModeratorArticleDetail> {
    const row = await this.prisma.article.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Maqola topilmadi');
    return this.toDetail(row);
  }

  /** Create a DRAFT authored by the caller, with a unique slug from the title. */
  async create(authorId: string, input: ArticleCreate): Promise<ModeratorArticleDetail> {
    const slug = await this.uniqueSlug(input.title);
    const row = await this.prisma.article.create({
      data: {
        slug,
        title: input.title,
        excerpt: input.excerpt,
        body: input.body,
        category: input.category,
        status: 'DRAFT',
        authorId,
      },
    });
    return this.toDetail(row);
  }

  /**
   * Edit title/excerpt/body/category; 404 if missing. The slug is regenerated
   * from the new title only while the article is still a DRAFT — once published,
   * the slug is frozen so the public URL never changes underneath a live page.
   */
  async update(id: string, input: ArticleUpdate): Promise<ModeratorArticleDetail> {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Maqola topilmadi');

    const slug =
      existing.status === 'DRAFT' ? await this.uniqueSlug(input.title, id) : existing.slug;

    const row = await this.prisma.article.update({
      where: { id },
      data: {
        slug,
        title: input.title,
        excerpt: input.excerpt,
        body: input.body,
        category: input.category,
      },
    });
    return this.toDetail(row);
  }

  /** Publish; idempotent — a second publish keeps the first `publishedAt`. 404 if missing. */
  async publish(id: string): Promise<ModeratorArticleDetail> {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Maqola topilmadi');

    const row = await this.prisma.article.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: existing.publishedAt ?? new Date(),
      },
    });
    return this.toDetail(row);
  }

  /** Back to DRAFT (the `publishedAt` stamp is retained). 404 if missing. */
  async unpublish(id: string): Promise<ModeratorArticleDetail> {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Maqola topilmadi');

    const row = await this.prisma.article.update({
      where: { id },
      data: { status: 'DRAFT' },
    });
    return this.toDetail(row);
  }

  /**
   * Write the cover via the shared sharp pipeline (variants under
   * `public/images/article/<id>/`) and store the `{ base, ogUrl, width, height }`
   * on the row. 404 if the article is missing. Mirrors developer.addComplexImage.
   */
  async setCover(id: string, file: Express.Multer.File): Promise<ModeratorArticleDetail> {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Maqola topilmadi');

    const result = await processImage({
      source: file.buffer,
      outputRoot: PUBLIC_DIR,
      // A path segment only: base becomes "/images/article/<id>/00".
      listingId: `article/${id}`,
      position: 0,
      makeOg: true, // the cover doubles as the og:image
    });

    const row = await this.prisma.article.update({
      where: { id },
      data: {
        coverBase: result.base,
        coverOgUrl: result.ogUrl,
        coverWidth: result.width,
        coverHeight: result.height,
      },
    });
    return this.toDetail(row);
  }

  /**
   * Compute a unique article slug from `title`, appending `-1`, `-2`, … until no
   * OTHER article holds it (`selfId` is excluded so re-slugging a draft keeps it).
   * Never surfaces a P2002 to the client.
   */
  private async uniqueSlug(title: string, selfId?: string): Promise<string> {
    const base = slugify(title);
    for (let i = 0; ; i++) {
      const candidate = i === 0 ? base : `${base}-${i}`;
      const clash = await this.prisma.article.findFirst({
        where: { slug: candidate, ...(selfId ? { NOT: { id: selfId } } : {}) },
        select: { id: true },
      });
      if (!clash) return candidate;
    }
  }

  private toRow(a: Article): ModeratorArticleRow {
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      category: a.category,
      status: a.status,
      publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
      updatedAt: a.updatedAt.toISOString(),
    };
  }

  private toDetail(a: Article): ModeratorArticleDetail {
    const cover =
      a.coverBase && a.coverWidth != null && a.coverHeight != null
        ? { base: a.coverBase, ogUrl: a.coverOgUrl, width: a.coverWidth, height: a.coverHeight }
        : null;
    return { ...this.toRow(a), excerpt: a.excerpt, body: a.body, cover };
  }
}
