import { Injectable } from '@nestjs/common';
import type { ValuationRequest, ValuationResult } from '@rieltor/shared';
import { GeminiService } from '../ai/gemini.service';
import { PrismaService } from '../prisma/prisma.service';

/** Only the two fields the median math needs — keeps the comparables query cheap. */
const COMPARABLE_SELECT = { priceSom: true, areaM2: true } as const;

@Injectable()
export class ValuationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  async estimate(req: ValuationRequest): Promise<ValuationResult> {
    const { comparables, comparablesCount } = await this.loadComparables(req);
    const perM2 = median(comparables.map((c) => Number(c.priceSom) / c.areaM2));

    const estimate = Math.round(perM2 * req.areaM2);
    const low = Math.round(estimate * 0.9);
    const high = Math.round(estimate * 1.1);

    return {
      estimateSom: String(estimate),
      lowSom: String(low),
      highSom: String(high),
      perM2Som: String(Math.round(perM2)),
      comparablesCount,
      explanation: await this.explain(req, estimate),
    };
  }

  /**
   * Cascades from the narrowest comparable set to the widest so a valuation
   * is always possible, even for a district/room combo with thin inventory:
   * same type + district + room bucket, then the whole district, then the
   * whole type. `comparablesCount` reflects whichever level was actually used.
   */
  private async loadComparables(req: ValuationRequest) {
    // A valuation request has no `deal` param — it's implicitly asking "what
    // would this sell for", so RENT listings (monthly price, a different
    // scale entirely) must never enter the sale-price median.
    const base = { status: 'PUBLISHED', type: req.type, deal: 'SALE' } as const;

    if (req.rooms !== null) {
      const roomBucket = await this.prisma.listing.findMany({
        where: { ...base, district: req.district, rooms: req.rooms },
        select: COMPARABLE_SELECT,
      });
      if (roomBucket.length > 0) {
        return { comparables: roomBucket, comparablesCount: roomBucket.length };
      }
    }

    const districtBucket = await this.prisma.listing.findMany({
      where: { ...base, district: req.district },
      select: COMPARABLE_SELECT,
    });
    if (districtBucket.length > 0) {
      return { comparables: districtBucket, comparablesCount: districtBucket.length };
    }

    // Global median per m² for the type — the widest, always-available fallback.
    const typeBucket = await this.prisma.listing.findMany({
      where: base,
      select: COMPARABLE_SELECT,
    });
    return { comparables: typeBucket, comparablesCount: typeBucket.length };
  }

  private async explain(req: ValuationRequest, estimate: number): Promise<string> {
    const prompt = `Sen O'zbekiston ko'chmas mulk bo'yicha yordamchisan. Quyidagi taxminiy narxni 2-3 gapda, do'stona va sodda o'zbek tilida tushuntir. Raqamlarni takrorlama, faqat nega shu oraliq ekanini ayt (tuman, xona soni, maydon, bozor holati). Tuman: ${req.district}, xona: ${req.rooms ?? "ko'rsatilmagan"}, maydon: ${req.areaM2} m², taxmin: ${estimate} so'm.`;
    return (
      (await this.gemini.generate(prompt, { maxTokens: 256 })) ??
      `Ushbu taxmin ${req.district}dagi o'xshash e'lonlarning o'rtacha m² narxiga asoslangan. Aniq narx holat, qavat va ta'mirga qarab farq qilishi mumkin.`
    );
  }
}

/** Standard median: sort, take the middle (average the two middles when even). Empty input is 0. */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const upper = sorted[mid];
  // Unreachable: mid is always a valid index into a non-empty sorted array.
  if (upper === undefined) return 0;
  if (sorted.length % 2 !== 0) return upper;
  const lower = sorted[mid - 1];
  return lower === undefined ? upper : (lower + upper) / 2;
}
