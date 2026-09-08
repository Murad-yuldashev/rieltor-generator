import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { DeveloperService } from './developer.service';
import { DeveloperGuard } from './developer.guard';
import { FinanceService } from './finance.service';

@Controller('crm')
@UseGuards(JwtGuard, DeveloperGuard)
export class FinanceController {
  constructor(
    private readonly finance: FinanceService,
    private readonly developer: DeveloperService,
  ) {}

  @Get('finance')
  async summary(@CurrentUser() u: { id: string }) {
    return this.finance.summary(await this.developer.orgIdOf(u.id));
  }

  @Get('debtors')
  async debtors(@CurrentUser() u: { id: string }) {
    return this.finance.debtors(await this.developer.orgIdOf(u.id));
  }
}
