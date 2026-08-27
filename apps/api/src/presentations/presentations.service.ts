import { randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  PresentationCreateResult,
  PresentationDetail,
  PresentationSummary,
  PresentationViewEvent,
  PublicPresentation,
} from '@rieltor/shared';
import type { Env } from '../config/env';
import { toListingSummary } from '../listings/mapper';
import { PrismaService } from '../prisma/prisma.service';

// Mirrors the listings service's FULL_INCLUDE (and the agent services' local
// copies) — toListingSummary needs the listing's agent plus its ordered images
// to build a ListingSummary. A later fast-follow dedupes these against an
// exported listings FULL_INCLUDE.
const LISTING_SUMMARY_INCLUDE = {
  agent: true,
  images: { orderBy: { position: 'asc' } },
} as const;

@Injectable()
export class PresentationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** The public share URL for a presentation token. */
  private url(token: string): string {
    const base = this.config.get('PUBLIC_BASE_URL', { infer: true });
    return `${base}/p/${token}`;
  }

  /**
   * Snapshot an owned collection into an immutable presentation: its items are
   * copied (listing, position, note) in one atomic create, so later edits to the
   * collection never mutate a presentation already shared with a client. 404 if
   * the collection is not owned; 400 if it is empty.
   */
  async present(realtorId: string, collectionId: string): Promise<PresentationCreateResult> {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      include: { items: { orderBy: { position: 'asc' } } },
    });
    if (!collection || collection.realtorId !== realtorId) throw new NotFoundException();
    if (collection.items.length === 0) throw new BadRequestException("Kolleksiya bo'sh");

    const presentation = await this.prisma.presentation.create({
      data: {
        realtorId,
        // id is @default(cuid()); token is a distinct @unique value we generate.
        // randomBytes(16) → 32 unguessable hex chars, matching the codebase's
        // token style (see auth/token.service.ts, listings.service.ts).
        token: randomBytes(16).toString('hex'),
        title: collection.name,
        sourceCollectionId: collectionId,
        items: {
          create: collection.items.map((it) => ({
            listingId: it.listingId,
            position: it.position,
            note: it.note,
          })),
        },
      },
      select: { id: true, token: true },
    });
    return {
      id: presentation.id,
      token: presentation.token,
      url: this.url(presentation.token),
    };
  }

  /**
   * All of this realtor's presentations, newest first. `opensCount` counts the
   * presentation-open events (PresentationView rows with a null listingId) — the
   * per-listing dwell events are excluded — aggregated in one groupBy to avoid an
   * N+1.
   */
  async list(realtorId: string): Promise<PresentationSummary[]> {
    const presentations = await this.prisma.presentation.findMany({
      where: { realtorId },
      orderBy: { createdAt: 'desc' },
    });
    const opens = await this.prisma.presentationView.groupBy({
      by: ['presentationId'],
      where: { presentationId: { in: presentations.map((p) => p.id) }, listingId: null },
      _count: { _all: true },
    });
    const opensByPresentation = new Map(opens.map((g) => [g.presentationId, g._count._all]));
    return presentations.map((p) => ({
      id: p.id,
      token: p.token,
      title: p.title,
      clientLabel: p.clientLabel,
      createdAt: p.createdAt.toISOString(),
      opensCount: opensByPresentation.get(p.id) ?? 0,
      url: this.url(p.token),
    }));
  }

  /**
   * Owned-or-404 presentation with per-item analytics. A single groupBy over the
   * view events keys by listingId: the null-listing group is the total opens; each
   * listing's group gives that item's opens and average dwell (rounded, 0 when no
   * dwell was recorded).
   */
  async detail(realtorId: string, id: string): Promise<PresentationDetail> {
    const presentation = await this.prisma.presentation.findUnique({ where: { id } });
    if (!presentation || presentation.realtorId !== realtorId) throw new NotFoundException();

    const items = await this.prisma.presentationItem.findMany({
      where: { presentationId: id },
      orderBy: { position: 'asc' },
      include: { listing: { include: LISTING_SUMMARY_INCLUDE } },
    });

    const groups = await this.prisma.presentationView.groupBy({
      by: ['listingId'],
      where: { presentationId: id },
      _count: { _all: true },
      _avg: { durationMs: true },
    });
    const totalOpens = groups.find((g) => g.listingId === null)?._count._all ?? 0;
    const byListing = new Map(
      groups.filter((g) => g.listingId !== null).map((g) => [g.listingId as string, g]),
    );

    return {
      id: presentation.id,
      token: presentation.token,
      title: presentation.title,
      clientLabel: presentation.clientLabel,
      createdAt: presentation.createdAt.toISOString(),
      url: this.url(presentation.token),
      totalOpens,
      items: items.map((it) => {
        const group = byListing.get(it.listingId);
        return {
          listingId: it.listingId,
          position: it.position,
          note: it.note,
          listing: toListingSummary(it.listing),
          opens: group?._count._all ?? 0,
          avgDurationMs: Math.round(group?._avg.durationMs ?? 0),
        };
      }),
    };
  }

  /** Owned-or-404, then delete — items and views cascade via the schema. */
  async remove(realtorId: string, id: string): Promise<void> {
    const presentation = await this.prisma.presentation.findUnique({ where: { id } });
    if (!presentation || presentation.realtorId !== realtorId) throw new NotFoundException();
    await this.prisma.presentation.delete({ where: { id } });
  }

  /**
   * The client-facing view of a presentation, resolved by its unguessable token —
   * unauthenticated and NOT subscription-gated: a client (not a platform user)
   * with the link must be able to open it even if the realtor's subscription has
   * lapsed. Only client-facing fields are returned (title, realtor display, ordered
   * items); realtorId, analytics, and token internals are never exposed. 404 on an
   * unknown token.
   */
  async publicGet(token: string): Promise<PublicPresentation> {
    const presentation = await this.prisma.presentation.findUnique({
      where: { token },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: { listing: { include: LISTING_SUMMARY_INCLUDE } },
        },
        realtor: { select: { name: true, realtorProfile: { select: { agency: true } } } },
      },
    });
    if (!presentation) throw new NotFoundException();

    return {
      title: presentation.title,
      realtorName: presentation.realtor.name ?? 'Rieltor',
      agency: presentation.realtor.realtorProfile?.agency ?? null,
      items: presentation.items.map((it) => ({
        listingId: it.listingId,
        position: it.position,
        note: it.note,
        listing: toListingSummary(it.listing),
      })),
    };
  }

  /**
   * Ingest one analytics beacon for a presentation, resolved by token. An unknown
   * token returns silently (no throw) — this avoids leaking token validity and
   * silences stray beacons (e.g. after a presentation is deleted). Public and NOT
   * subscription-gated. A single lightweight insert; the open event carries a null
   * listingId, a per-listing dwell event carries the listingId.
   */
  async recordView(token: string, event: PresentationViewEvent): Promise<void> {
    const presentation = await this.prisma.presentation.findUnique({
      where: { token },
      select: { id: true },
    });
    if (!presentation) return;
    await this.prisma.presentationView.create({
      data: {
        presentationId: presentation.id,
        listingId: event.listingId ?? null,
        durationMs: event.durationMs ?? null,
      },
    });
  }
}
