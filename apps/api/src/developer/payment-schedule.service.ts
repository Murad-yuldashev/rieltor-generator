import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PaymentScheduleView } from '@rieltor/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DeveloperService } from './developer.service';

/** Add `n` whole months to a date (UTC). Overflow rolls forward per JS Date semantics
 *  (e.g. Jan-31 + 1mo → early March); acceptable for due dates (schedules start on day ≤28 in practice). */
function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() + n);
  return r;
}

/** Generate the schedule's items (down payment seq 0 when > 0; N monthly installments seq 1..N).
 *  base = floor((A − D)/N); the LAST installment absorbs the remainder so Σ items === A. */
function generateItems(
  agreedAmount: bigint,
  downPaymentSom: bigint,
  count: number,
  startDate: Date,
) {
  const remaining = agreedAmount - downPaymentSom;
  const base = remaining / BigInt(count); // BigInt floor division (remaining ≥ 0)
  const items: { seq: number; dueDate: Date; amountSom: bigint }[] = [];
  if (downPaymentSom > 0n) items.push({ seq: 0, dueDate: startDate, amountSom: downPaymentSom });
  for (let i = 1; i <= count; i++) {
    const amountSom = i === count ? remaining - base * BigInt(count - 1) : base;
    items.push({ seq: i, dueDate: addMonths(startDate, i), amountSom });
  }
  return { base, items };
}

type ScheduleRow = Prisma.PaymentScheduleGetPayload<{ include: { installments: true } }>;

function toView(s: ScheduleRow): PaymentScheduleView {
  const items = [...s.installments].sort((a, b) => a.seq - b.seq);
  const total = items.reduce((acc, it) => acc + it.amountSom, 0n);
  const paid = items.reduce((acc, it) => (it.status === 'PAID' ? acc + it.amountSom : acc), 0n);
  return {
    id: s.id,
    contractId: s.contractId,
    currency: s.currency,
    downPaymentSom: String(s.downPaymentSom),
    installmentCount: s.installmentCount,
    installmentSom: String(s.installmentSom),
    startDate: s.startDate.toISOString(),
    frequency: s.frequency,
    installments: items.map((it) => ({
      id: it.id,
      seq: it.seq,
      dueDate: it.dueDate.toISOString(),
      amountSom: String(it.amountSom),
      status: it.status,
      paidAt: it.paidAt ? it.paidAt.toISOString() : null,
    })),
    totalSom: String(total),
    paidSom: String(paid),
    remainingSom: String(total - paid),
  };
}

@Injectable()
export class PaymentScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dev: DeveloperService,
  ) {}

  /** Create the schedule + generate items on an ACTIVE, priced contract with no existing schedule. */
  async create(
    orgId: string,
    contractId: string,
    input: { downPaymentSom: string; installmentCount: number; startDate: string },
  ): Promise<PaymentScheduleView> {
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, orgId },
      select: {
        id: true,
        status: true,
        agreedAmount: true,
        currency: true,
        paymentSchedule: { select: { id: true } },
      },
    });
    if (!contract) throw new NotFoundException('Shartnoma topilmadi');
    if (contract.status !== 'ACTIVE') throw new ConflictException('Bekor qilingan shartnoma');
    if (contract.agreedAmount === null) throw new BadRequestException("Kelishilgan summa yo'q");
    if (contract.paymentSchedule) throw new ConflictException('Jadval allaqachon mavjud');
    const down = BigInt(input.downPaymentSom);
    // down must leave a positive remainder to split into installments (a fully-down-paid sale
    // needs no schedule). This also rules out the degenerate all-zero-installment case (D === A).
    if (down < 0n || down >= contract.agreedAmount)
      throw new BadRequestException("Noto'g'ri boshlang'ich to'lov");
    const { base, items } = generateItems(
      contract.agreedAmount,
      down,
      input.installmentCount,
      new Date(input.startDate),
    );
    let scheduleId: string;
    try {
      scheduleId = await this.prisma.$transaction(async (tx) => {
        const s = await tx.paymentSchedule.create({
          data: {
            contractId,
            currency: contract.currency,
            downPaymentSom: down,
            installmentCount: input.installmentCount,
            installmentSom: base,
            startDate: new Date(input.startDate),
          },
          select: { id: true },
        });
        await tx.paymentInstallment.createMany({
          data: items.map((it) => ({
            scheduleId: s.id,
            seq: it.seq,
            dueDate: it.dueDate,
            amountSom: it.amountSom,
          })),
        });
        return s.id;
      });
    } catch (e) {
      // A concurrent create won the race on contractId @unique — surface a clean 409, not a raw 500
      // (mirrors the P2002 idiom in wallet.service.ts:23 / org-wallet.service.ts:28).
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Jadval allaqachon mavjud');
      }
      throw e;
    }
    return this.byId(scheduleId);
  }

  /** The contract's schedule (org-scoped) + summary, or null if none. */
  async getForContract(orgId: string, contractId: string): Promise<PaymentScheduleView | null> {
    const s = await this.prisma.paymentSchedule.findFirst({
      where: { contractId, contract: { orgId } },
      include: { installments: true },
    });
    return s ? toView(s) : null;
  }

  /** Delete the schedule (org-scoped) — only when NO installment is paid. */
  async remove(orgId: string, contractId: string): Promise<void> {
    const s = await this.prisma.paymentSchedule.findFirst({
      where: { contractId, contract: { orgId } },
      select: {
        id: true,
        installments: { where: { status: 'PAID' }, select: { id: true }, take: 1 },
      },
    });
    if (!s) throw new NotFoundException('Jadval topilmadi');
    if (s.installments.length > 0)
      throw new ConflictException("To'lov qayd etilgan jadvalni o'chirib bo'lmaydi");
    await this.prisma.paymentSchedule.delete({ where: { id: s.id } });
  }

  /** Record a stub payment for one installment (org-scoped): create Payment + flip to PAID.
   *  The PENDING→PAID updateMany count===1 is the atomic idempotency gate (the house idiom) — a
   *  concurrent/re-fired pay gets count===0 → a clean 409, never a Payment.installmentId @unique 500. */
  async pay(
    orgId: string,
    installmentId: string,
    note: string | undefined,
    userId: string,
  ): Promise<PaymentScheduleView> {
    const inst = await this.prisma.paymentInstallment.findFirst({
      where: { id: installmentId, schedule: { contract: { orgId } } },
      select: {
        id: true,
        status: true,
        amountSom: true,
        scheduleId: true,
        schedule: { select: { contract: { select: { status: true } } } },
      },
    });
    if (!inst) throw new NotFoundException('Ulush topilmadi');
    if (inst.schedule.contract.status !== 'ACTIVE')
      throw new ConflictException('Bekor qilingan shartnoma');
    if (inst.status !== 'PENDING') throw new ConflictException('Ulush allaqachon to’langan');
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.paymentInstallment.updateMany({
        where: { id: installmentId, status: 'PENDING' },
        data: { status: 'PAID', paidAt: new Date() },
      });
      if (count !== 1) throw new ConflictException('Ulush allaqachon to’langan'); // lost the race
      await tx.payment.create({
        data: {
          installmentId,
          amountSom: inst.amountSom,
          method: 'STUB',
          note: note ?? null,
          createdById: userId,
        },
      });
    });
    return this.byId(inst.scheduleId);
  }

  private async byId(scheduleId: string): Promise<PaymentScheduleView> {
    const s = await this.prisma.paymentSchedule.findUniqueOrThrow({
      where: { id: scheduleId },
      include: { installments: true },
    });
    return toView(s);
  }
}
