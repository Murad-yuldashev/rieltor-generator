import { Injectable, NotFoundException } from '@nestjs/common';
import type { SavedSearchCreate } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

// Public shape mirrors SavedSearchSchema (@rieltor/shared) — userId is the
// caller's own, so it's not sensitive, but there is no reason to send it back.
const PUBLIC_SELECT = { id: true, name: true, query: true, createdAt: true } as const;

@Injectable()
export class SavedSearchService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: PUBLIC_SELECT,
    });
  }

  create(userId: string, body: SavedSearchCreate) {
    return this.prisma.savedSearch.create({
      data: { userId, name: body.name, query: body.query },
      select: PUBLIC_SELECT,
    });
  }

  async remove(id: string, userId: string) {
    // Scope the delete to the caller so an id from another user's saved search
    // can't be used to delete it — same owner-check shape as ListingsService.
    const { count } = await this.prisma.savedSearch.deleteMany({ where: { id, userId } });
    if (count === 0) throw new NotFoundException();
  }
}
