import { Injectable } from '@nestjs/common';
import { imageVariantSrc, type RealtorOwnListing } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RealtorContentService {
  constructor(private readonly prisma: PrismaService) {}

  /** The caller's own PUBLISHED listings, shaped for the social-content card. */
  async ownListings(userId: string): Promise<RealtorOwnListing[]> {
    const rows = await this.prisma.listing.findMany({
      where: { ownerId: userId, status: 'PUBLISHED' },
      orderBy: { listedAt: 'desc' },
      // Cover = the lowest-position image. Use orderBy asc + take 1 (the codebase idiom,
      // listings.service.ts:263) — NOT where:{position:1}: removeImage does not renumber, so
      // a listing whose position-1 photo was deleted would otherwise report "no cover".
      include: { images: { orderBy: { position: 'asc' }, take: 1, select: { base: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      priceSom: r.priceSom.toString(),
      deal: r.deal,
      type: r.type,
      rooms: r.rooms,
      areaM2: r.areaM2,
      district: r.district,
      imageUrl: r.images[0] ? imageVariantSrc(r.images[0].base, 1200) : null,
    }));
  }
}
