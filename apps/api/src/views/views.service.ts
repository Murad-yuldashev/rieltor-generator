import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Bitta IP bitta obyektni shu oyna ichida faqat bir marta oshira oladi. */
const WINDOW_MS = 10 * 60 * 1000;
/** Xotira cheksiz o'smasligi uchun tozalash chegarasi. */
const MAX_KEYS = 10_000;

@Injectable()
export class ViewsService {
  private readonly lastSeen = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  async recordView(id: string, ip: string): Promise<number> {
    // JSON.stringify — oddiy ajratgich emas. `trust proxy` yoqilgani uchun `ip`
    // X-Forwarded-For dan keladi va Express uni IP shaklida ekanini tekshirmaydi,
    // ya'ni ichida ajratgich belgisi bo'lishi mumkin. `${ip}|${id}` da
    // ("A|B","C") va ("A","B|C") bir xil kalit berardi.
    const key = JSON.stringify([ip, id]);
    const now = Date.now();
    const last = this.lastSeen.get(key);

    if (last !== undefined && now - last < WINDOW_MS) {
      // Limitdan oshdi — lekin foydalanuvchiga xato emas, joriy son qaytariladi.
      return this.currentCount(id);
    }

    this.prune(now);
    this.lastSeen.set(key, now);

    try {
      // Atomik: UPDATE ... SET views = views + 1 RETURNING views
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
