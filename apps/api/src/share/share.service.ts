import { randomBytes } from 'node:crypto';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ShareLink } from '@rieltor/shared';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

const BASE62_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CODE_LENGTH = 6;
/** 62^6 combinations — a collision on the first try is astronomically unlikely; this
 *  just bounds the retry loop so a create() call can never spin forever. */
const MAX_CODE_ATTEMPTS = 5;

/**
 * A 6-char base62 attribution code (spec §8.1) — not a secret, just a short id a
 * realtor pastes into a Telegram post. `byte % 62` on a uniform random byte has a
 * small bias toward the alphabet's first characters (256 is not a multiple of 62),
 * harmless for a non-cryptographic, collision-checked label like this.
 */
function generateShareCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = '';
  for (const byte of bytes) code += BASE62_ALPHABET[byte % BASE62_ALPHABET.length];
  return code;
}

@Injectable()
export class ShareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async create(realtorId: string, listingId: string, label: string | undefined): Promise<ShareLink> {
    await this.assertOwner(realtorId, listingId);
    const baseUrl = this.config.get('PUBLIC_BASE_URL', { infer: true });

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = generateShareCode();
      try {
        await this.prisma.shareLink.create({ data: { code, listingId, label } });
        return { code, url: `${baseUrl}/obj/${listingId}?s=${code}` };
      } catch (error) {
        // P2002: unique constraint on `code` — retry with a freshly generated one
        // rather than fail the realtor's request over a near-impossible collision.
        if ((error as { code?: string }).code === 'P2002') continue;
        throw error;
      }
    }
    throw new ConflictException("Ulashish havolasini yaratib bo'lmadi, qayta urinib ko'ring");
  }

  /** 404 if the listing is missing, 403 if it belongs to another realtor. */
  private async assertOwner(realtorId: string, listingId: string): Promise<void> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { realtorId: true },
    });
    if (!listing) throw new NotFoundException(`Obyekt topilmadi: ${listingId}`);
    if (listing.realtorId !== realtorId) {
      throw new ForbiddenException('Bu obyekt sizga tegishli emas');
    }
  }
}
