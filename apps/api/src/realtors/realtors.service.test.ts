import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { RealtorsService } from './realtors.service';

const REALTOR = {
  agentId: null as string | null,
  name: 'Ali Valiyev',
  agency: 'Toshkent Uy',
  photoUrl: 'https://t.me/i/userpic/320/ali.jpg',
  phone: '+998901234567',
  tgUsername: 'ali_rieltor',
};

function fakePrisma(overrides: {
  findUniqueOrThrow?: ReturnType<typeof vi.fn>;
  agentCreate?: ReturnType<typeof vi.fn>;
  agentUpdate?: ReturnType<typeof vi.fn>;
  realtorUpdate?: ReturnType<typeof vi.fn>;
}) {
  return {
    realtor: {
      findUniqueOrThrow: overrides.findUniqueOrThrow ?? vi.fn().mockResolvedValue(REALTOR),
      update: overrides.realtorUpdate ?? vi.fn().mockResolvedValue({ id: 'rlt_1' }),
    },
    agent: {
      create: overrides.agentCreate ?? vi.fn().mockResolvedValue({ id: 'agt_new' }),
      update: overrides.agentUpdate ?? vi.fn().mockResolvedValue({ id: 'agt_old' }),
    },
  } as unknown as PrismaService;
}

describe('RealtorsService.syncAgent', () => {
  it('creates and links an agent on the first call', async () => {
    const agentCreate = vi.fn().mockResolvedValue({ id: 'agt_new' });
    const realtorUpdate = vi.fn().mockResolvedValue({ id: 'rlt_1' });
    const service = new RealtorsService(fakePrisma({ agentCreate, realtorUpdate }));

    await expect(service.syncAgent('rlt_1')).resolves.toBe('agt_new');
    expect(agentCreate).toHaveBeenCalledWith({
      data: {
        name: 'Ali Valiyev',
        agency: 'Toshkent Uy',
        photoUrl: 'https://t.me/i/userpic/320/ali.jpg',
        phone: '+998901234567',
        telegram: 'https://t.me/ali_rieltor',
      },
      select: { id: true },
    });
    expect(realtorUpdate).toHaveBeenCalledWith({
      where: { id: 'rlt_1' },
      data: { agentId: 'agt_new' },
    });
  });

  it('updates the existing agent in place on later calls', async () => {
    const findUniqueOrThrow = vi.fn().mockResolvedValue({ ...REALTOR, agentId: 'agt_old' });
    const agentUpdate = vi.fn().mockResolvedValue({ id: 'agt_old' });
    const agentCreate = vi.fn();
    const service = new RealtorsService(
      fakePrisma({ findUniqueOrThrow, agentUpdate, agentCreate }),
    );

    await expect(service.syncAgent('rlt_1')).resolves.toBe('agt_old');
    expect(agentCreate).not.toHaveBeenCalled();
    expect(agentUpdate).toHaveBeenCalledWith({
      where: { id: 'agt_old' },
      data: expect.objectContaining({ phone: '+998901234567' }),
    });
  });

  it('falls back to empty strings for fields the realtor has not filled in', async () => {
    const findUniqueOrThrow = vi.fn().mockResolvedValue({
      agentId: null,
      name: 'Ali',
      agency: null,
      photoUrl: null,
      phone: null,
      tgUsername: null,
    });
    const agentCreate = vi.fn().mockResolvedValue({ id: 'agt_new' });
    const service = new RealtorsService(fakePrisma({ findUniqueOrThrow, agentCreate }));

    await service.syncAgent('rlt_1');
    expect(agentCreate).toHaveBeenCalledWith({
      data: { name: 'Ali', agency: '', photoUrl: '', phone: '', telegram: '' },
      select: { id: true },
    });
  });
});
