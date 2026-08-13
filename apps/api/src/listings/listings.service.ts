import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ListingDetail,
  ListingStatus,
  ListingSummary,
  OwnerListingDetail,
  OwnerListingSummary,
} from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { listingInclude, toListingDetail, toListingSummary } from './mapper';
import { toOwnerListingDetail, toOwnerListingSummary } from './owner-mapper';

/**
 * A listing detail page stays open for these — SOLD/RENTED are kept as a trust
 * signal. Exported so LeadsService can apply the exact same "is this listing
 * publicly visible" rule to POST /api/leads (design spec §8.4).
 */
export const PUBLIC_DETAIL_STATUSES: ListingStatus[] = ['ACTIVE', 'RESERVED', 'SOLD', 'RENTED'];

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ListingSummary[]> {
    const rows = await this.prisma.listing.findMany({
      where: { status: { in: ['ACTIVE', 'RESERVED'] } },
      include: listingInclude(),
      orderBy: { id: 'asc' },
    });
    return rows.map(toListingSummary);
  }

  async findOne(id: string): Promise<ListingDetail> {
    const row = await this.prisma.listing.findUnique({
      where: { id },
      include: listingInclude(),
    });
    if (!row || !PUBLIC_DETAIL_STATUSES.includes(row.status)) {
      throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    }
    return toListingDetail(row);
  }

  async findOwn(realtorId: string): Promise<OwnerListingSummary[]> {
    const rows = await this.prisma.listing.findMany({
      where: { realtorId },
      include: listingInclude(),
      orderBy: { id: 'desc' },
    });
    return rows.map(toOwnerListingSummary);
  }

  async findOwnOne(realtorId: string, id: string): Promise<OwnerListingDetail> {
    const row = await this.prisma.listing.findUnique({
      where: { id },
      include: listingInclude(),
    });
    if (!row || row.realtorId !== realtorId) {
      throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    }
    return toOwnerListingDetail(row);
  }
}
