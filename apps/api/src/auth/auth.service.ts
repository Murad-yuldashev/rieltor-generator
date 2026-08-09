import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { type TelegramAuth, slugifyUsername } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

/** Enough suffixes for any realistic collision; a runaway loop is a bug, not a case. */
const MAX_USERNAME_ATTEMPTS = 50;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns a free slug: "ali", then "ali-2", "ali-3", ... */
  async pickUsername(preferred: string): Promise<string> {
    const base = slugifyUsername(preferred);

    for (let attempt = 1; attempt <= MAX_USERNAME_ATTEMPTS; attempt += 1) {
      const candidate = attempt === 1 ? base : `${base}-${attempt}`;
      const taken = await this.prisma.realtor.findFirst({
        where: { username: candidate },
        select: { id: true },
      });
      if (!taken) return candidate;
    }

    throw new InternalServerErrorException("Bo'sh username topilmadi");
  }

  /**
   * First login creates the realtor; later logins only refresh what Telegram owns.
   * The profile fields the realtor edits themselves (phone, agency, registryNo) are
   * never overwritten here.
   */
  async upsertFromTelegram(payload: TelegramAuth): Promise<{ id: string }> {
    const name = [payload.first_name, payload.last_name].filter(Boolean).join(' ');
    const photoUrl = payload.photo_url ?? null;

    const existing = await this.prisma.realtor.findUnique({
      where: { tgId: BigInt(payload.id) },
      select: { id: true },
    });

    if (existing) {
      return this.prisma.realtor.update({
        where: { id: existing.id },
        data: { tgUsername: payload.username ?? null, name, photoUrl },
        select: { id: true },
      });
    }

    return this.prisma.realtor.create({
      data: {
        tgId: BigInt(payload.id),
        tgUsername: payload.username ?? null,
        name,
        photoUrl,
        username: await this.pickUsername(payload.username ?? ''),
      },
      select: { id: true },
    });
  }
}
