import { Injectable, NotFoundException } from '@nestjs/common';
import type { NoteWithListing } from '@rieltor/shared';
import { toListingSummary } from '../listings/mapper';
import { PrismaService } from '../prisma/prisma.service';

// Mirrors the listings service's FULL_INCLUDE — toListingSummary needs the
// listing's agent plus its images (ordered) to build a ListingSummary.
const LISTING_SUMMARY_INCLUDE = {
  agent: true,
  images: { orderBy: { position: 'asc' } },
} as const;

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  /** All of this realtor's notes, newest first, each joined to its listing summary. */
  async list(realtorId: string): Promise<NoteWithListing[]> {
    const rows = await this.prisma.note.findMany({
      where: { realtorId },
      orderBy: { updatedAt: 'desc' },
      include: { listing: { include: LISTING_SUMMARY_INCLUDE } },
    });
    return rows.map((n) => ({
      listingId: n.listingId,
      body: n.body,
      updatedAt: n.updatedAt.toISOString(),
      listing: toListingSummary(n.listing),
    }));
  }

  async get(realtorId: string, listingId: string) {
    const n = await this.prisma.note.findUnique({
      where: { realtorId_listingId: { realtorId, listingId } },
    });
    return n ? { listingId, body: n.body, updatedAt: n.updatedAt.toISOString() } : null;
  }

  /** Upsert the single note for (realtor, listing). 404 if the listing does not exist. */
  async upsert(realtorId: string, listingId: string, body: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException('E’lon topilmadi');
    const n = await this.prisma.note.upsert({
      where: { realtorId_listingId: { realtorId, listingId } },
      update: { body },
      create: { realtorId, listingId, body },
    });
    return { listingId, body: n.body, updatedAt: n.updatedAt.toISOString() };
  }

  async remove(realtorId: string, listingId: string) {
    await this.prisma.note.deleteMany({ where: { realtorId, listingId } });
  }
}
