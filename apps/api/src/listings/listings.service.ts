import { randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LISTING_REQUIRED_FIELDS } from '@rieltor/shared';
import type { ListingDetail, ListingSummary } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toListingDetail, toListingSummary } from './mapper';

const FULL_INCLUDE = { agent: true, images: { orderBy: { position: 'asc' } } } as const;

// Seeded agency agent id — user listings are attributed to their own account
// in Phase 3, when the realtor profile exists.
const DEFAULT_AGENT_ID = 'agent-1';

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
}
