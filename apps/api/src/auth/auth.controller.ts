import {
  Body,
  Controller,
  Post,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { RealtorProfile } from '@rieltor/shared';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { TelegramAuthDto, RealtorProfileDto } from './auth.dto';
import { REALTOR_SELECT } from './realtor-select';
import { SESSION_TTL_SEC, signSession } from './session-token';
import { clearedSessionCookie, serializeSessionCookie } from './cookie';
import { verifyTelegramAuth } from './telegram';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('telegram')
  @ApiOkResponse({ type: RealtorProfileDto })
  async telegram(
    @Body() body: TelegramAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RealtorProfile> {
    const botToken = this.config.get('TELEGRAM_BOT_TOKEN', { infer: true });
    const secret = this.config.get('JWT_SECRET', { infer: true });
    if (!botToken || !secret) {
      // The cabinet is simply not configured on this deployment (spec §7.3).
      throw new ServiceUnavailableException('Kabinet hozircha sozlanmagan');
    }

    if (!verifyTelegramAuth(body, botToken, Math.floor(Date.now() / 1000))) {
      throw new UnauthorizedException('Telegram imzosi tasdiqlanmadi');
    }

    const { id } = await this.auth.upsertFromTelegram(body);
    const token = signSession(id, secret, Math.floor(Date.now() / 1000));
    res.setHeader(
      'set-cookie',
      serializeSessionCookie(token, SESSION_TTL_SEC, this.useSecureCookie()),
    );

    return this.prisma.realtor.findUniqueOrThrow({ where: { id }, select: REALTOR_SELECT });
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    res.setHeader('set-cookie', clearedSessionCookie(this.useSecureCookie()));
    return { ok: true };
  }

  /**
   * A Secure cookie is dropped over plain http, which is what e2e runs on. NODE_ENV
   * is not a reliable production signal here — the Netlify build never sets it — so
   * this derives from PUBLIC_BASE_URL instead, which is required and Netlify fills
   * in from its own deploy URL.
   */
  private useSecureCookie(): boolean {
    return this.config.get('PUBLIC_BASE_URL', { infer: true }).startsWith('https://');
  }
}
