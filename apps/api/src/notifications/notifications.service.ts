import { Injectable } from '@nestjs/common';
import type { NotificationList } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramNotifier } from './telegram-notifier';

const PUBLIC_SELECT = {
  id: true,
  type: true,
  title: true,
  body: true,
  targetId: true,
  readAt: true,
  createdAt: true,
} as const;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: TelegramNotifier,
  ) {}

  async notify(
    userId: string,
    input: { type: 'PRICE_UPDATE'; title: string; body: string; targetId?: string | null },
  ) {
    await this.prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        targetId: input.targetId ?? null,
      },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true },
    });
    if (user?.telegramId) {
      await this.notifier.send(user.telegramId, `${input.title}\n\n${input.body}`);
    }
  }

  async listMine(userId: string): Promise<NotificationList> {
    const [rows, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: PUBLIC_SELECT,
        take: 50,
      }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return {
      items: rows.map((n) => ({
        ...n,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    };
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
