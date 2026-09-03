import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Gate for developer-CRM routes: role DEVELOPER + an active org membership, read fresh from the DB. */
@Injectable()
export class DeveloperGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.id;
    if (!userId) throw new ForbiddenException();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, memberships: { select: { id: true }, take: 1 } },
    });
    if (user?.role !== 'DEVELOPER') throw new ForbiddenException('Quruvchi emassiz');
    if (user.memberships.length === 0) throw new ForbiddenException('Tashkilot topilmadi');
    return true;
  }
}
