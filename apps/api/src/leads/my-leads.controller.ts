import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentRealtor } from '../auth/current-realtor.decorator';
import { RealtorGuard } from '../auth/realtor.guard';
import { LeadDto, LeadStatusUpdateDto } from './leads.dto';
import { LeadsService } from './leads.service';

// Same 'me' prefix as RealtorsController/MyListingsController/StatsController —
// 'leads' does not collide with any route already registered there.
@ApiTags('me')
@Controller('me/leads')
@UseGuards(RealtorGuard)
@ApiUnauthorizedResponse({ description: 'Sessiya topilmadi' })
export class MyLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @ApiOkResponse({ type: [LeadDto] })
  findAll(@CurrentRealtor() realtorId: string) {
    return this.leads.findAllForRealtor(realtorId);
  }

  @Patch(':id')
  @ApiOkResponse({ type: LeadDto })
  updateStatus(
    @CurrentRealtor() realtorId: string,
    @Param('id') id: string,
    @Body() body: LeadStatusUpdateDto,
  ) {
    return this.leads.updateStatus(realtorId, id, body.status);
  }
}
