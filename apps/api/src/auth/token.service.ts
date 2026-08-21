import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

/** Refresh tokens live for 30 days; access tokens for 15 minutes. */
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async issue(userId: string, userAgent?: string) {
    const refreshToken = randomBytes(32).toString('hex');

    await this.prisma.session.create({
      data: {
        userId,
        refreshHash: hash(refreshToken),
        userAgent: userAgent ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });

    const accessToken = await this.jwt.signAsync({ sub: userId });
    return { accessToken, refreshToken };
  }

  /** One-time use: the old session row is deleted as the new one is written. */
  async rotate(refreshToken: string, userAgent?: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshHash: hash(refreshToken) },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Sessiya muddati tugagan');
    }

    await this.prisma.session.delete({ where: { id: session.id } });
    return this.issue(session.userId, userAgent);
  }

  async revoke(refreshToken: string) {
    await this.prisma.session
      .delete({ where: { refreshHash: hash(refreshToken) } })
      .catch(() => undefined);
  }
}
