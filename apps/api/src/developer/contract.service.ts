import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Contract, ContractRow } from '@rieltor/shared';
import { Prisma } from '@prisma/client';
import type { Contract as ContractRecord } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// NOTE: `ContractRecord` (the full Prisma row type) carries `agreedAmount: bigint | null`,
// `signedAt: Date | null`, and the Prisma `Currency`/`ContractStatus` enums, which are the
// same string literals as the shared Zod enums — so no per-enum type alias is needed. Typing
// the param as ContractRecord (not an inline literal) uses the import (no no-unused-vars lint)
// and accepts a findMany row that also carries an included `unit` (extra props are allowed).
/** Row -> `Contract` DTO. `agreedAmount` BigInt -> string|null; dates -> ISO. */
function toContract(c: ContractRecord): Contract {
  return {
    id: c.id,
    number: c.number,
    unitId: c.unitId,
    fixationId: c.fixationId,
    buyerId: c.buyerId,
    buyerName: c.buyerName,
    buyerPhone: c.buyerPhone,
    agreedAmount: c.agreedAmount === null ? null : String(c.agreedAmount),
    currency: c.currency,
    status: c.status,
    signedAt: c.signedAt ? c.signedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  };
}

@Injectable()
export class ContractService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create the sale contract inside the caller's convert transaction (the count===1 gate).
   * Assigns the per-org-per-year number via an atomic counter, then writes the row.
   * NEVER opens its own tx — it composes into the existing convert $transaction, mirroring
   * WalletService.credit / OrgWalletService.debitForCommission.
   */
  async create(
    tx: Prisma.TransactionClient,
    input: {
      orgId: string;
      unitId: string;
      bookingId: string;
      fixationId: string | null;
      buyerId: string | null;
      buyerName: string;
      buyerPhone: string;
      agreedAmount: bigint | null;
    },
  ): Promise<void> {
    const year = new Date().getFullYear();
    // Raw INSERT … ON CONFLICT DO UPDATE — the ONLY race-safe way to increment the counter.
    // Prisma's `upsert` on a COMPOUND key (orgId_year) does NOT compile to native ON CONFLICT
    // (Prisma delegates to a native upsert only for a single-unique-field where); it falls back
    // to an emulated find-then-insert, which on the FIRST convert of a (org, year) lets two
    // concurrent converts both INSERT → one hits P2002 → the whole convert rolls back. This raw
    // statement is atomic including the first insert. Tagged-template args are parameterized
    // (mirrors the `tx.$queryRaw`… FOR UPDATE`` idiom already in book()). `year` is a JS number.
    const rows = await tx.$queryRaw<{ lastSeq: number }[]>`
      INSERT INTO "OrgContractCounter" ("orgId", "year", "lastSeq")
      VALUES (${input.orgId}, ${year}, 1)
      ON CONFLICT ("orgId", "year")
      DO UPDATE SET "lastSeq" = "OrgContractCounter"."lastSeq" + 1
      RETURNING "lastSeq"
    `;
    const number = `${year}-${String(rows[0]!.lastSeq).padStart(4, '0')}`;
    await tx.contract.create({
      data: {
        number,
        orgId: input.orgId,
        unitId: input.unitId,
        bookingId: input.bookingId,
        fixationId: input.fixationId,
        buyerId: input.buyerId,
        buyerName: input.buyerName,
        buyerPhone: input.buyerPhone,
        agreedAmount: input.agreedAmount,
        // currency defaults SOM; status defaults ACTIVE.
      },
    });
  }

  /** All contracts of the caller's org (newest first, capped), each with unit + building labels. */
  async list(orgId: string): Promise<ContractRow[]> {
    const rows = await this.prisma.contract.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { unit: { select: { number: true, building: { select: { name: true } } } } },
    });
    return rows.map((r) => ({
      ...toContract(r),
      unitNumber: r.unit.number,
      buildingName: r.unit.building.name,
    }));
  }

  /** One contract, org-scoped. Foreign/missing -> 404. */
  async getOne(orgId: string, id: string): Promise<Contract> {
    const row = await this.prisma.contract.findFirst({ where: { id, orgId } });
    if (!row) throw new NotFoundException('Shartnoma topilmadi');
    return toContract(row);
  }

  /**
   * Stub signing: stamp `signedAt` if unset (idempotent — already-signed returns as-is).
   * Org-scoped (foreign/missing -> 404); a CANCELLED contract cannot be signed -> 409.
   */
  async sign(orgId: string, id: string): Promise<Contract> {
    const row = await this.prisma.contract.findFirst({ where: { id, orgId } });
    if (!row) throw new NotFoundException('Shartnoma topilmadi');
    if (row.status === 'CANCELLED') throw new ConflictException('Bekor qilingan shartnoma');
    if (row.signedAt) return toContract(row);
    const signed = await this.prisma.contract.update({
      where: { id },
      data: { signedAt: new Date() },
    });
    return toContract(signed);
  }
}
