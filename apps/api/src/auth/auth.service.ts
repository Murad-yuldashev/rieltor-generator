import { createHash, randomInt } from 'node:crypto';
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
}
