import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Booking, BookingAction, BookingCreate, BookingRow } from '@rieltor/shared';
import type { Booking as BookingRecord } from '@prisma/client';
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
  private toBooking(b: BookingRecord): Booking {
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

  /**
   * Load a booking the caller's org owns, or 404. Ownership is resolved via the
   * unit -> building -> complex -> orgId chain; a foreign booking is
   * indistinguishable from a missing one (no cross-org leak).
   */
  private async bookingOwnedOrThrow(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        status: true,
        unitId: true,
        unit: { select: { building: { select: { complex: { select: { orgId: true } } } } } },
      },
    });
    if (!booking || booking.unit.building.complex.orgId !== (await this.dev.orgIdOf(userId))) {
      throw new NotFoundException('Band topilmadi');
    }
    return booking;
  }

  /**
   * Run a lifecycle action on an ACTIVE booking (org-scoped). Foreign/missing -> 404;
   * a non-ACTIVE booking -> 409. Booking + unit changes commit in one transaction:
   * - `cancel`: booking CANCELLED (+ cancelReason); a still-BOOKED unit -> AVAILABLE.
   * - `convert`: booking CONVERTED; unit -> SOLD.
   * - `extend`: push `holdUntil` forward (unit unchanged).
   */
  async act(userId: string, bookingId: string, input: BookingAction): Promise<Booking> {
    const booking = await this.bookingOwnedOrThrow(userId, bookingId);
    if (booking.status !== 'ACTIVE') throw new ConflictException('Band faol emas');
    const updated = await this.prisma.$transaction(async (tx) => {
      if (input.action === 'cancel') {
        const b = await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED', cancelReason: input.cancelReason ?? null },
        });
        // Release the unit only if it is still held (not already SOLD/AVAILABLE elsewhere).
        const unit = await tx.unit.findUnique({
          where: { id: booking.unitId },
          select: { status: true },
        });
        if (unit?.status === 'BOOKED') {
          await tx.unit.update({ where: { id: booking.unitId }, data: { status: 'AVAILABLE' } });
        }
        return b;
      }
      if (input.action === 'convert') {
        const b = await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'CONVERTED' },
        });
        await tx.unit.update({ where: { id: booking.unitId }, data: { status: 'SOLD' } });
        return b;
      }
      // extend: move the hold deadline; the unit stays BOOKED.
      const holdUntil = new Date(Date.now() + (input.holdDays ?? DEFAULT_HOLD_DAYS) * DAY_MS);
      return tx.booking.update({ where: { id: bookingId }, data: { holdUntil } });
    });
    return this.toBooking(updated);
  }

  /** All bookings of the caller's org (newest first, capped), each with unit + building labels. */
  async list(userId: string): Promise<BookingRow[]> {
    const orgId = await this.dev.orgIdOf(userId);
    const rows = await this.prisma.booking.findMany({
      where: { unit: { building: { complex: { orgId } } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { unit: { select: { number: true, building: { select: { name: true } } } } },
    });
    return rows.map((b) => ({
      ...this.toBooking(b),
      unitNumber: b.unit.number,
      buildingName: b.unit.building.name,
    }));
  }
}
