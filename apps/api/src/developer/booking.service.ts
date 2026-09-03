import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Booking, BookingCreate } from '@rieltor/shared';
import type { Booking as BookingRow } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DeveloperService } from './developer.service';

/** Default hold length (days) when the caller does not specify `holdDays`. */
const DEFAULT_HOLD_DAYS = 3;
/** Milliseconds in a day. */
const DAY_MS = 86_400_000;

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dev: DeveloperService,
  ) {}

  /** Row -> `Booking` DTO (holdUntil/createdAt as ISO strings, note/cancelReason passthrough). */
  private toBooking(b: BookingRow): Booking {
    return {
      id: b.id,
      unitId: b.unitId,
      clientName: b.clientName,
      clientPhone: b.clientPhone,
      holdUntil: b.holdUntil.toISOString(),
      status: b.status,
      note: b.note,
      cancelReason: b.cancelReason,
      createdAt: b.createdAt.toISOString(),
    };
  }

  /**
   * Hold an AVAILABLE unit for a client (org-scoped + AVAILABLE-only + row-locked).
   * Foreign/missing unit -> 404; a non-AVAILABLE unit -> 409. The `FOR UPDATE` lock
   * serialises concurrent books on the same unit so exactly one wins.
   */
  async book(userId: string, unitId: string, input: BookingCreate): Promise<Booking> {
    await this.dev.assertUnitOwned(userId, unitId); // 404 if not this org's unit
    const holdUntil = new Date(Date.now() + (input.holdDays ?? DEFAULT_HOLD_DAYS) * DAY_MS);
    const booking = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM "Unit" WHERE id = ${unitId} FOR UPDATE`;
      const unit = await tx.unit.findUnique({ where: { id: unitId }, select: { status: true } });
      if (!unit) throw new NotFoundException('Xonadon topilmadi');
      if (unit.status !== 'AVAILABLE') throw new ConflictException("Xonadon bo'sh emas");
      const b = await tx.booking.create({
        data: {
          unitId,
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          holdUntil,
          note: input.note ?? null,
          createdById: userId,
        },
      });
      await tx.unit.update({ where: { id: unitId }, data: { status: 'BOOKED' } });
      return b;
    });
    return this.toBooking(booking);
  }
}
