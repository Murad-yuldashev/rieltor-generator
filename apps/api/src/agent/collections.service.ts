import { Injectable, NotFoundException } from '@nestjs/common';
import type { CollectionDetail, CollectionSummary } from '@rieltor/shared';
import { toListingSummary } from '../listings/mapper';
import { PrismaService } from '../prisma/prisma.service';

// Mirrors the listings service's FULL_INCLUDE (and notes.service's local copy) —
// toListingSummary needs the listing's agent plus its ordered images to build a
// ListingSummary. A later fast-follow will dedupe these against an exported
// listings FULL_INCLUDE.
const LISTING_SUMMARY_INCLUDE = {
  agent: true,
  images: { orderBy: { position: 'asc' } },
} as const;

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** All of this realtor's collections, newest first, each with its item count. */
  async list(realtorId: string): Promise<CollectionSummary[]> {
    const rows = await this.prisma.collection.findMany({
      where: { realtorId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { items: true } } },
    });
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      itemCount: c._count.items,
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async create(realtorId: string, name: string): Promise<CollectionSummary> {
    const c = await this.prisma.collection.create({ data: { realtorId, name } });
    return { id: c.id, name: c.name, itemCount: 0, updatedAt: c.updatedAt.toISOString() };
  }

  /**
   * Load a collection and assert this realtor owns it, else 404. The guard for
   * every :id route — a foreign realtor's collection is indistinguishable from a
   * missing one, so ownership failures surface as NotFound, never Forbidden.
   */
  private async ownedOrThrow(realtorId: string, id: string) {
    const collection = await this.prisma.collection.findUnique({ where: { id } });
    if (!collection || collection.realtorId !== realtorId) {
      throw new NotFoundException('Podborka topilmadi');
    }
    return collection;
  }

  /** Ownership-checked; items ordered by position asc, each with its ListingSummary. */
  async detail(realtorId: string, id: string): Promise<CollectionDetail> {
    const collection = await this.ownedOrThrow(realtorId, id);
    const items = await this.prisma.collectionItem.findMany({
      where: { collectionId: id },
      orderBy: { position: 'asc' },
      include: { listing: { include: LISTING_SUMMARY_INCLUDE } },
    });
    return {
      id: collection.id,
      name: collection.name,
      items: items.map((it) => ({
        listingId: it.listingId,
        position: it.position,
        note: it.note,
        listing: toListingSummary(it.listing),
      })),
    };
  }

  async rename(realtorId: string, id: string, name: string): Promise<CollectionSummary> {
    await this.ownedOrThrow(realtorId, id);
    const c = await this.prisma.collection.update({
      where: { id },
      data: { name },
      include: { _count: { select: { items: true } } },
    });
    return {
      id: c.id,
      name: c.name,
      itemCount: c._count.items,
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  async remove(realtorId: string, id: string): Promise<void> {
    await this.ownedOrThrow(realtorId, id);
    await this.prisma.collection.delete({ where: { id } }); // items cascade via schema
  }

  /**
   * Append a listing to the end of the collection. Idempotent: if the listing is
   * already present, keep its existing row/position (a pre-check avoids the
   * @@unique throw). 404 if the collection or the listing does not exist.
   */
  async addItem(realtorId: string, id: string, listingId: string): Promise<CollectionDetail> {
    await this.ownedOrThrow(realtorId, id);
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException('E’lon topilmadi');

    const existing = await this.prisma.collectionItem.findUnique({
      where: { collectionId_listingId: { collectionId: id, listingId } },
      select: { id: true },
    });
    if (!existing) {
      const last = await this.prisma.collectionItem.aggregate({
        where: { collectionId: id },
        _max: { position: true },
      });
      await this.prisma.collectionItem.create({
        data: { collectionId: id, listingId, position: (last._max.position ?? 0) + 1 },
      });
    }
    return this.detail(realtorId, id);
  }

  async removeItem(realtorId: string, id: string, listingId: string): Promise<CollectionDetail> {
    await this.ownedOrThrow(realtorId, id);
    await this.prisma.collectionItem.deleteMany({ where: { collectionId: id, listingId } });
    return this.detail(realtorId, id);
  }

  /**
   * Reposition the collection's items to match listingIds' order (1-based, to
   * match addItem's numbering). Ids not in the collection are ignored; every
   * update runs in one transaction.
   */
  async reorder(realtorId: string, id: string, listingIds: string[]): Promise<CollectionDetail> {
    await this.ownedOrThrow(realtorId, id);
    const rows = await this.prisma.collectionItem.findMany({
      where: { collectionId: id },
      select: { listingId: true },
    });
    const inCollection = new Set(rows.map((r) => r.listingId));
    const updates = listingIds
      .filter((listingId) => inCollection.has(listingId))
      .map((listingId, index) =>
        this.prisma.collectionItem.update({
          where: { collectionId_listingId: { collectionId: id, listingId } },
          data: { position: index + 1 },
        }),
      );
    await this.prisma.$transaction(updates);
    return this.detail(realtorId, id);
  }
}
