import { NotFoundException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewsService } from './views.service';

function prismaSoxta(boshlangich = 5) {
  const holat = { views: boshlangich, mavjud: true };
  return {
    holat,
    object: {
      update: vi.fn(async () => {
        if (!holat.mavjud) {
          const xato = new Error('Record to update not found.') as Error & { code: string };
          xato.code = 'P2025';
          throw xato;
        }
        holat.views += 1;
        return { views: holat.views };
      }),
      findUnique: vi.fn(async () => (holat.mavjud ? { views: holat.views } : null)),
    },
  };
}

describe('ViewsService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('birinchi kirishda sonni oshiradi', async () => {
    const prisma = prismaSoxta(5);
    const service = new ViewsService(prisma as never);
    expect(await service.korish('bx-001', '1.1.1.1')).toBe(6);
  });

  it('oyna ichida takror kirishda oshirmaydi', async () => {
    const prisma = prismaSoxta(5);
    const service = new ViewsService(prisma as never);

    await service.korish('bx-001', '1.1.1.1');
    const ikkinchi = await service.korish('bx-001', '1.1.1.1');

    expect(ikkinchi).toBe(6);
    expect(prisma.object.update).toHaveBeenCalledTimes(1);
  });

  it('boshqa IP alohida hisoblanadi', async () => {
    const prisma = prismaSoxta(5);
    const service = new ViewsService(prisma as never);

    await service.korish('bx-001', '1.1.1.1');
    expect(await service.korish('bx-001', '2.2.2.2')).toBe(7);
  });

  it('boshqa obyekt alohida hisoblanadi', async () => {
    const prisma = prismaSoxta(5);
    const service = new ViewsService(prisma as never);

    await service.korish('bx-001', '1.1.1.1');
    await service.korish('bx-002', '1.1.1.1');

    expect(prisma.object.update).toHaveBeenCalledTimes(2);
  });

  it('oyna tugagach yana oshiradi', async () => {
    const prisma = prismaSoxta(5);
    const service = new ViewsService(prisma as never);

    await service.korish('bx-001', '1.1.1.1');
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    await service.korish('bx-001', '1.1.1.1');

    expect(prisma.object.update).toHaveBeenCalledTimes(2);
  });

  it("mavjud bo'lmagan obyektda NotFoundException", async () => {
    const prisma = prismaSoxta(5);
    prisma.holat.mavjud = false;
    const service = new ViewsService(prisma as never);

    await expect(service.korish('yoq-000', '1.1.1.1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('joriy() sonni oshirmasdan qaytaradi', async () => {
    const prisma = prismaSoxta(5);
    const service = new ViewsService(prisma as never);

    expect(await service.joriy('bx-001')).toBe(5);
    expect(prisma.object.update).not.toHaveBeenCalled();
  });
});
