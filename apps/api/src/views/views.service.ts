import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** One IP can increment a given listing only once within this window. */
const WINDOW_MS = 10 * 60 * 1000;
/** Cleanup threshold that keeps memory from growing without bound. */
const MAX_KEYS = 10_000;

@Injectable()
export class ViewsService {
  private readonly lastSeen = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  async recordView(id: string, ip: string): Promise<number> {
    // JSON.stringify rather than a plain separator. With `trust proxy` enabled `ip`
    // comes from X-Forwarded-For and Express does not verify it looks like an IP, so
    // it may contain the separator character. With `${ip}|${id}` the pairs
    // ("A|B","C") and ("A","B|C") would collide on the same key.
    const key = JSON.stringify([ip, id]);
    const now = Date.now();
    const last = this.lastSeen.get(key);

    if (last !== undefined && now - last < WINDOW_MS) {
      // Over the limit — not an error for the user, just return the current count.
      return this.currentCount(id);
    }

    this.prune(now);
    this.lastSeen.set(key, now);

    try {
      // Atomic: UPDATE ... SET views = views + 1 RETURNING views
      const row = await this.prisma.listing.update({
        where: { id },
        data: { views: { increment: 1 } },
        select: { views: true },
      });
      return row.views;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        this.lastSeen.delete(key);
        throw new NotFoundException(`Obyekt topilmadi: ${id}`);
      }
      throw error;
    }
  }

  async currentCount(id: string): Promise<number> {
    const row = await this.prisma.listing.findUnique({ where: { id }, select: { views: true } });
    if (!row) {
      throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    }
    return row.views;
  }

  private prune(now: number): void {
    if (this.lastSeen.size < MAX_KEYS) return;
    for (const [key, time] of this.lastSeen) {
      if (now - time >= WINDOW_MS) this.lastSeen.delete(key);
    }
  }
}
