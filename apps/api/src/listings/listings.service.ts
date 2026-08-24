import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LISTING_REQUIRED_FIELDS } from '@rieltor/shared';
import type { ListingDetail, ListingSummary } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toListingDetail, toListingSummary } from './mapper';
import { processImage } from './process-image';

const FULL_INCLUDE = { agent: true, images: { orderBy: { position: 'asc' } } } as const;

// Seeded agency agent id — user listings are attributed to their own account
// in Phase 3, when the realtor profile exists.
const DEFAULT_AGENT_ID = 'agent-1';

// Same directory bootstrap.ts serves '/images' from — resolved the same way
// (relative to the API root, not this file's location after compilation).
const PUBLIC_DIR = resolve(__dirname, '..', '..', 'public');

const MAX_IMAGES_PER_LISTING = 10;

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ListingSummary[]> {
    const rows = await this.prisma.listing.findMany({
      where: { status: 'PUBLISHED' },
      include: FULL_INCLUDE,
      orderBy: { id: 'asc' },
    });
    return rows.map(toListingSummary);
  }

  async findOne(id: string): Promise<ListingDetail> {
    const row = await this.prisma.listing.findFirst({
      where: { id, status: 'PUBLISHED' },
      include: FULL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    }
    return toListingDetail(row);
  }

  /** Called when the visitor taps the masked number — this event *is* the lead. */
  async revealContact(listingId: string, ip: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, status: 'PUBLISHED' },
      select: { agent: { select: { phone: true, telegram: true } } },
    });

    if (!listing) throw new NotFoundException();

    await this.prisma.contactReveal.create({ data: { listingId, ip } });

    return listing.agent;
  }

  async createDraft(ownerId: string) {
    const listing = await this.prisma.listing.create({
      data: {
        id: `u-${randomBytes(6).toString('hex')}`,
        ownerId,
        status: 'DRAFT',
        // Placeholders that the wizard overwrites step by step. The columns are
        // non-null in the schema, which the seeded rows rely on.
        title: '',
        priceSom: 0n,
        priceUsd: 0,
        areaM2: 0,
        district: '',
        address: '',
        landmark: '',
        description: '',
        type: 'SECONDARY',
        deal: 'SALE',
        listedAt: new Date(),
        agentId: DEFAULT_AGENT_ID,
      },
      select: { id: true },
    });

    return listing;
  }

  async updateDraft(id: string, ownerId: string, patch: Record<string, unknown>) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { ownerId: true, status: true },
    });

    if (!listing || listing.ownerId !== ownerId) throw new NotFoundException();
    if (listing.status === 'PUBLISHED') {
      throw new BadRequestException('E’lon tahrirlash uchun avval arxivlanishi kerak');
    }

    const data = { ...patch };
    if (typeof data.priceSom === 'string') data.priceSom = BigInt(data.priceSom);

    await this.prisma.listing.update({ where: { id }, data });
  }

  async addImage(listingId: string, ownerId: string, file: Express.Multer.File) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true, status: true },
    });

    if (!listing || listing.ownerId !== ownerId) throw new NotFoundException();
    if (listing.status === 'PUBLISHED') {
      throw new BadRequestException('E’lon tahrirlash uchun avval arxivlanishi kerak');
    }

    const count = await this.prisma.image.count({ where: { listingId } });
    if (count >= MAX_IMAGES_PER_LISTING) {
      throw new BadRequestException('Ko‘pi bilan 10 ta rasm');
    }

    const position = count + 1;
    const result = await processImage({
      source: file.buffer,
      outputRoot: PUBLIC_DIR,
      listingId,
      position,
      makeOg: position === 1,
    });

    return this.prisma.image.create({
      data: {
        listingId,
        base: result.base,
        ogUrl: result.ogUrl,
        width: result.width,
        height: result.height,
        position,
      },
      // `id` is not part of the public `Image` shape (spec §-level payloads never
      // expose it), but the wizard's delete button needs it to call
      // DELETE /api/my/listings/:id/images/:imageId — there is no other handle.
      select: { id: true, base: true, position: true, width: true, height: true },
    });
  }

  async removeImage(listingId: string, imageId: string, ownerId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });

    if (!listing || listing.ownerId !== ownerId) throw new NotFoundException();

    // Scope the delete to the listing so an imageId from a different listing
    // can't be used to delete this listing's row.
    const { count } = await this.prisma.image.deleteMany({
      where: { id: imageId, listingId },
    });

    if (count === 0) throw new NotFoundException();
  }

  async submitForModeration(id: string, ownerId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });

    if (!listing || listing.ownerId !== ownerId) throw new NotFoundException();

    const missing = LISTING_REQUIRED_FIELDS.filter((field) => {
      const value = listing[field as keyof typeof listing];
      return value === null || value === undefined || value === '' || value === 0 || value === 0n;
    });

    if (missing.length > 0) {
      throw new BadRequestException(`To‘ldirilmagan maydonlar: ${missing.join(', ')}`);
    }

    const images = await this.prisma.image.count({ where: { listingId: id } });
    if (images === 0) throw new BadRequestException('Kamida bitta rasm yuklang');

    await this.prisma.listing.update({
      where: { id },
      data: { status: 'MODERATION', rejectionReason: null },
    });
  }

  async listMine(ownerId: string) {
    const rows = await this.prisma.listing.findMany({
      where: { ownerId },
      orderBy: { listedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        rejectionReason: true,
        priceSom: true,
        deal: true,
      },
    });

    // BigInt is not JSON-serialisable and may not fit in a number.
    return rows.map((row) => ({ ...row, priceSom: row.priceSom.toString() }));
  }

  async listForModeration() {
    const rows = await this.prisma.listing.findMany({
      where: { status: 'MODERATION' },
      orderBy: { listedAt: 'asc' },
      include: { images: { orderBy: { position: 'asc' }, take: 1 } },
    });

    // BigInt is not JSON-serialisable and may not fit in a number.
    return rows.map((row) => ({ ...row, priceSom: row.priceSom.toString() }));
  }

  async approve(id: string) {
    await this.prisma.listing.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), rejectionReason: null },
    });
  }

  async reject(id: string, reason: string) {
    await this.prisma.listing.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });
  }
}
