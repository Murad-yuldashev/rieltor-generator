import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException();

    try {
      const { sub } = await this.jwt.verifyAsync(header.slice(7));
      const user = await this.prisma.user.findUnique({
        where: { id: sub },
        select: { id: true, role: true },
      });

      if (!user) throw new UnauthorizedException();

      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
