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
import { SESSION_COOKIE, readCookie } from './cookie';
import { verifySession } from './session-token';

export interface RequestWithRealtor extends Request {
  realtorId?: string;
}

@Injectable()
export class RealtorGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get('JWT_SECRET', { infer: true });
    if (!secret) throw new ServiceUnavailableException('Kabinet hozircha sozlanmagan');

    const request = context.switchToHttp().getRequest<RequestWithRealtor>();
    const token = readCookie(request.headers.cookie, SESSION_COOKIE);
    const realtorId = token ? verifySession(token, secret, Math.floor(Date.now() / 1000)) : null;
    if (!realtorId) throw new UnauthorizedException('Sessiya topilmadi');

    request.realtorId = realtorId;
    return true;
  }
}
