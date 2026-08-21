import { createHash, createHmac, randomInt } from 'node:crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';

const OTP_TTL_SEC = 120;
const MAX_ATTEMPTS = 5;

function hash(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, phone: true, name: true, photoUrl: true, role: true },
    });
    return user;
  }

  async requestOtp(phone: string) {
    // One live code per phone: issuing a new one invalidates the previous.
    await this.prisma.otpCode.deleteMany({ where: { phone } });

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');

    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash: hash(code),
        expiresAt: new Date(Date.now() + OTP_TTL_SEC * 1000),
      },
    });

    // The SMS provider arrives in Task 4. Until then the code goes to the log so
    // the flow is testable end to end in development.
    this.logger.log(`OTP for ${phone}: ${code}`);

    return { expiresInSec: OTP_TTL_SEC };
  }

  async verifyOtp(phone: string, code: string, userAgent?: string) {
    const record = await this.prisma.otpCode.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Kod muddati tugagan, qaytadan so‘rang');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Urinishlar tugadi, qaytadan so‘rang');
    }

    if (record.codeHash !== hash(code)) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Kod noto‘g‘ri');
    }

    await this.prisma.otpCode.delete({ where: { id: record.id } });

    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    const tokens = await this.tokens.issue(user.id, userAgent);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        photoUrl: user.photoUrl,
        role: user.role,
      },
    };
  }

  /**
   * Telegram signs the payload with HMAC-SHA256 where the key is SHA-256 of the
   * bot token. Without this check anyone could POST an arbitrary telegram id and
   * take over an account.
   */
  async loginWithTelegram(payload: Record<string, string | number>, userAgent?: string) {
    const { hash: providedHash, ...fields } = payload;

    const checkString = Object.keys(fields)
      .sort()
      .map((key) => `${key}=${fields[key]}`)
      .join('\n');

    const secret = createHash('sha256')
      .update(process.env.TELEGRAM_BOT_TOKEN ?? '')
      .digest();
    const expected = createHmac('sha256', secret).update(checkString).digest('hex');

    if (expected !== providedHash) {
      throw new BadRequestException('Telegram imzosi noto‘g‘ri');
    }

    // Telegram recommends rejecting payloads older than a day.
    const ageSec = Date.now() / 1000 - Number(fields.auth_date);
    if (ageSec > 86_400) {
      throw new BadRequestException('Telegram sessiyasi eskirgan');
    }

    const telegramId = String(fields.id);

    const user = await this.prisma.user.upsert({
      where: { telegramId },
      update: {
        name: String(fields.first_name),
        photoUrl: fields.photo_url ? String(fields.photo_url) : null,
      },
      create: {
        telegramId,
        // Telegram never gives us a phone through the login widget. The account
        // is usable immediately; the phone is collected when the user first
        // publishes a listing.
        phone: `tg:${telegramId}`,
        name: String(fields.first_name),
        photoUrl: fields.photo_url ? String(fields.photo_url) : null,
      },
    });

    const tokens = await this.tokens.issue(user.id, userAgent);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        photoUrl: user.photoUrl,
        role: user.role,
      },
    };
  }
}
