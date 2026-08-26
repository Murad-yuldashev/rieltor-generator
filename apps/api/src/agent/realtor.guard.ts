import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from './subscription.service';

/**
 * Gate for realtor-only routes. Loads role + subscription from the DB (fresh),
 * NOT from req.user.role — the caller's JWT still says USER right after
 * become-realtor upgrades the DB, so a JWT-role check would be stale.
 */
@Injectable()
export class RealtorGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.id;
    if (!userId) throw new ForbiddenException();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, subscription: { select: { status: true, currentPeriodEnd: true } } },
    });
    if (user?.role !== 'REALTOR') throw new ForbiddenException('Rieltor emassiz');
    if (!this.subscriptions.isActive(user.subscription ?? null)) {
      throw new ForbiddenException('Obuna faol emas');
    }
    return true;
  }
}
