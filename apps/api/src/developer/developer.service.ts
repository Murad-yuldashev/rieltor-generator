import { resolve } from 'node:path';
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
import { processImage } from '../listings/process-image';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from './slug';

// Same directory bootstrap.ts serves '/images' from, resolved the same way as
// ListingsService (relative to the API root, not this file after compilation).
const PUBLIC_DIR = resolve(__dirname, '..', '..', 'public');

// Per-complex gallery cap — the guarded upload endpoint refuses beyond this.
const MAX_COMPLEX_IMAGES = 20;

/**
 * A unit row optionally carrying its active booking and active-fixation marker rows
 * (populated by the unit reads — `listUnits`, plus the create/update responses).
 */
type UnitRowWithBookings = UnitRow & {
  bookings?: { id: string; clientName: string; clientPhone: string; holdUntil: Date }[];
  fixations?: { id: string }[];
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
      commissionBps: c.commissionBps,
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
        ...(input.latitude !== undefined && { latitude: input.latitude }),
        ...(input.longitude !== undefined && { longitude: input.longitude }),
        ...(input.commissionBps !== undefined && { commissionBps: input.commissionBps }),
      },
      include: { images: { orderBy: { position: 'asc' } }, org: true },
    });
    return this.toComplex(complex);
  }

  /**
   * Compute a unique complex slug from `name`, appending `-2`, `-3`, … until no
   * OTHER complex holds it (the current complex `selfId` is excluded so republishing
   * keeps its slug).
   */
  private async uniqueComplexSlug(name: string, selfId: string): Promise<string> {
    const baseSlug = slugify(name);
    for (let n = 1; ; n++) {
      const candidate = n === 1 ? baseSlug : `${baseSlug}-${n}`.slice(0, 40);
      const clash = await this.prisma.complex.findFirst({
        where: { slug: candidate, NOT: { id: selfId } },
        select: { id: true },
      });
      if (!clash) return candidate;
    }
  }

  /**
   * Publish / unpublish an owned complex (foreign complex -> 404).
   *
   * Publishing is gated: the first failing check throws a 409 with its Uzbek message —
   * org unverified, then no image, then no priced-available unit. On success the slug is
   * minted once (kept across republishes) and the complex goes PUBLISHED with `publishedAt`.
   * Unpublishing just flips back to DRAFT (the slug is retained).
   */
  async setPublish(userId: string, complexId: string, publish: boolean): Promise<Complex> {
    const existing = await this.complexOwnedOrThrow(userId, complexId);
    if (publish) {
      // Gate 1: the organization must be verified.
      const org = await this.prisma.organization.findUnique({
        where: { id: existing.orgId },
        select: { verified: true },
      });
      if (org?.verified !== true) {
        throw new ConflictException("Avval tashkilotni tasdiqdan o'tkazing");
      }
      // Gate 2: at least one gallery image.
      const imageCount = await this.prisma.complexImage.count({ where: { complexId } });
      if (imageCount === 0) {
        throw new ConflictException('Kamida bitta rasm yuklang');
      }
      // Gate 3: at least one AVAILABLE unit that carries a price.
      const pricedAvailable = await this.prisma.unit.count({
        where: { building: { complexId }, status: 'AVAILABLE', priceSom: { not: null } },
      });
      if (pricedAvailable === 0) {
        throw new ConflictException("Kamida bitta narxli bo'sh xonadon kerak");
      }
      const slug = existing.slug ?? (await this.uniqueComplexSlug(existing.name, complexId));
      const complex = await this.prisma.complex.update({
        where: { id: complexId },
        data: { slug, publishStatus: 'PUBLISHED', publishedAt: new Date() },
        include: { images: { orderBy: { position: 'asc' } }, org: true },
      });
      return this.toComplex(complex);
    }
    const complex = await this.prisma.complex.update({
      where: { id: complexId },
      data: { publishStatus: 'DRAFT' },
      include: { images: { orderBy: { position: 'asc' } }, org: true },
    });
    return this.toComplex(complex);
  }

  /**
   * Request marketplace verification for the caller's org (idempotent).
   * Already-verified orgs are returned unchanged; otherwise `verificationRequestedAt`
   * is stamped so a moderator can review.
   */
  async requestVerification(userId: string): Promise<Organization> {
    const orgId = await this.orgIdOf(userId);
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { verified: true },
    });
    if (org?.verified !== true) {
      await this.prisma.organization.update({
        where: { id: orgId },
        data: { verificationRequestedAt: new Date() },
      });
    }
    return this.orgView(userId);
  }

  /** Delete an owned complex (cascades buildings/units via schema). */
  async deleteComplex(userId: string, id: string): Promise<{ ok: true }> {
    await this.complexOwnedOrThrow(userId, id);
    await this.prisma.complex.delete({ where: { id } });
    return { ok: true };
  }

  // ---- ComplexImage upload/delete (org-scoped via the complex) -------------

  /**
   * Add one gallery image to an owned complex (foreign complex -> 404).
   *
   * Enforces a per-complex cap (409 once full), then runs the shared sharp
   * pipeline — `processImage` writes variants under `public/images/complex/<id>/`
   * and returns the `{ base, ogUrl, width, height }` stored on the row. `position`
   * is (max existing position) + 1 so the gallery keeps append order; the first
   * image also gets an OG crop (it is the cover). Returns the fresh `ComplexDetail`
   * so the client re-renders the whole gallery from one response.
   */
  async addComplexImage(
    userId: string,
    complexId: string,
    file: Express.Multer.File,
  ): Promise<ComplexDetail> {
    await this.complexOwnedOrThrow(userId, complexId);

    const existing = await this.prisma.complexImage.findMany({
      where: { complexId },
      select: { position: true },
    });
    if (existing.length >= MAX_COMPLEX_IMAGES) {
      throw new ConflictException("Rasmlar chegarasi to'ldi");
    }

    const position = existing.reduce((max, img) => Math.max(max, img.position), -1) + 1;
    const result = await processImage({
      source: file.buffer,
      outputRoot: PUBLIC_DIR,
      // A path segment only: base becomes "/images/complex/<complexId>/<nn>".
      listingId: `complex/${complexId}`,
      position,
      makeOg: existing.length === 0, // first image is the cover
    });

    await this.prisma.complexImage.create({
      data: {
        complexId,
        base: result.base,
        ogUrl: result.ogUrl,
        width: result.width,
        height: result.height,
        position,
      },
    });

    return this.getComplex(userId, complexId);
  }

  /**
   * Delete one gallery image from an owned complex (foreign complex -> 404).
   *
   * The `:imageId` route param carries the image's `position`, not its cuid: the
   * shared `Image` DTO the CRM renders exposes no `id`, so the client sends
   * `String(position)`. Position is unique per complex (assigned max+1), so the
   * delete is scoped to `{ complexId, position }`. A non-numeric or unmatched
   * position -> 404. Returns the fresh `ComplexDetail`.
   */
  async removeComplexImage(
    userId: string,
    complexId: string,
    imageId: string,
  ): Promise<ComplexDetail> {
    await this.complexOwnedOrThrow(userId, complexId);

    const position = Number(imageId);
    if (!Number.isInteger(position)) throw new NotFoundException('Rasm topilmadi');

    const { count } = await this.prisma.complexImage.deleteMany({
      where: { complexId, position },
    });
    if (count === 0) throw new NotFoundException('Rasm topilmadi');

    return this.getComplex(userId, complexId);
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
      commissionBps: u.commissionBps,
      // The read include filters to ACTIVE fixations, so any row present means one exists.
      hasActiveFixation: (u.fixations?.length ?? 0) > 0,
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
        fixations: { where: { status: 'ACTIVE' }, select: { id: true } },
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
        ...(input.commissionBps !== undefined && { commissionBps: input.commissionBps }),
      },
      include: {
        bookings: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, clientName: true, clientPhone: true, holdUntil: true },
        },
        fixations: { where: { status: 'ACTIVE' }, select: { id: true } },
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
