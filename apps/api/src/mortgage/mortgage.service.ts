import { Injectable } from '@nestjs/common';
import type { MortgageProgram } from '@rieltor/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MortgageService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active bank programs for the calculator, in display order. Public, read-only. */
  async listPrograms(): Promise<MortgageProgram[]> {
    const rows = await this.prisma.mortgageProgram.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
    });
    return rows.map((p) => ({
      id: p.id,
      bankName: p.bankName,
      programName: p.programName,
      rateBps: p.rateBps,
      maxTermMonths: p.maxTermMonths,
      minDownBps: p.minDownBps,
      maxAmountSom: p.maxAmountSom === null ? null : String(p.maxAmountSom),
    }));
  }
}
