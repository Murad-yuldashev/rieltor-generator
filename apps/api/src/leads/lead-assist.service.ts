import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { LeadAssistResponse } from '@rieltor/shared';
import { GeminiService } from '../ai/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import { buildAssistTemplate, type LeadFacts } from './lead-assist.template';
import { buildAssistPrompt, parseAssist } from './lead-assist.parse';

@Injectable()
export class LeadAssistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  async assist(leadId: string, realtorId: string): Promise<LeadAssistResponse> {
    const lead = await this.prisma.propertyRequest.findUnique({
      where: { id: leadId },
      select: {
        claimedById: true,
        outcomeStage: true,
        deal: true,
        type: true,
        district: true,
        roomsMin: true,
        priceMaxSom: true,
        areaMinM2: true,
        note: true,
      },
    });
    if (!lead) throw new NotFoundException('Lead topilmadi');
    if (lead.claimedById !== realtorId) throw new ForbiddenException('Bu lead sizniki emas');
    if (lead.outcomeStage == null) throw new ConflictException('Bu lead hali olinmagan');

    const facts: LeadFacts = { ...lead, outcomeStage: lead.outcomeStage };
    const template = buildAssistTemplate(facts);
    const raw = await this.gemini.generate(buildAssistPrompt(facts), { maxTokens: 400 });
    return parseAssist(raw, template);
  }
}
