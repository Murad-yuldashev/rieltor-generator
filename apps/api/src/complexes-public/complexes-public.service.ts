import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  ComplexInquiry,
  Image,
  PublicBuilding,
  PublicComplexDetail,
  PublicComplexSummary,
  PublicUnit,
} from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RequestsService } from '../requests/requests.service';

// The include shared by both public reads: developer org (name/verified), the
// ordered gallery, and the full building -> unit inventory. Bookings and every
// client-bearing field are deliberately NOT selected — the public surface must
// leak no PII (client name/phone) and no internal ids (orgId, buildingId, …).
const PUBLIC_COMPLEX_INCLUDE = {
  org: true,
  images: { orderBy: { position: 'asc' } },
  buildings: { include: { units: true } },
} satisfies Prisma.ComplexInclude;

type ComplexWithRelations = Prisma.ComplexGetPayload<{ include: typeof PUBLIC_COMPLEX_INCLUDE }>;
type UnitRow = ComplexWithRelations['buildings'][number]['units'][number];
type ImageRow = ComplexWithRelations['images'][number];

@Injectable()
export class ComplexesPublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requests: RequestsService,
  ) {}

  /** The marketplace list — every PUBLISHED complex as a summary card. */
  async listPublished(): Promise<PublicComplexSummary[]> {
    const rows = await this.prisma.complex.findMany({
      where: { publishStatus: 'PUBLISHED' },
      include: PUBLIC_COMPLEX_INCLUDE,
      orderBy: { publishedAt: 'desc' },
    });
    return rows.map((c) => this.toSummary(c));
  }

  /** The full public complex page, by slug. Unknown/unpublished slug -> 404. */
  async getBySlug(slug: string): Promise<PublicComplexDetail> {
    const complex = await this.prisma.complex.findFirst({
      where: { slug, publishStatus: 'PUBLISHED' },
      include: PUBLIC_COMPLEX_INCLUDE,
    });
    if (!complex) throw new NotFoundException();

    return {
      ...this.toSummary(complex),
      description: complex.description,
      address: complex.address,
      latitude: complex.latitude,
      longitude: complex.longitude,
      gallery: complex.images.map((img) => this.toImage(img)),
      buildings: complex.buildings.map((b) => this.toBuilding(b)),
      unitsTotal: complex.buildings.reduce((n, b) => n + b.units.length, 0),
    };
  }

  /**
   * A buyer's interest in a published complex -> a NEW_BUILD SALE lead, scored and
   * priced by RequestsService. Loads the complex by slug (404 if none/unpublished)
   * to stamp the district and provenance ids onto the lead.
   */
  async inquiry(userId: string, slug: string, input: ComplexInquiry) {
    const complex = await this.prisma.complex.findFirst({
      where: { slug, publishStatus: 'PUBLISHED' },
      select: { id: true, district: true },
    });
    if (!complex) throw new NotFoundException();

    return this.requests.create(userId, {
      deal: 'SALE',
      type: 'NEW_BUILD',
      district: complex.district,
      note: input.note,
      complexId: complex.id,
      unitId: input.unitId,
    });
  }

  // ---- Mappers -------------------------------------------------------------

  /** Complex row (+ relations) -> summary card with the price/availability aggregates. */
  private toSummary(c: ComplexWithRelations): PublicComplexSummary {
    const units = c.buildings.flatMap((b) => b.units);
    const availablePrices = units
      .filter((u) => u.status === 'AVAILABLE' && u.priceSom != null)
      .map((u) => u.priceSom as bigint);
    const priceFrom =
      availablePrices.length > 0 ? availablePrices.reduce((a, b) => (b < a ? b : a)) : null;
    return {
      slug: c.slug ?? '',
      name: c.name,
      district: c.district,
      coverImage: c.images[0] ? this.toImage(c.images[0]) : null,
      buildStatus: c.status,
      priceFromSom: priceFrom != null ? String(priceFrom) : null,
      unitsAvailable: units.filter((u) => u.status === 'AVAILABLE').length,
      developerName: c.org.name,
      developerVerified: c.org.verified,
    };
  }

  /** ComplexImage row -> shared Image DTO. */
  private toImage(img: ImageRow): Image {
    return {
      base: img.base,
      ogUrl: img.ogUrl,
      width: img.width,
      height: img.height,
      position: img.position,
    };
  }

  /** Building row (+ its units) -> public building; units carry NO booking/client data. */
  private toBuilding(b: ComplexWithRelations['buildings'][number]): PublicBuilding {
    return {
      id: b.id,
      name: b.name,
      floors: b.floors,
      units: b.units.map((u) => this.toUnit(u)),
    };
  }

  /** Unit row -> public unit: inventory fields + status only. Never bookings/orgId/etc. */
  private toUnit(u: UnitRow): PublicUnit {
    return {
      id: u.id,
      number: u.number,
      floor: u.floor,
      rooms: u.rooms,
      areaM2: u.areaM2,
      priceSom: u.priceSom != null ? String(u.priceSom) : null,
      status: u.status,
    };
  }
}
