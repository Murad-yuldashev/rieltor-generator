import { Controller, Get, UseGuards } from '@nestjs/common';
import type { FinanceInsightResponse } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { GeminiService } from '../ai/gemini.service';
import { DeveloperService } from './developer.service';
import { DeveloperGuard } from './developer.guard';
import { FinanceService } from './finance.service';
import { buildInsightTemplate } from './finance-insight.template';
import { buildInsightPrompt, parseInsight } from './finance-insight.parse';

@Controller('crm')
@UseGuards(JwtGuard, DeveloperGuard)
export class FinanceController {
  constructor(
    private readonly finance: FinanceService,
    private readonly developer: DeveloperService,
    private readonly gemini: GeminiService,
  ) {}

  @Get('finance')
  async summary(@CurrentUser() u: { id: string }) {
    return this.finance.summary(await this.developer.orgIdOf(u.id));
  }

  @Get('debtors')
  async debtors(@CurrentUser() u: { id: string }) {
    return this.finance.debtors(await this.developer.orgIdOf(u.id));
  }

  @Get('finance/insight')
  async insight(@CurrentUser() u: { id: string }): Promise<FinanceInsightResponse> {
    const orgId = await this.developer.orgIdOf(u.id);
    const [summary, debtors] = await Promise.all([
      this.finance.summary(orgId),
      this.finance.debtors(orgId),
    ]);
    const template = buildInsightTemplate(summary, debtors);
    const raw = await this.gemini.generate(buildInsightPrompt(summary, debtors), {
      maxTokens: 300,
    });
    return parseInsight(raw, template);
  }
}
