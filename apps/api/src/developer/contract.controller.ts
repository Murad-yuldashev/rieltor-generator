import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ContractCancelSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { DeveloperService } from './developer.service';
import { DeveloperGuard } from './developer.guard';
import { ContractService } from './contract.service';

// @Controller('crm/contracts') → /api/crm/contracts. DeveloperGuard resolves the caller's org.
@Controller('crm/contracts')
@UseGuards(JwtGuard, DeveloperGuard)
export class ContractController {
  constructor(
    private readonly contracts: ContractService,
    private readonly developer: DeveloperService,
  ) {}

  @Get()
  async list(@CurrentUser() u: { id: string }) {
    return this.contracts.list(await this.developer.orgIdOf(u.id));
  }

  @Get(':id')
  async getOne(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.contracts.getOne(await this.developer.orgIdOf(u.id), id);
  }

  @Post(':id/sign')
  async sign(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.contracts.sign(await this.developer.orgIdOf(u.id), id);
  }

  @Post(':id/cancel')
  async cancel(@CurrentUser() u: { id: string }, @Param('id') id: string, @Body() body: unknown) {
    const { reason } = ContractCancelSchema.parse(body);
    return this.contracts.cancel(await this.developer.orgIdOf(u.id), id, reason);
  }
}
