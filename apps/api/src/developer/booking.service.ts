import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Booking, BookingAction, BookingCreate, BookingRow } from '@rieltor/shared';
import { canonicalizePhone } from '@rieltor/shared';
import type { Booking as BookingRecord } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { OrgWalletService } from '../org-wallet/org-wallet.service';
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
    private readonly wallet: WalletService,
    private readonly orgWallet: OrgWalletService,
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
        clientPhone: true, // canonicalized at convert to attribute a cross-CRM fixation
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
        // Atomic ACTIVE->CONVERTED flip: the `updateMany` guard is the serialization
        // point. A concurrent/re-fired convert that already committed leaves count===0
        // here, so the unit flip AND the commission payout run at most once — no
        // double credit. (The pre-tx guard already 409s an obviously non-ACTIVE booking;
        // this defends the TOCTOU race where two converts both pass that read.)
        const { count } = await tx.booking.updateMany({
          where: { id: bookingId, status: 'ACTIVE' },
          data: { status: 'CONVERTED' },
        });
        if (count === 1) {
          await tx.unit.update({ where: { id: booking.unitId }, data: { status: 'SOLD' } });
          // Load the live SOLD price inside the tx. The RATE is NOT read live — it is
          // the fixation's snapshot (locked at fixate time), so a rate change the
          // developer made after fixating cannot cut the realtor's promised commission.
          const unit = await tx.unit.findUnique({
            where: { id: booking.unitId },
            select: { priceSom: true },
          });
          // Attribute the sale to an ACTIVE cross-CRM fixation on this (unit, buyer).
          const phone = canonicalizePhone(booking.clientPhone);
          const fixation = await tx.fixation.findFirst({
            where: { unitId: booking.unitId, buyerPhone: phone, status: 'ACTIVE' },
          });
          if (fixation) {
            // Pay at the FIXATED (snapshot) rate; the price stays the live SOLD price.
            const commissionSom =
              ((unit?.priceSom ?? 0n) * BigInt(fixation.commissionBps)) / 10000n;
            await tx.fixation.update({
              where: { id: fixation.id },
              // Keep commissionBps as-is (the snapshot); only stamp the payout + status.
              data: { status: 'CONVERTED', commissionSom, convertedAt: new Date() },
            });
            await tx.booking.update({
              where: { id: bookingId },
              data: { fixationId: fixation.id },
            });
            // A null price or a zero snapshot rate yields no payout; the sale still converts.
            if (commissionSom > 0n) {
              // `credit` self-ensures the wallet in-tx (upsert) — no base-client call here.
              await this.wallet.credit(tx, fixation.realtorId, commissionSom, {
                fixationId: fixation.id,
              });
              // Fund that commission from the owning org's wallet (may go negative — a recorded debt).
              await this.orgWallet.debitForCommission(
                tx,
                booking.unit.building.complex.orgId,
                commissionSom,
                { fixationId: fixation.id },
              );
            }
          }
        }
        // Return the current booking (freshly CONVERTED, or already-final on a lost race).
        const b = await tx.booking.findUnique({ where: { id: bookingId } });
        return b!;
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

  /** Expire ACTIVE bookings past holdUntil; free a unit only if it has NO remaining ACTIVE hold. */
  async expireOverdue(): Promise<{ expired: number }> {
    const now = new Date();
    const overdue = await this.prisma.booking.findMany({
      where: { status: 'ACTIVE', holdUntil: { lt: now } },
      select: { id: true, unitId: true },
    });
    let expired = 0;
    for (const b of overdue) {
      const done = await this.prisma.$transaction(async (tx) => {
        // Lock the unit so a concurrent book/cancel/convert/extend serialises against us.
        await tx.$queryRaw`SELECT 1 FROM "Unit" WHERE id = ${b.unitId} FOR UPDATE`;
        // Expire ONLY if this booking is still ACTIVE and still overdue (a concurrent
        // cancel/convert/extend may have changed status or pushed holdUntil forward).
        const res = await tx.booking.updateMany({
          where: { id: b.id, status: 'ACTIVE', holdUntil: { lt: now } },
          data: { status: 'EXPIRED' },
        });
        if (res.count === 0) return false;
        // Free the unit only if it has NO remaining ACTIVE booking (so a rebooked unit stays BOOKED).
        const stillActive = await tx.booking.count({
          where: { unitId: b.unitId, status: 'ACTIVE' },
        });
        if (stillActive === 0) {
          await tx.unit.updateMany({
            where: { id: b.unitId, status: 'BOOKED' },
            data: { status: 'AVAILABLE' },
          });
        }
        return true;
      });
      if (done) expired += 1;
    }
    return { expired };
  }
}
