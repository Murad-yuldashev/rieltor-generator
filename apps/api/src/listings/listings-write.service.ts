import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  allowedTransitions,
  PublishableListingSchema,
  type ListingInput,
  type ListingStatus,
} from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RealtorsService } from '../realtors/realtors.service';

/**
 * The listing columns are NOT NULL with no database default, but a DRAFT is saved
 * half-filled. A new row therefore starts from these empty placeholders and the
 * realtor fills them in with later PATCHes; publish-validation guarantees real
 * values before the listing is ever public. `type` has no enum default, so a DRAFT
 * starts SECONDARY — the realtor changes it in the form.
 */
const DRAFT_DEFAULTS = {
  title: '',
  priceSom: BigInt(0),
  priceUsd: 0,
  areaM2: 0,
  district: '',
  address: '',
  landmark: '',
  description: '',
  type: 'SECONDARY',
} as const;

/** 48 hours: the window in which a mistaken SOLD/RENTED can be undone. */
const UNDO_WINDOW_MS = 48 * 60 * 60 * 1000;
/** A published listing lives 30 days before the stage-4 cron may archive it. */
const LISTING_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Everything publish-validation and the transition rules need in one read. */
const STATUS_CHANGE_SELECT = {
  realtorId: true,
  status: true,
  soldAt: true,
  title: true,
  priceSom: true,
  priceUsd: true,
  areaM2: true,
  district: true,
  type: true,
  deal: true,
  rooms: true,
  _count: { select: { images: true } },
} as const;

@Injectable()
export class ListingsWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtors: RealtorsService,
  ) {}

  /**
   * A new listing starts as a DRAFT owned by the realtor. syncAgent runs first
   * because Listing.agentId is NOT NULL — the Agent mirror must exist before the row
   * is created. The id is a cuid, so it never collides with the seed's "bx-001".
   */
  async createDraft(realtorId: string, input: ListingInput): Promise<{ id: string }> {
    const agentId = await this.realtors.syncAgent(realtorId);
    return this.prisma.listing.create({
      data: {
        ...DRAFT_DEFAULTS,
        ...this.toData(input),
        status: 'DRAFT',
        realtorId,
        agentId,
        listedAt: new Date(),
      },
      select: { id: true },
    });
  }

  async update(realtorId: string, id: string, input: ListingInput): Promise<{ id: string }> {
    await this.assertOwner(realtorId, id);
    await this.prisma.listing.update({ where: { id }, data: this.toData(input) });
    return { id };
  }

  /** 404 if the listing is missing, 403 if it belongs to another realtor. */
  async assertOwner(realtorId: string, id: string): Promise<void> {
    const row = await this.prisma.listing.findUnique({
      where: { id },
      select: { realtorId: true },
    });
    if (!row) throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    if (row.realtorId !== realtorId) throw new ForbiddenException('Bu obyekt sizga tegishli emas');
  }

  /**
   * Applies a realtor status transition, enforcing the §7.4 table plus the two rules
   * that need runtime data: publish-validation on DRAFT→ACTIVE, and the 48-hour undo
   * window on SOLD/RENTED→ACTIVE. `now` is injectable so a test can pin the clock.
   */
  async changeStatus(
    realtorId: string,
    id: string,
    to: ListingStatus,
    now: Date = new Date(),
  ): Promise<{ status: ListingStatus }> {
    const row = await this.prisma.listing.findUnique({
      where: { id },
      select: STATUS_CHANGE_SELECT,
    });
    if (!row) throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    if (row.realtorId !== realtorId) throw new ForbiddenException('Bu obyekt sizga tegishli emas');

    // Publish is the one transition with validation and a trusted-based target.
    if (row.status === 'DRAFT' && to === 'ACTIVE') {
      return this.publish(realtorId, id, row, now);
    }

    if (!allowedTransitions(row.status, 'realtor').includes(to)) {
      throw new ConflictException(`Holatni ${row.status} dan ${to} ga o'zgartirib bo'lmaydi`);
    }

    const reactivatingSold =
      (row.status === 'SOLD' || row.status === 'RENTED') && to === 'ACTIVE';
    if (
      reactivatingSold &&
      (!row.soldAt || now.getTime() - row.soldAt.getTime() > UNDO_WINDOW_MS)
    ) {
      throw new ConflictException("Qaytarish muddati (48 soat) o'tib ketgan");
    }

    const data: {
      status: ListingStatus;
      soldAt?: Date | null;
      publishedAt?: Date;
      expiresAt?: Date;
    } = { status: to };
    if (to === 'SOLD' || to === 'RENTED') data.soldAt = now;
    if (reactivatingSold) data.soldAt = null;
    if (to === 'ACTIVE' && row.status === 'ARCHIVED') {
      data.publishedAt = now;
      data.expiresAt = new Date(now.getTime() + LISTING_TTL_MS);
    }

    await this.prisma.listing.update({ where: { id }, data });
    return { status: to };
  }

  /** DRAFT → live: full validation, then ACTIVE (trusted) or PENDING (needs review). */
  private async publish(
    realtorId: string,
    id: string,
    row: {
      title: string;
      priceSom: bigint;
      priceUsd: number;
      areaM2: number;
      district: string;
      type: string;
      deal: string;
      rooms: number | null;
      _count: { images: number };
    },
    now: Date,
  ): Promise<{ status: ListingStatus }> {
    const parsed = PublishableListingSchema.safeParse({
      title: row.title,
      priceSom: row.priceSom.toString(),
      priceUsd: row.priceUsd,
      areaM2: row.areaM2,
      district: row.district,
      type: row.type,
      deal: row.deal,
      rooms: row.rooms,
    });
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.issues[0]?.message ?? "E'lon to'liq emas");
    }
    if (row._count.images < 1) {
      throw new UnprocessableEntityException('Kamida bitta rasm kerak');
    }

    const realtor = await this.prisma.realtor.findUniqueOrThrow({
      where: { id: realtorId },
      select: { phone: true, trusted: true },
    });
    if (!realtor.phone) {
      throw new UnprocessableEntityException('Profilda telefon raqami kiritilishi kerak');
    }

    // Refresh the public Agent card with the now-guaranteed phone.
    await this.realtors.syncAgent(realtorId);

    const status: ListingStatus = realtor.trusted ? 'ACTIVE' : 'PENDING';
    await this.prisma.listing.update({
      where: { id },
      data:
        status === 'ACTIVE'
          ? { status, publishedAt: now, expiresAt: new Date(now.getTime() + LISTING_TTL_MS) }
          : { status },
    });
    return { status };
  }

  /**
   * Maps the shared input onto Prisma columns. Only keys the request actually sent
   * are written, so a one-field edit cannot blank the rest; priceSom — a string on
   * the wire — becomes a BigInt for the column.
   */
  private toData(input: ListingInput): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      data[key] = key === 'priceSom' ? BigInt(value as string) : value;
    }
    return data;
  }
}
