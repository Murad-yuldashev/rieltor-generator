import { randomBytes } from 'node:crypto';
import { resolveTxt } from 'node:dns/promises';
import { resolve } from 'node:path';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { IMAGE_MAX_WIDTH, imageVariantSrc } from '@rieltor/shared';
import type { RealtorProfile, RealtorProfileUpdate } from '@rieltor/shared';
import type { Env } from '../config/env';
import { processImage } from '../listings/process-image';
import { PrismaService } from '../prisma/prisma.service';

// Slugs that would shadow a first-class marketplace route (/search, /new, /r,
// /favorites, ...) — a realtor must not claim one, or their microsite would
// collide with a real page. Matched case-insensitively against the lowercased slug.
const RESERVED_SLUGS = new Set([
  'search',
  'new',
  'obj',
  'p',
  'r',
  'favorites',
  'contact',
  'offer',
  'api',
  'agent',
  'my',
  'requests',
  'valuation',
  'notifications',
]);

// Same static root bootstrap.ts serves '/images' from — resolved the same way as
// ListingsService.PUBLIC_DIR (relative to the API root, not this file post-compile).
const PUBLIC_DIR = resolve(__dirname, '..', '..', 'public');

@Injectable()
export class ProfileService {
  private readonly platformHost: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.platformHost = new URL(
      config.get('PUBLIC_BASE_URL', { infer: true }),
    ).hostname.toLowerCase();
  }

  async get(userId: string): Promise<RealtorProfile> {
    const p = await this.prisma.realtorProfile.findUnique({ where: { userId } });
    return {
      agency: p?.agency ?? '',
      bio: p?.bio ?? null,
      regions: p?.regions ?? [],
      experienceYears: p?.experienceYears ?? null,
      slug: p?.slug ?? null,
      verified: p?.verified ?? false,
      logoUrl: p?.logoUrl ?? null,
      brandColor: p?.brandColor ?? null,
      coverImageUrl: p?.coverImageUrl ?? null,
      tagline: p?.tagline ?? null,
      contactPhone: p?.contactPhone ?? null,
      contactTelegram: p?.contactTelegram ?? null,
      contactWhatsapp: p?.contactWhatsapp ?? null,
      instagramUrl: p?.instagramUrl ?? null,
      telegramChannelUrl: p?.telegramChannelUrl ?? null,
      seoTitle: p?.seoTitle ?? null,
      seoDescription: p?.seoDescription ?? null,
      sitePublished: p?.sitePublished ?? true,
      customDomain: p?.customDomain ?? null,
      customDomainVerified: p?.customDomainVerified ?? false,
      customDomainToken: p?.customDomainToken ?? null,
    };
  }

  async update(userId: string, patch: RealtorProfileUpdate): Promise<RealtorProfile> {
    const data: RealtorProfileUpdate = { ...patch };

    // Semantic slug checks (the schema already enforced the format at the
    // controller). null is allowed — it clears/unpublishes the slug.
    if (typeof data.slug === 'string') {
      data.slug = data.slug.toLowerCase();
      if (RESERVED_SLUGS.has(data.slug)) {
        throw new BadRequestException('Bu manzil band');
      }
    }

    try {
      await this.prisma.realtorProfile.upsert({
        where: { userId },
        update: { ...data },
        create: {
          userId,
          agency: data.agency ?? '',
          bio: data.bio ?? null,
          regions: data.regions ?? [],
          experienceYears: data.experienceYears ?? null,
          slug: data.slug ?? null,
          brandColor: data.brandColor ?? null,
          // coverImageUrl/logoUrl are absent from RealtorProfileUpdate (upload-only),
          // so they are not enumerated here — they default to null in the DB.
          tagline: data.tagline ?? null,
          contactPhone: data.contactPhone ?? null,
          contactWhatsapp: data.contactWhatsapp ?? null,
          contactTelegram: data.contactTelegram ?? null,
          instagramUrl: data.instagramUrl ?? null,
          telegramChannelUrl: data.telegramChannelUrl ?? null,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
          sitePublished: data.sitePublished ?? true,
        },
      });
    } catch (err) {
      // The @unique on RealtorProfile.slug rejects a slug already taken by
      // another realtor with P2002.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Bu manzil allaqachon olingan');
      }
      throw err;
    }

    return this.get(userId);
  }

  /**
   * Store a single brand logo. Reuses the listing image pipeline (processImage +
   * PUBLIC_DIR) so logos produce the same variants; the folder is keyed by user
   * (position 1), so a reupload overwrites the previous logo in place. No listing
   * Image row is created — a logo is just a file whose URL lands in logoUrl.
   */
  async setLogo(userId: string, file: Express.Multer.File): Promise<RealtorProfile> {
    const result = await processImage({
      source: file.buffer,
      outputRoot: PUBLIC_DIR,
      listingId: `logo-${userId}`,
      position: 1,
      makeOg: false,
    });

    // logoUrl is consumed as a direct <img src> (mapper falls it into photoUrl),
    // so store a renderable variant — the largest WebP, which preserves logo
    // transparency the JPG fallback would flatten.
    const logoUrl = imageVariantSrc(result.base, IMAGE_MAX_WIDTH);

    // upsert, not update: becomeRealtor grants the role without creating a
    // RealtorProfile row, so a realtor may upload a logo before saving a profile.
    await this.prisma.realtorProfile.upsert({
      where: { userId },
      update: { logoUrl },
      create: { userId, agency: '', logoUrl },
    });

    return this.get(userId);
  }

  /**
   * Store the public microsite cover image. Mirrors setLogo (same processImage +
   * PUBLIC_DIR pipeline, user-keyed folder so a reupload overwrites in place), but
   * with makeOg: true so the stored URL is the true 1200×630 OG JPEG — one
   * correctly-sized image serves both the hero band and og:image (Task 6),
   * matching the codebase-wide `ogUrl` OG convention (e.g. the seed's og.jpg).
   */
  async setCover(userId: string, file: Express.Multer.File): Promise<RealtorProfile> {
    const result = await processImage({
      source: file.buffer,
      outputRoot: PUBLIC_DIR,
      listingId: `cover-${userId}`,
      position: 1,
      makeOg: true,
    });

    // Store the 1200×630 OG crop (not a listing variant): it is the hero band's
    // source and og:image at once, so Task 6's fixed og:image:width/height match.
    const coverImageUrl = result.ogUrl;

    await this.prisma.realtorProfile.upsert({
      where: { userId },
      update: { coverImageUrl },
      create: { userId, agency: '', coverImageUrl },
    });

    return this.get(userId);
  }

  /** DNS TXT record host a realtor must publish to prove domain ownership. */
  static verifyTxtHost(domain: string): string {
    return `_rieltor-verify.${domain}`;
  }

  /**
   * Claim (or re-claim) a custom apex domain. Requires a published slug first (a
   * verified domain with no slug would be unservable — the host resolver keys on
   * slug). Refuses the platform's own host and localhost. Mints a fresh token and
   * resets verified→false. Uses update (not upsert): a realtor with a slug always
   * has a RealtorProfile row. NOT unique at the DB level — see verifyDomain.
   */
  async setDomain(userId: string, domain: string): Promise<RealtorProfile> {
    const profile = await this.prisma.realtorProfile.findUnique({
      where: { userId },
      select: { slug: true },
    });
    if (!profile?.slug) {
      throw new BadRequestException('Avval sahifa manzili (slug) belgilang');
    }
    if (domain === this.platformHost || domain === 'localhost' || domain.endsWith('.localhost')) {
      throw new BadRequestException('Bu domen band');
    }
    const token = randomBytes(16).toString('hex');
    await this.prisma.realtorProfile.update({
      where: { userId },
      data: { customDomain: domain, customDomainToken: token, customDomainVerified: false },
    });
    return this.get(userId);
  }

  /**
   * Check the DNS TXT record and flip customDomainVerified when it matches the
   * stored token. Idempotent: a still-missing record leaves verified=false with no
   * error (the cabinet shows "pending"); a DNS lookup failure (NXDOMAIN, no TXT) is
   * treated the same way — a not-yet-published record, not a 500. On success, any
   * OTHER realtor's (now stale) claim on the same host is released in the same
   * transaction — this is where "one VERIFIED holder per host" is enforced (there
   * is no DB @unique), and it also handles a legitimate domain transfer. Only the
   * true DNS owner can ever match (each realtor has a distinct token), so this can
   * never let an attacker steal a live domain.
   */
  async verifyDomain(userId: string): Promise<RealtorProfile> {
    const p = await this.prisma.realtorProfile.findUnique({
      where: { userId },
      select: { customDomain: true, customDomainToken: true },
    });
    if (!p?.customDomain || !p.customDomainToken) {
      throw new BadRequestException('Avval domen manzilini saqlang');
    }
    let matched = false;
    try {
      const records = await resolveTxt(ProfileService.verifyTxtHost(p.customDomain));
      // resolveTxt returns string[][] — each record may be split into chunks; join them.
      matched = records.some((chunks) => chunks.join('') === p.customDomainToken);
    } catch {
      matched = false; // NXDOMAIN / no TXT yet → still pending, not an error.
    }
    if (matched) {
      const domain = p.customDomain;
      await this.prisma.$transaction([
        this.prisma.realtorProfile.updateMany({
          where: { customDomain: domain, userId: { not: userId } },
          data: { customDomainVerified: false, customDomain: null, customDomainToken: null },
        }),
        this.prisma.realtorProfile.update({
          where: { userId },
          data: { customDomainVerified: true },
        }),
      ]);
    }
    return this.get(userId);
  }

  /** Remove the custom domain (host routing falls back to /r/:slug). updateMany so a
   *  realtor with no profile row is a no-op, never a P2025. */
  async clearDomain(userId: string): Promise<RealtorProfile> {
    await this.prisma.realtorProfile.updateMany({
      where: { userId },
      data: { customDomain: null, customDomainToken: null, customDomainVerified: false },
    });
    return this.get(userId);
  }
}
