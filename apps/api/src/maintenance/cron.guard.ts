import { timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Env } from '../config/env';

/**
 * Guards POST /api/internal/cron/daily (design spec §7.5) — mirrors AdminGuard's
 * timing-safe header comparison exactly, with its own env var and header name.
 */
@Injectable()
export class CronGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get('CRON_SECRET', { infer: true });
    if (!expected) throw new ServiceUnavailableException('Cron siri sozlanmagan');

    const header = context.switchToHttp().getRequest<Request>().headers['x-cron-secret'];
    const received = typeof header === 'string' ? header : '';

    const a = Buffer.from(received);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new ForbiddenException('Cron siri noto‘g‘ri');
    }

    return true;
  }
}
