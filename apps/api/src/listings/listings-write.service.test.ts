import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import type { RealtorsService } from '../realtors/realtors.service';
import { ListingsWriteService } from './listings-write.service';

function make(overrides: {
  create?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
  findUnique?: ReturnType<typeof vi.fn>;
  syncAgent?: ReturnType<typeof vi.fn>;
}) {
  const prisma = {
    listing: {
      create: overrides.create ?? vi.fn().mockResolvedValue({ id: 'lst_new' }),
      update: overrides.update ?? vi.fn().mockResolvedValue({ id: 'lst_1' }),
      findUnique: overrides.findUnique ?? vi.fn().mockResolvedValue({ realtorId: 'rlt_1' }),
    },
  } as unknown as PrismaService;
  const realtors = {
    syncAgent: overrides.syncAgent ?? vi.fn().mockResolvedValue('agt_1'),
  } as unknown as RealtorsService;
  return { service: new ListingsWriteService(prisma, realtors), prisma, realtors };
}

describe('ListingsWriteService.createDraft', () => {
  it('creates a DRAFT owned by the realtor with an agent id and merged defaults', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'lst_new' });
    const syncAgent = vi.fn().mockResolvedValue('agt_1');
    const { service } = make({ create, syncAgent });

    await expect(
      service.createDraft('rlt_1', { title: 'Yangi', priceSom: '500000000' }),
    ).resolves.toEqual({ id: 'lst_new' });

    expect(syncAgent).toHaveBeenCalledWith('rlt_1');
    const data = create.mock.calls[0]![0].data;
    expect(data).toMatchObject({
      status: 'DRAFT',
      realtorId: 'rlt_1',
      agentId: 'agt_1',
      title: 'Yangi',
      priceSom: BigInt(500000000),
      // an unsent field keeps its empty-string default so the NOT NULL column holds
      description: '',
    });
  });
});

describe('ListingsWriteService.update', () => {
  it('writes only the fields the request sent', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'lst_1' });
    const findUnique = vi.fn().mockResolvedValue({ realtorId: 'rlt_1' });
    const { service } = make({ update, findUnique });

    await service.update('rlt_1', 'lst_1', { district: 'Yunusobod tumani' });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'lst_1' },
      data: { district: 'Yunusobod tumani' },
    });
  });

  it('refuses a listing owned by someone else', async () => {
    const findUnique = vi.fn().mockResolvedValue({ realtorId: 'rlt_other' });
    const { service } = make({ findUnique });
    await expect(service.update('rlt_1', 'lst_1', {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('reports a missing listing as not found', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const { service } = make({ findUnique });
    await expect(service.update('rlt_1', 'lst_x', {})).rejects.toBeInstanceOf(NotFoundException);
  });
});

const PUBLISHABLE = {
  realtorId: 'rlt_1',
  status: 'DRAFT' as const,
  soldAt: null as Date | null,
  title: '3 xonali kvartira Chilonzorda',
  priceSom: BigInt(780000000),
  priceUsd: 65000,
  areaM2: 78,
  district: 'Chilonzor tumani',
  type: 'SECONDARY',
  deal: 'SALE',
  rooms: 3,
  _count: { images: 2 },
};

const NOW = new Date('2026-08-12T10:00:00Z');
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function makeStatus(
  row: Record<string, unknown> | null,
  realtor: { phone: string | null; trusted: boolean } = { phone: '+998901234567', trusted: true },
) {
  const update = vi.fn().mockResolvedValue({});
  const prisma = {
    listing: { findUnique: vi.fn().mockResolvedValue(row), update },
    realtor: { findUniqueOrThrow: vi.fn().mockResolvedValue(realtor) },
  } as unknown as PrismaService;
  const syncAgent = vi.fn().mockResolvedValue('agt_1');
  const service = new ListingsWriteService(prisma, { syncAgent } as unknown as RealtorsService);
  return { service, update, syncAgent };
}

describe('ListingsWriteService.changeStatus — publish', () => {
  it('publishes a complete listing by a trusted realtor to ACTIVE', async () => {
    const { service, update, syncAgent } = makeStatus(PUBLISHABLE, {
      phone: '+998901234567',
      trusted: true,
    });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW)).resolves.toEqual({
      status: 'ACTIVE',
    });
    expect(syncAgent).toHaveBeenCalledWith('rlt_1');
    expect(update).toHaveBeenCalledWith({
      where: { id: 'lst_1' },
      data: { status: 'ACTIVE', publishedAt: NOW, expiresAt: new Date(NOW.getTime() + TTL_MS) },
    });
  });

  it('sends an untrusted realtor to PENDING with no publish date', async () => {
    const { service, update } = makeStatus(PUBLISHABLE, { phone: '+998901234567', trusted: false });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW)).resolves.toEqual({
      status: 'PENDING',
    });
    expect(update).toHaveBeenCalledWith({ where: { id: 'lst_1' }, data: { status: 'PENDING' } });
  });

  it('refuses to publish without an image', async () => {
    const { service } = makeStatus({ ...PUBLISHABLE, _count: { images: 0 } });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW)).rejects.toThrow(/rasm/i);
  });

  it('refuses to publish without a phone on the profile', async () => {
    const { service } = makeStatus(PUBLISHABLE, { phone: null, trusted: true });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW)).rejects.toThrow(/telefon/i);
  });

  it('refuses to publish a listing with a too-short title', async () => {
    const { service } = makeStatus({ ...PUBLISHABLE, title: 'Uy' });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW)).rejects.toThrow();
  });
});

describe('ListingsWriteService.changeStatus — lifecycle', () => {
  it('marks an active listing sold and stamps soldAt', async () => {
    const { service, update } = makeStatus({ ...PUBLISHABLE, status: 'ACTIVE' });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'SOLD', NOW)).resolves.toEqual({
      status: 'SOLD',
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'lst_1' },
      data: { status: 'SOLD', soldAt: NOW },
    });
  });

  it('reactivates a sold listing inside the 48h window and clears soldAt', async () => {
    const soldAt = new Date(NOW.getTime() - 60 * 60 * 1000);
    const { service, update } = makeStatus({ ...PUBLISHABLE, status: 'SOLD', soldAt });
    await service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'lst_1' },
      data: { status: 'ACTIVE', soldAt: null },
    });
  });

  it('refuses to reactivate a sold listing after the window', async () => {
    const soldAt = new Date(NOW.getTime() - 49 * 60 * 60 * 1000);
    const { service } = makeStatus({ ...PUBLISHABLE, status: 'SOLD', soldAt });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'ACTIVE', NOW)).rejects.toThrow(/muddat/i);
  });

  it('rejects a transition not in the table', async () => {
    const { service } = makeStatus({ ...PUBLISHABLE, status: 'ACTIVE' });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'DRAFT', NOW)).rejects.toThrow();
  });

  it('refuses a listing owned by someone else', async () => {
    const { service } = makeStatus({ ...PUBLISHABLE, realtorId: 'rlt_other', status: 'ACTIVE' });
    await expect(service.changeStatus('rlt_1', 'lst_1', 'RESERVED', NOW)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
