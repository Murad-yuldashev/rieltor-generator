import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { SESSION_COOKIE, readCookie } from './cookie';
import { ensureDemoRealtor } from './demo-realtor';
import { verifySession } from './session-token';

export interface RequestWithRealtor extends Request {
  realtorId?: string;
}

@Injectable()
export class RealtorGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithRealtor>();

    // DEMO_MODE removes the login wall: no session is checked and every request is the
    // one shared demo realtor. Gated by an opt-in env, so a normal deploy is unaffected.
    if (this.config.get('DEMO_MODE', { infer: true })) {
      request.realtorId = await ensureDemoRealtor(this.prisma);
      return true;
    }

    const secret = this.config.get('JWT_SECRET', { infer: true });
    if (!secret) throw new ServiceUnavailableException('Kabinet hozircha sozlanmagan');

    const token = readCookie(request.headers.cookie, SESSION_COOKIE);
    const realtorId = token ? verifySession(token, secret, Math.floor(Date.now() / 1000)) : null;
    if (!realtorId) throw new UnauthorizedException('Sessiya topilmadi');

    request.realtorId = realtorId;
    return true;
  }
}
