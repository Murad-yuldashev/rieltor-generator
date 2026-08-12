import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentRealtor } from '../auth/current-realtor.decorator';
import { RealtorGuard } from '../auth/realtor.guard';
import { OwnerListingDetailDto, OwnerListingSummaryDto } from './listings.dto';
import { ListingsService } from './listings.service';

@ApiTags('me')
@Controller('me/objects')
@UseGuards(RealtorGuard)
@ApiUnauthorizedResponse({ description: 'Sessiya topilmadi' })
export class MyListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  @ApiOkResponse({ type: [OwnerListingSummaryDto] })
  findOwn(@CurrentRealtor() realtorId: string) {
    return this.listings.findOwn(realtorId);
  }

  @Get(':id')
  @ApiOkResponse({ type: OwnerListingDetailDto })
  findOwnOne(@CurrentRealtor() realtorId: string, @Param('id') id: string) {
    return this.listings.findOwnOne(realtorId, id);
  }
}
