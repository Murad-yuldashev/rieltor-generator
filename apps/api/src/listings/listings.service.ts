import { Injectable, NotFoundException } from '@nestjs/common';
import type { ListingDetail, ListingSummary } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toListingDetail, toListingSummary } from './mapper';

const FULL_INCLUDE = { agent: true, images: { orderBy: { position: 'asc' } } } as const;

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
}
