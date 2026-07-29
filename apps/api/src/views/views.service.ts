import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Bitta IP bitta obyektni shu oyna ichida faqat bir marta oshira oladi. */
const OYNA_MS = 10 * 60 * 1000;
/** Xotira cheksiz o'smasligi uchun tozalash chegarasi. */
const MAKS_KALIT = 10_000;

@Injectable()
export class ViewsService {
  private readonly songgiKirish = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  async korish(id: string, ip: string): Promise<number> {
    // JSON.stringify — oddiy ajratgich emas. `trust proxy` yoqilgani uchun `ip`
    // X-Forwarded-For dan keladi va Express uni IP shaklida ekanini tekshirmaydi,
    // ya'ni ichida ajratgich belgisi bo'lishi mumkin. `${ip}|${id}` da
    // ("A|B","C") va ("A","B|C") bir xil kalit berardi.
    const kalit = JSON.stringify([ip, id]);
    const hozir = Date.now();
    const songgi = this.songgiKirish.get(kalit);

    if (songgi !== undefined && hozir - songgi < OYNA_MS) {
      // Limitdan oshdi — lekin foydalanuvchiga xato emas, joriy son qaytariladi.
      return this.joriy(id);
    }

    this.tozala(hozir);
    this.songgiKirish.set(kalit, hozir);

    try {
      // Atomik: UPDATE ... SET views = views + 1 RETURNING views
      const qator = await this.prisma.object.update({
        where: { id },
        data: { views: { increment: 1 } },
        select: { views: true },
      });
      return qator.views;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        this.songgiKirish.delete(kalit);
        throw new NotFoundException(`Obyekt topilmadi: ${id}`);
      }
      throw error;
    }
  }

  async joriy(id: string): Promise<number> {
    const qator = await this.prisma.object.findUnique({ where: { id }, select: { views: true } });
    if (!qator) {
      throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    }
    return qator.views;
  }

  private tozala(hozir: number): void {
    if (this.songgiKirish.size < MAKS_KALIT) return;
    for (const [kalit, vaqt] of this.songgiKirish) {
      if (hozir - vaqt >= OYNA_MS) this.songgiKirish.delete(kalit);
    }
  }
}
