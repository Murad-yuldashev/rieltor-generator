import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  Building,
  BuildingCreate,
  BuildingUpdate,
  Complex,
  ComplexCreate,
  ComplexDetail,
  ComplexUpdate,
  Image,
  Organization,
  Unit,
  UnitBulkUpdate,
  UnitCreate,
  UnitUpdate,
} from '@rieltor/shared';
import type {
  Building as BuildingRow,
  Complex as ComplexRow,
  ComplexImage as ComplexImageRow,
  Unit as UnitRow,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** A unit row optionally carrying its active booking (populated by `listUnits`). */
type UnitRowWithBookings = UnitRow & {
  bookings?: { id: string; clientName: string; clientPhone: string; holdUntil: Date }[];
};

/** A complex row carrying its ordered images (populated by the complex read queries). */
type ComplexRowWithImages = ComplexRow & { images: ComplexImageRow[] };

@Injectable()
export class DeveloperService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * USER -> DEVELOPER + a new organization with the caller as OWNER.
   * Idempotent: an existing member keeps their org (no second org is created).
   */
  async becomeDeveloper(userId: string, name: string, district?: string): Promise<Organization> {
    const existing = await this.prisma.membership.findUnique({
      where: { userId },
      select: { orgId: true },
    });
    if (existing) {
      // Re-assert the role on the idempotent branch: UserRole is a single column, so a user
      // who became a realtor in between was flipped to REALTOR. Re-submitting become-developer
      // restores /crm access (self-service recovery) instead of a silent 200 no-op lockout.
      await this.prisma.user.update({ where: { id: userId }, data: { role: 'DEVELOPER' } });
      return this.orgView(userId); // idempotent — do not create a second org
    }
    // One transaction: a crash between the writes would otherwise strand a DEVELOPER
    // with no org — unrecoverable, since the become-developer page is gone once role=DEVELOPER.
    await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({ data: { name, district: district ?? null } });
      await tx.membership.create({ data: { orgId: org.id, userId, role: 'OWNER' } });
      await tx.user.update({ where: { id: userId }, data: { role: 'DEVELOPER' } });
    });
    return this.orgView(userId);
  }

  /** The caller's org id, resolved from their single membership. Throws if none (guard prevents this). */
  async orgIdOf(userId: string): Promise<string> {
    const m = await this.prisma.membership.findUnique({
      where: { userId },
      select: { orgId: true },
    });
    if (!m) throw new NotFoundException('Tashkilot topilmadi');
    return m.orgId;
  }

  async orgView(userId: string): Promise<Organization> {
    const orgId = await this.orgIdOf(userId);
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        district: true,
        verified: true,
        verificationRequestedAt: true,
        verifiedAt: true,
        members: {
          select: { userId: true, role: true, user: { select: { name: true, phone: true } } },
        },
      },
    });
    return {
      id: org!.id,
      name: org!.name,
      district: org!.district,
      verified: org!.verified,
      verificationRequestedAt: org!.verificationRequestedAt?.toISOString() ?? null,
      verifiedAt: org!.verifiedAt?.toISOString() ?? null,
      members: org!.members.map((m) => ({
        userId: m.userId,
        role: m.role,
        name: m.user.name,
        phone: m.user.phone,
      })),
    };
  }

  // ---- Complex CRUD (org-scoped) -------------------------------------------

  /** `ComplexImage` row -> shared `Image` DTO. */
  private toImage(img: ComplexImageRow): Image {
    return {
      base: img.base,
      ogUrl: img.ogUrl,
      width: img.width,
      height: img.height,
      position: img.position,
    };
  }

  /**
   * Row (+ ordered images) -> `Complex` DTO. Dates as ISO strings; `coverImage`
   * is the first image by position (images are queried ordered), `imageCount`
   * the gallery size.
   */
  private toComplex(c: ComplexRowWithImages): Complex {
    return {
      id: c.id,
      name: c.name,
      district: c.district,
      address: c.address,
      description: c.description,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      slug: c.slug,
      publishStatus: c.publishStatus,
      publishedAt: c.publishedAt?.toISOString() ?? null,
      latitude: c.latitude,
      longitude: c.longitude,
      coverImage: c.images[0] ? this.toImage(c.images[0]) : null,
      imageCount: c.images.length,
    };
  }

  /**
   * Load a complex the caller's org owns, or 404.
   * A foreign complex is indistinguishable from a missing one (no cross-org leak).
   */
  private async complexOwnedOrThrow(userId: string, id: string): Promise<ComplexRow> {
    const orgId = await this.orgIdOf(userId);
    const complex = await this.prisma.complex.findUnique({ where: { id } });
    if (!complex || complex.orgId !== orgId) throw new NotFoundException('ЖК topilmadi');
    return complex;
  }

  /** All complexes of the caller's org, newest first. */
  async listComplexes(userId: string): Promise<Complex[]> {
    const orgId = await this.orgIdOf(userId);
    const rows = await this.prisma.complex.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { position: 'asc' } }, org: true },
    });
    return rows.map((c) => this.toComplex(c));
  }

  /** Create a complex in the caller's org. */
  async createComplex(userId: string, input: ComplexCreate): Promise<Complex> {
    const orgId = await this.orgIdOf(userId);
    const complex = await this.prisma.complex.create({
      data: {
        orgId,
        name: input.name,
        district: input.district,
        address: input.address ?? null,
        description: input.description ?? null,
        status: input.status ?? 'UNDER_CONSTRUCTION',
      },
      include: { images: { orderBy: { position: 'asc' } }, org: true },
    });
    return this.toComplex(complex);
  }

  /** One complex (owned) plus its buildings. */
  async getComplex(userId: string, id: string): Promise<ComplexDetail> {
    await this.complexOwnedOrThrow(userId, id);
    const complex = await this.prisma.complex.findUnique({
      where: { id },
      include: {
        buildings: { orderBy: { createdAt: 'asc' } },
        images: { orderBy: { position: 'asc' } },
        org: true,
      },
    });
    return {
      ...this.toComplex(complex!),
      buildings: complex!.buildings.map((b) => ({
        id: b.id,
        name: b.name,
        floors: b.floors,
        createdAt: b.createdAt.toISOString(),
      })),
      gallery: complex!.images.map((img) => this.toImage(img)),
    };
  }

  /** Update the provided fields of an owned complex. */
  async updateComplex(userId: string, id: string, input: ComplexUpdate): Promise<Complex> {
    await this.complexOwnedOrThrow(userId, id);
    const complex = await this.prisma.complex.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.district !== undefined && { district: input.district }),
        ...(input.address !== undefined && { address: input.address ?? null }),
        ...(input.description !== undefined && { description: input.description ?? null }),
        ...(input.status !== undefined && { status: input.status }),
      },
      include: { images: { orderBy: { position: 'asc' } }, org: true },
    });
    return this.toComplex(complex);
  }

  /** Delete an owned complex (cascades buildings/units via schema). */
  async deleteComplex(userId: string, id: string): Promise<{ ok: true }> {
    await this.complexOwnedOrThrow(userId, id);
    await this.prisma.complex.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Building CRUD (org-scoped via the complex) --------------------------

  /** Row -> `Building` DTO (createdAt as ISO string, floors passthrough). */
  private toBuilding(b: BuildingRow): Building {
    return {
      id: b.id,
      name: b.name,
      floors: b.floors,
      createdAt: b.createdAt.toISOString(),
    };
  }

  /**
   * Load a building the caller's org owns (via its complex), or 404.
   * A foreign building is indistinguishable from a missing one (no cross-org leak).
   */
  private async buildingOwnedOrThrow(userId: string, id: string): Promise<BuildingRow> {
    const building = await this.prisma.building.findUnique({
      where: { id },
      include: { complex: { select: { orgId: true } } },
    });
    if (!building || building.complex.orgId !== (await this.orgIdOf(userId))) {
      throw new NotFoundException('Bino topilmadi');
    }
    return building;
  }

  /** Create a building under an owned complex (foreign complex -> 404). */
  async createBuilding(
    userId: string,
    complexId: string,
    input: BuildingCreate,
  ): Promise<Building> {
    await this.complexOwnedOrThrow(userId, complexId);
    const building = await this.prisma.building.create({
      data: { complexId, name: input.name, floors: input.floors ?? null },
    });
    return this.toBuilding(building);
  }

  /** Update the provided fields of an owned building. */
  async updateBuilding(userId: string, id: string, input: BuildingUpdate): Promise<Building> {
    await this.buildingOwnedOrThrow(userId, id);
    const building = await this.prisma.building.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.floors !== undefined && { floors: input.floors ?? null }),
      },
    });
    return this.toBuilding(building);
  }

  /** Delete an owned building (cascades units via schema). */
  async deleteBuilding(userId: string, id: string): Promise<{ ok: true }> {
    await this.buildingOwnedOrThrow(userId, id);
    await this.prisma.building.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Unit CRUD (org-scoped via building -> complex) ----------------------

  /** Row -> `Unit` DTO (BigInt `priceSom` -> string, active booking summary when present). */
  private toUnit(u: UnitRowWithBookings): Unit {
    return {
      id: u.id,
      buildingId: u.buildingId,
      number: u.number,
      floor: u.floor,
      rooms: u.rooms,
      areaM2: u.areaM2,
      priceSom: u.priceSom != null ? String(u.priceSom) : null,
      status: u.status,
      activeBooking:
        u.bookings && u.bookings[0]
          ? {
              id: u.bookings[0].id,
              clientName: u.bookings[0].clientName,
              clientPhone: u.bookings[0].clientPhone,
              holdUntil: u.bookings[0].holdUntil.toISOString(),
            }
          : null,
    };
  }

  /**
   * Load a unit the caller's org owns (via building -> complex), or 404.
   * A foreign unit is indistinguishable from a missing one (no cross-org leak).
   */
  private async unitOwnedOrThrow(userId: string, id: string): Promise<UnitRow> {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: { building: { select: { complex: { select: { orgId: true } } } } },
    });
    if (!unit || unit.building.complex.orgId !== (await this.orgIdOf(userId))) {
      throw new NotFoundException('Xonadon topilmadi');
    }
    return unit;
  }

  /**
   * Public ownership assertion for a unit (via building -> complex), or 404.
   * Exposes the private `unitOwnedOrThrow` chain check for sibling services (e.g. BookingService).
   */
  async assertUnitOwned(userId: string, id: string): Promise<void> {
    await this.unitOwnedOrThrow(userId, id);
  }

  /** All units of an owned building, ordered by floor then number (foreign building -> 404). */
  async listUnits(userId: string, buildingId: string): Promise<Unit[]> {
    await this.buildingOwnedOrThrow(userId, buildingId);
    const rows = await this.prisma.unit.findMany({
      where: { buildingId },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
      include: {
        bookings: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, clientName: true, clientPhone: true, holdUntil: true },
        },
      },
    });
    return rows.map((u) => this.toUnit(u));
  }

  /** Create a unit under an owned building (foreign building -> 404). */
  async createUnit(userId: string, buildingId: string, input: UnitCreate): Promise<Unit> {
    await this.buildingOwnedOrThrow(userId, buildingId);
    const unit = await this.prisma.unit.create({
      data: {
        buildingId,
        number: input.number,
        floor: input.floor,
        rooms: input.rooms ?? null,
        areaM2: input.areaM2 ?? null,
        priceSom: input.priceSom != null ? BigInt(input.priceSom) : null,
        status: input.status ?? 'AVAILABLE',
      },
    });
    return this.toUnit(unit);
  }

  /** Update the provided fields of an owned unit (omitted fields untouched). */
  async updateUnit(userId: string, id: string, input: UnitUpdate): Promise<Unit> {
    await this.unitOwnedOrThrow(userId, id);
    // A status change must not strand an active hold: reject flipping the status of a unit that
    // still has an ACTIVE booking (the hold-guard the lock-based book() enforces, applied here too).
    if (input.status !== undefined) {
      const activeHold = await this.prisma.booking.count({
        where: { unitId: id, status: 'ACTIVE' },
      });
      if (activeHold > 0) {
        throw new ConflictException(
          "Band xonadon statusini o'zgartirib bo'lmaydi — avval bandni bekor qiling",
        );
      }
    }
    const unit = await this.prisma.unit.update({
      where: { id },
      data: {
        ...(input.number !== undefined && { number: input.number }),
        ...(input.floor !== undefined && { floor: input.floor }),
        ...(input.rooms !== undefined && { rooms: input.rooms ?? null }),
        ...(input.areaM2 !== undefined && { areaM2: input.areaM2 ?? null }),
        ...(input.priceSom !== undefined && { priceSom: BigInt(input.priceSom) }),
        ...(input.status !== undefined && { status: input.status }),
      },
    });
    return this.toUnit(unit);
  }

  /** Delete an owned unit. */
  async deleteUnit(userId: string, id: string): Promise<{ ok: true }> {
    await this.unitOwnedOrThrow(userId, id);
    await this.prisma.unit.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Bulk edit units from the shaxmatka grid: set `status` and/or `priceSom` on many units at once.
   *
   * Ownership is all-or-nothing: if any id is foreign to the caller's org (or missing) the whole
   * call 404s and NOTHING is written — no partial cross-org edit. A status change must NOT strand
   * an active hold, so units with an ACTIVE booking are skipped for the status change (`skippedBooked`);
   * a price change, when present, still applies to ALL owned units (booked ones included).
   */
  async bulkUpdateUnits(
    userId: string,
    input: UnitBulkUpdate,
  ): Promise<{ updated: number; skippedBooked: number }> {
    const orgId = await this.orgIdOf(userId);
    // All-or-nothing ownership: a single foreign/missing id fails the whole call before any write.
    const owned = await this.prisma.unit.count({
      where: { id: { in: input.unitIds }, building: { complex: { orgId } } },
    });
    if (owned !== input.unitIds.length) throw new NotFoundException('Xonadon topilmadi');
    const priceSom = input.priceSom !== undefined ? BigInt(input.priceSom) : undefined;
    let skippedBooked = 0;
    if (input.status !== undefined) {
      // Atomic skip: the DB evaluates "no ACTIVE booking" at write time, so a unit booked
      // concurrently is skipped for the status change (never stranding its hold).
      const statusRes = await this.prisma.unit.updateMany({
        where: { id: { in: input.unitIds }, bookings: { none: { status: 'ACTIVE' } } },
        data: { status: input.status, ...(priceSom !== undefined ? { priceSom } : {}) },
      });
      skippedBooked = input.unitIds.length - statusRes.count;
      // Price still applies to the skipped (active-booked) units.
      if (priceSom !== undefined && skippedBooked > 0) {
        await this.prisma.unit.updateMany({
          where: { id: { in: input.unitIds }, bookings: { some: { status: 'ACTIVE' } } },
          data: { priceSom },
        });
      }
    } else {
      // Price-only: applies to every owned unit.
      await this.prisma.unit.updateMany({
        where: { id: { in: input.unitIds } },
        data: { priceSom: priceSom! },
      });
    }
    const updated =
      input.status !== undefined ? input.unitIds.length - skippedBooked : input.unitIds.length;
    return { updated, skippedBooked };
  }
}
