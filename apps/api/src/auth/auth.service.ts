import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { type TelegramAuth, slugifyUsername } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

/** Enough suffixes for any realistic collision; a runaway loop is a bug, not a case. */
const MAX_USERNAME_ATTEMPTS = 50;

/**
 * Prisma's P2002 target names the column(s) the unique index collided on. Anything
 * else (not a P2002, or a driver that reports the target differently) is not a race
 * this function knows how to recover from.
 */
function uniqueConstraintTarget(error: unknown): string[] | null {
  const { code, meta } = error as { code?: string; meta?: { target?: unknown } };
  if (code !== 'P2002') return null;

  return Array.isArray(meta?.target) ? (meta.target as string[]) : null;
}

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
    const tgUsername = payload.username ?? null;

    const existing = await this.prisma.realtor.findUnique({
      where: { tgId: BigInt(payload.id) },
      select: { id: true },
    });

    if (existing) {
      return this.updateTelegramFields({ id: existing.id }, tgUsername, name, photoUrl);
    }

    return this.createRealtor(payload, tgUsername, name, photoUrl);
  }

  /** Applies the fields Telegram owns to an already-existing row. */
  private updateTelegramFields(
    where: { id: string } | { tgId: bigint },
    tgUsername: string | null,
    name: string,
    photoUrl: string | null,
  ): Promise<{ id: string }> {
    return this.prisma.realtor.update({
      where,
      data: { tgUsername, name, photoUrl },
      select: { id: true },
    });
  }

  /**
   * Creates the realtor, retrying once on a unique-index collision from a concurrent
   * first login (a double-tap on the widget is the realistic trigger — this guards
   * a race, it is not a general retry loop):
   *  - a collision on tgId means another request already created the row first, so
   *    this switches to updating it;
   *  - a collision on username means the slug picked below was taken between the
   *    check and the insert, so this picks again and retries the create once.
   */
  private async createRealtor(
    payload: TelegramAuth,
    tgUsername: string | null,
    name: string,
    photoUrl: string | null,
  ): Promise<{ id: string }> {
    const username = await this.pickUsername(payload.username ?? payload.first_name);

    try {
      return await this.prisma.realtor.create({
        data: { tgId: BigInt(payload.id), tgUsername, name, photoUrl, username },
        select: { id: true },
      });
    } catch (error) {
      const target = uniqueConstraintTarget(error);
      if (target === null) throw error;

      if (target.includes('tgId')) {
        return this.updateTelegramFields({ tgId: BigInt(payload.id) }, tgUsername, name, photoUrl);
      }

      if (target.includes('username')) {
        const retryUsername = await this.pickUsername(payload.username ?? payload.first_name);
        return this.prisma.realtor.create({
          data: { tgId: BigInt(payload.id), tgUsername, name, photoUrl, username: retryUsername },
          select: { id: true },
        });
      }

      throw error;
    }
  }
}
