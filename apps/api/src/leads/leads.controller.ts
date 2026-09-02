import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { LeadOutcomeUpdateSchema } from '@rieltor/shared';
import { RealtorGuard } from '../agent/realtor.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { LeadsService } from './leads.service';

@Controller('leads')
@UseGuards(JwtGuard, RealtorGuard)
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  feed() {
    return this.leads.feed();
  }

  // Declared before `:id` so the literal path is not captured as an id.
  @Get('mine')
  mine(@CurrentUser() u: { id: string }) {
    return this.leads.mine(u.id);
  }

  // Declared before `:id` so the literal path is not captured as an id.
  @Get('stats')
  stats(@CurrentUser() u: { id: string }) {
    return this.leads.stats(u.id);
  }

  @Get(':id')
  one(@Param('id') id: string, @CurrentUser() u: { id: string }) {
    return this.leads.findOne(id, u.id);
  }

  @Post(':id/claim')
  claim(@Param('id') id: string, @CurrentUser() u: { id: string }) {
    return this.leads.claim(id, u.id);
  }

  @Patch(':id/outcome')
  setOutcome(@Param('id') id: string, @CurrentUser() u: { id: string }, @Body() body: unknown) {
    const { stage, lostReason } = LeadOutcomeUpdateSchema.parse(body);
    return this.leads.setOutcome(id, u.id, stage, lostReason);
  }
}
