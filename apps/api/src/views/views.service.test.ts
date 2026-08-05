import { NotFoundException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewsService } from './views.service';

function fakePrisma(initial = 5) {
  const state = { views: initial, exists: true };
  return {
    state,
    listing: {
      update: vi.fn(async () => {
        if (!state.exists) {
          const error = new Error('Record to update not found.') as Error & { code: string };
          error.code = 'P2025';
          throw error;
        }
        state.views += 1;
        return { views: state.views };
      }),
      findUnique: vi.fn(async () => (state.exists ? { views: state.views } : null)),
    },
  };
}

describe('ViewsService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('increments the count on the first visit', async () => {
    const prisma = fakePrisma(5);
    const service = new ViewsService(prisma as never);
    expect(await service.recordView('bx-001', '1.1.1.1')).toBe(6);
  });

  it('does not increment on a repeat visit inside the window', async () => {
    const prisma = fakePrisma(5);
    const service = new ViewsService(prisma as never);

    await service.recordView('bx-001', '1.1.1.1');
    const second = await service.recordView('bx-001', '1.1.1.1');

    expect(second).toBe(6);
    expect(prisma.listing.update).toHaveBeenCalledTimes(1);
  });

  it('a different IP is counted separately', async () => {
    const prisma = fakePrisma(5);
    const service = new ViewsService(prisma as never);

    await service.recordView('bx-001', '1.1.1.1');
    expect(await service.recordView('bx-001', '2.2.2.2')).toBe(7);
  });

  it('a different listing is counted separately', async () => {
    const prisma = fakePrisma(5);
    const service = new ViewsService(prisma as never);

    await service.recordView('bx-001', '1.1.1.1');
    await service.recordView('bx-002', '1.1.1.1');

    expect(prisma.listing.update).toHaveBeenCalledTimes(2);
  });

  it('increments again once the window has passed', async () => {
    const prisma = fakePrisma(5);
    const service = new ViewsService(prisma as never);

    await service.recordView('bx-001', '1.1.1.1');
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    await service.recordView('bx-001', '1.1.1.1');

    expect(prisma.listing.update).toHaveBeenCalledTimes(2);
  });

  it('throws NotFoundException for a missing listing', async () => {
    const prisma = fakePrisma(5);
    prisma.state.exists = false;
    const service = new ViewsService(prisma as never);

    await expect(service.recordView('yoq-000', '1.1.1.1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('current() returns the count without incrementing', async () => {
    const prisma = fakePrisma(5);
    const service = new ViewsService(prisma as never);

    expect(await service.currentCount('bx-001')).toBe(5);
    expect(prisma.listing.update).not.toHaveBeenCalled();
  });

  it('an IP containing the separator does not collide with another listing', async () => {
    const prisma = fakePrisma(5);
    const service = new ViewsService(prisma as never);

    await service.recordView('bx-001', 'A|B');
    await service.recordView('B|bx-001', 'A');

    expect(prisma.listing.update).toHaveBeenCalledTimes(2);
  });
});
