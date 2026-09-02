import { Injectable, NotFoundException } from '@nestjs/common';
import type { SubscriptionView } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

const TRIAL_DAYS = 14;
const PAID_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  /** True when the subscription still grants cabinet access. */
  isActive(
    sub: { status: 'TRIAL' | 'ACTIVE' | 'EXPIRED'; currentPeriodEnd: Date } | null,
  ): boolean {
    return !!sub && sub.status !== 'EXPIRED' && sub.currentPeriodEnd.getTime() > Date.now();
  }

  /** USER -> REALTOR + a 14-day trial. Idempotent: an existing realtor keeps their subscription. */
  async becomeRealtor(userId: string): Promise<SubscriptionView | null> {
    const existing = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!existing) {
      // Both writes commit together: a crash between them would otherwise strand a
      // REALTOR with no subscription — unrecoverable, since the become-realtor page
      // is gone once role=REALTOR and activate() 404s with no row to update.
      await this.prisma.$transaction([
        this.prisma.user.update({ where: { id: userId }, data: { role: 'REALTOR' } }),
        this.prisma.subscription.create({
          data: {
            userId,
            status: 'TRIAL',
            currentPeriodEnd: new Date(Date.now() + TRIAL_DAYS * DAY_MS),
          },
        }),
      ]);
    } else {
      // Symmetric to becomeDeveloper: re-assert REALTOR on the idempotent branch so a user
      // flipped to DEVELOPER can recover /agent access by re-submitting. (An expired
      // subscription still routes to the paywall — that is recoverable, not a lockout.)
      await this.prisma.user.update({ where: { id: userId }, data: { role: 'REALTOR' } });
    }
    return this.view(userId);
  }

  /** STUB PAYMENT — no real charge. Extends the paid period by 30 days. */
  async activate(userId: string): Promise<SubscriptionView | null> {
    const existing = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!existing) throw new NotFoundException('Obuna topilmadi');
    await this.prisma.subscription.update({
      where: { userId },
      data: { status: 'ACTIVE', currentPeriodEnd: new Date(Date.now() + PAID_DAYS * DAY_MS) },
    });
    return this.view(userId);
  }

  async view(userId: string): Promise<SubscriptionView | null> {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return null;
    const active = this.isActive(sub);
    const daysLeft = Math.max(0, Math.ceil((sub.currentPeriodEnd.getTime() - Date.now()) / DAY_MS));
    return {
      status: sub.status,
      tier: sub.tier,
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      isActive: active,
      daysLeft,
    };
  }
}
