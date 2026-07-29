import { Injectable, NotFoundException } from '@nestjs/common';
import type { ObjectDetail, ObjectListItem } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';
import { detailgaAylantir, royxatgaAylantir } from './mapper';

const TOLIQ_INCLUDE = { agent: true, rasmlar: { orderBy: { tartib: 'asc' } } } as const;

@Injectable()
export class ObjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async royxat(): Promise<ObjectListItem[]> {
    const qatorlar = await this.prisma.object.findMany({
      include: TOLIQ_INCLUDE,
      orderBy: { id: 'asc' },
    });
    return qatorlar.map(royxatgaAylantir);
  }

  async bittasi(id: string): Promise<ObjectDetail> {
    const qator = await this.prisma.object.findUnique({ where: { id }, include: TOLIQ_INCLUDE });
    if (!qator) {
      throw new NotFoundException(`Obyekt topilmadi: ${id}`);
    }
    return detailgaAylantir(qator);
  }
}
