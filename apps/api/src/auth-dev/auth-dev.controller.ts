import { Body, Controller, Post, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import type { Response } from 'express';
import type { RealtorProfile } from '@rieltor/shared';
import * as z from 'zod';
import { REALTOR_SELECT } from '../auth/realtor-select';
import { AuthService } from '../auth/auth.service';
import { serializeSessionCookie } from '../auth/cookie';
import { SESSION_TTL_SEC, signSession } from '../auth/session-token';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

const DevLoginSchema = z.object({
  secret: z.string(),
  tgId: z.coerce.number().int().positive(),
  name: z.string().min(2).default('Dev Rieltor'),
});

class DevLoginDto extends createZodDto(DevLoginSchema) {}

/**
 * Local development and Playwright only: the Telegram widget needs a domain
 * registered with BotFather, which localhost cannot have. AuthDevModule is only
 * registered outside production and only when DEV_LOGIN_SECRET is set (app.module.ts),
 * so this route does not exist in a production build.
 */
@ApiExcludeController()
@Controller('auth')
export class AuthDevController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('dev')
  async devLogin(
    @Body() body: DevLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RealtorProfile> {
    const expected = this.config.get('DEV_LOGIN_SECRET', { infer: true });
    const secret = this.config.get('JWT_SECRET', { infer: true });
    if (!expected || !secret || body.secret !== expected) {
      throw new UnauthorizedException('Dev login siri mos kelmadi');
    }

    const { id } = await this.auth.upsertFromTelegram({
      id: body.tgId,
      first_name: body.name,
      auth_date: Math.floor(Date.now() / 1000),
      hash: '0'.repeat(64),
    });

    const token = signSession(id, secret, Math.floor(Date.now() / 1000));
    res.setHeader('set-cookie', serializeSessionCookie(token, SESSION_TTL_SEC, false));

    return this.prisma.realtor.findUniqueOrThrow({ where: { id }, select: REALTOR_SELECT });
  }
}
