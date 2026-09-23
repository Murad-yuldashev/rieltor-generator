import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { imageVariantSrc, type RealtorOwnListing } from '@rieltor/shared';
import type { AiContentRequest, AiSocialContent } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env';
import { GeminiService } from '../ai/gemini.service';
import { buildContentTemplate } from '../ai/ai-content.template';
import { buildContentPrompt, parseContent } from '../ai/ai-content.parse';

@Injectable()
export class RealtorContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly config: ConfigService<Env, true>,
  ) {}

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

  /**
   * Caption + hashtags (Gemini, template fallback) + the closed-loop share URL for the
   * realtor's OWN PUBLISHED listing. 404s a missing / non-owned / draft listing (no leak).
   */
  async generate(userId: string, listingId: string): Promise<AiSocialContent> {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, ownerId: userId, status: 'PUBLISHED' },
      select: {
        id: true,
        type: true,
        deal: true,
        district: true,
        rooms: true,
        areaM2: true,
        priceSom: true,
      },
    });
    if (!listing) throw new NotFoundException("E'lon topilmadi"); // double quotes — apostrophe in Uzbek

    const req: AiContentRequest = {
      type: listing.type,
      deal: listing.deal,
      district: listing.district,
      rooms: listing.rooms,
      areaM2: listing.areaM2,
      priceSom: listing.priceSom.toString(),
    };
    const template = buildContentTemplate(req);
    const raw = await this.gemini.generate(buildContentPrompt(req), { maxTokens: 400 });
    const base = parseContent(raw, template); // { ai, caption, hashtags }; never throws

    const profile = await this.prisma.realtorProfile.findUnique({
      where: { userId },
      select: { slug: true, customDomain: true, customDomainVerified: true },
    });
    const publicBaseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });
    const shareUrl =
      profile?.customDomain && profile.customDomainVerified
        ? `https://${profile.customDomain}/obj/${listing.id}`
        : profile?.slug
          ? `${publicBaseUrl}/r/${profile.slug}`
          : `${publicBaseUrl}/obj/${listing.id}`;

    return { ...base, shareUrl };
  }
}
