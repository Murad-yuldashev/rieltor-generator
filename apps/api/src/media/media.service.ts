import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Image } from '@prisma/client';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { MEDIA_STORAGE, type MediaStorage } from './media-storage';
import { computePHash } from './phash';
import { renderImageVariants } from './variants';

/** Design spec §6.4. */
const MAX_IMAGES_PER_LISTING = 12;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
  ) {}

  /**
   * Renders variants + og.jpg (first image only) for every uploaded file, stores
   * them, and creates one Image row each. Two passes on purpose: the whole batch is
   * format-validated first (spec §6.4 — real type via sharp metadata, not the file
   * extension) before anything is written, so one bad file in a batch of several
   * cannot leave a partially-processed image behind.
   */
  async uploadImages(realtorId: string, listingId: string, files: Express.Multer.File[]): Promise<Image[]> {
    await this.assertOwner(realtorId, listingId);

    if (files.length === 0) {
      throw new UnprocessableEntityException('Fayl yuborilmadi');
    }

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException("Yuklanadigan rasmlar hajmi 4 MB dan oshmasligi kerak");
    }

    const existing = await this.prisma.image.findMany({
      where: { listingId },
      select: { position: true, base: true },
      orderBy: { position: 'asc' },
    });
    if (existing.length + files.length > MAX_IMAGES_PER_LISTING) {
      throw new UnprocessableEntityException(
        `Bitta e'longa ko'pi bilan ${MAX_IMAGES_PER_LISTING} ta rasm yuklash mumkin`,
      );
    }

    // Pass 1: reject the whole batch on the first non-image/unsupported file — the
    // real type comes from sharp's own decode, never from originalname/mimetype.
    for (const file of files) {
      const format = await this.detectFormat(file.buffer);
      if (!format) {
        throw new UnprocessableEntityException(
          'Faqat JPEG, PNG yoki WebP formatidagi rasmlar qabul qilinadi',
        );
      }
    }

    // Filename stems are tracked independently from `position`: after a delete,
    // remaining positions get renumbered but their files are not renamed (the
    // MediaStorage interface has no read/rename primitive), so a new upload must
    // never reuse a stem that is still referenced by another image's `base`.
    let nextStem = maxStem(existing.map((image) => image.base)) + 1;
    let nextPosition = existing.length;

    const created: Image[] = [];
    for (const file of files) {
      nextPosition += 1;
      const fileName = String(nextStem).padStart(2, '0');
      nextStem += 1;

      const rendered = await renderImageVariants(file.buffer);
      const base = `/images/${listingId}/${fileName}`;
      const isFirst = nextPosition === 1;

      await Promise.all(
        rendered.variants.map((variant) =>
          this.storage.save(`${listingId}/${fileName}-${variant.name}`, variant.body, contentTypeFor(variant.name)),
        ),
      );

      let ogUrl: string | null = null;
      if (isFirst && rendered.og) {
        await this.storage.save(`${listingId}/og.jpg`, rendered.og, 'image/jpeg');
        ogUrl = `/images/${listingId}/og.jpg`;
      }

      const phash = await computePHash(file.buffer);

      const image = await this.prisma.image.create({
        data: {
          listingId,
          base,
          ogUrl,
          width: rendered.width,
          height: rendered.height,
          position: nextPosition,
          phash,
        },
      });
      created.push(image);
    }

    return created;
  }

  /** Removes the stored keys and renumbers the remaining positions back to 1..N. */
  async deleteImage(realtorId: string, listingId: string, imageId: string): Promise<Image[]> {
    await this.assertOwner(realtorId, listingId);

    const image = await this.prisma.image.findUnique({ where: { id: imageId } });
    if (!image || image.listingId !== listingId) {
      throw new NotFoundException('Rasm topilmadi');
    }

    const fileName = image.base.split('/').pop();
    if (fileName) {
      await this.storage.remove(`${listingId}/${fileName}-`);
    }
    if (image.ogUrl) {
      await this.storage.remove(`${listingId}/og.jpg`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.image.delete({ where: { id: imageId } });

      const remaining = await tx.image.findMany({
        where: { listingId },
        orderBy: { position: 'asc' },
      });
      for (const [index, img] of remaining.entries()) {
        if (img.position !== index + 1) {
          await tx.image.update({ where: { id: img.id }, data: { position: index + 1 } });
        }
      }

      return tx.image.findMany({ where: { listingId }, orderBy: { position: 'asc' } });
    });
  }

  /** 404 if the listing is missing, 403 if it belongs to another realtor — mirrors ListingsWriteService.assertOwner. */
  private async assertOwner(realtorId: string, listingId: string): Promise<void> {
    const row = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { realtorId: true },
    });
    if (!row) throw new NotFoundException(`Obyekt topilmadi: ${listingId}`);
    if (row.realtorId !== realtorId) throw new ForbiddenException('Bu obyekt sizga tegishli emas');
  }

  /** Real type via sharp's own decode (spec §6.4) — a spoofed extension or mimetype cannot pass this. */
  private async detectFormat(buffer: Buffer): Promise<string | null> {
    try {
      const metadata = await sharp(buffer).metadata();
      return metadata.format && ALLOWED_FORMATS.has(metadata.format) ? metadata.format : null;
    } catch {
      return null;
    }
  }
}

function contentTypeFor(variantName: string): string {
  return variantName.endsWith('.jpg') ? 'image/jpeg' : 'image/webp';
}

/** Highest numeric filename stem among a listing's current Image.base values, or 0. */
function maxStem(bases: string[]): number {
  let max = 0;
  for (const base of bases) {
    const digits = /(\d+)$/.exec(base)?.[1];
    if (digits) max = Math.max(max, Number(digits));
  }
  return max;
}
