import { describe, expect, it, vi } from 'vitest';
import type { TelegramAuth } from '@rieltor/shared';
import type { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const payload: TelegramAuth = {
  id: 777000,
  first_name: 'Ali',
  username: 'Ali_Valiyev',
  photo_url: 'https://t.me/i/userpic/320/ali.jpg',
  auth_date: 1754700000,
  hash: 'b0ce1804dbb324c237f5127cd1a886cf1e8368bbd83b9e83d5369a10c9cd0a71',
};

/** Only the four calls AuthService makes — nothing else is stubbed. */
function fakePrisma(overrides: {
  findUnique?: ReturnType<typeof vi.fn>;
  findFirst?: ReturnType<typeof vi.fn>;
  create?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
}) {
  return {
    realtor: {
      findUnique: overrides.findUnique ?? vi.fn().mockResolvedValue(null),
      findFirst: overrides.findFirst ?? vi.fn().mockResolvedValue(null),
      create: overrides.create ?? vi.fn().mockResolvedValue({ id: 'rlt_new' }),
      update: overrides.update ?? vi.fn().mockResolvedValue({ id: 'rlt_old' }),
    },
  } as unknown as PrismaService;
}

describe('AuthService.pickUsername', () => {
  it('uses the slug when it is free', async () => {
    const service = new AuthService(fakePrisma({}));
    await expect(service.pickUsername('Ali_Valiyev')).resolves.toBe('ali-valiyev');
  });

  it('appends a counter until the slug is free', async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce({ id: 'a' })
      .mockResolvedValueOnce({ id: 'b' })
      .mockResolvedValueOnce(null);
    const service = new AuthService(fakePrisma({ findFirst }));

    await expect(service.pickUsername('ali')).resolves.toBe('ali-3');
    expect(findFirst).toHaveBeenCalledTimes(3);
  });
});

describe('AuthService.upsertFromTelegram', () => {
  it('creates a realtor on the first login', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'rlt_new' });
    const service = new AuthService(fakePrisma({ create }));

    await expect(service.upsertFromTelegram(payload)).resolves.toEqual({ id: 'rlt_new' });
    expect(create).toHaveBeenCalledWith({
      data: {
        tgId: BigInt(777000),
        tgUsername: 'Ali_Valiyev',
        name: 'Ali',
        photoUrl: 'https://t.me/i/userpic/320/ali.jpg',
        username: 'ali-valiyev',
      },
      select: { id: true },
    });
  });

  it('refreshes the Telegram-owned fields on a repeat login', async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: 'rlt_old' });
    const update = vi.fn().mockResolvedValue({ id: 'rlt_old' });
    const create = vi.fn();
    const service = new AuthService(fakePrisma({ findUnique, update, create }));

    await expect(service.upsertFromTelegram(payload)).resolves.toEqual({ id: 'rlt_old' });
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: 'rlt_old' },
      data: {
        tgUsername: 'Ali_Valiyev',
        name: 'Ali',
        photoUrl: 'https://t.me/i/userpic/320/ali.jpg',
      },
      select: { id: true },
    });
  });

  it('builds a name from first and last name together', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'rlt_new' });
    const service = new AuthService(fakePrisma({ create }));

    await service.upsertFromTelegram({ ...payload, last_name: 'Valiyev' });
    expect(create.mock.calls[0]![0]!.data.name).toBe('Ali Valiyev');
  });

  it('falls back to the display name when there is no Telegram username', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'rlt_new' });
    const service = new AuthService(fakePrisma({ create }));

    await service.upsertFromTelegram({ ...payload, username: undefined });
    expect(create.mock.calls[0]![0]!.data.username).toBe('ali');
  });

  it('falls back to the fixed stem when the display name has no usable characters', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'rlt_new' });
    const service = new AuthService(fakePrisma({ create }));

    await service.upsertFromTelegram({ ...payload, username: undefined, first_name: 'Али' });
    expect(create.mock.calls[0]![0]!.data.username).toBe('rieltor');
  });

  it('switches to an update when two concurrent first logins race on tgId', async () => {
    const create = vi.fn().mockRejectedValue(
      Object.assign(new Error('Unique constraint failed on the fields: (`tgId`)'), {
        code: 'P2002',
        meta: { target: ['tgId'] },
      }),
    );
    const update = vi.fn().mockResolvedValue({ id: 'rlt_won_race' });
    const service = new AuthService(fakePrisma({ create, update }));

    await expect(service.upsertFromTelegram(payload)).resolves.toEqual({ id: 'rlt_won_race' });
    expect(create).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      where: { tgId: BigInt(777000) },
      data: {
        tgUsername: 'Ali_Valiyev',
        name: 'Ali',
        photoUrl: 'https://t.me/i/userpic/320/ali.jpg',
      },
      select: { id: true },
    });
  });

  it('retries the create with a new slug when the picked username loses the race', async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce(null) // first pick: "ali-valiyev" looks free
      .mockResolvedValueOnce({ id: 'rlt_concurrent' }) // retry pick: it was just taken
      .mockResolvedValueOnce(null); // retry pick: "ali-valiyev-2" is free
    const create = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error('Unique constraint failed on the fields: (`username`)'), {
          code: 'P2002',
          meta: { target: ['username'] },
        }),
      )
      .mockResolvedValueOnce({ id: 'rlt_new' });
    const service = new AuthService(fakePrisma({ findFirst, create }));

    await expect(service.upsertFromTelegram(payload)).resolves.toEqual({ id: 'rlt_new' });
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0]![0]!.data.username).toBe('ali-valiyev');
    expect(create.mock.calls[1]![0]!.data.username).toBe('ali-valiyev-2');
  });
});
